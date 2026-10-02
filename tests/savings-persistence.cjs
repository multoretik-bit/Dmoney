const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let storage = new Map();
let user = {id:'test-user'};
let fail = false;
let blocked = null;
const writes = [];
const supabase = {auth:{getUser:async()=>({data:{user},error:null})},from:()=>({upsert:async payload=>{
  writes.push(JSON.parse(JSON.stringify(payload)));
  if (blocked) {const wait=blocked; blocked=null; await wait;}
  return {error:fail ? new Error('Simulated offline') : null};
}})};
function loadStore() {
 const cache = new Map();
 function load(name) {
  if(name==='@/lib/supabase') return {supabase};
  if(name==='zustand/middleware') {
   const middleware=require(name);
   return {...middleware,persist:(fn,opts)=>middleware.persist(fn,{...opts,storage:middleware.createJSONStorage(()=>({getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}))})};
  }
  if(!name.startsWith('@/') && !name.startsWith('.')) return require(name);
  const file=name.startsWith('@/') ? path.join(root,'src',name.slice(2)+'.ts') : path.join(root,'src/lib',name.replace('./','')+'.ts');
  if(cache.has(file)) return cache.get(file).exports;
  const mod={exports:{}};cache.set(file,mod);
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',js)(load,mod,mod.exports);
  return mod.exports;
 }
 return load('@/store/useStore').useStore;
}
(async()=>{
 let store=loadStore();
 store.setState({user,preferences:{baseCurrency:'USD',savedColors:[]}});
 store.getState().setSavingsGoalTarget('savings',1000);
 await store.getState().syncPendingSavings();
 assert.equal(writes.at(-1).savings_goals.savings.target,1000);
 assert.equal(store.getState().pendingSavings,null);
 fail=true;
 store.getState().addSavingsProgress('savings',100);
 await assert.rejects(store.getState().syncPendingSavings(),/offline/);
 assert.equal(store.getState().preferences.savingsGoals.savings.saved,100);
 assert.ok(store.getState().pendingSavings);
 store=loadStore(); // Reload from the real persist middleware's serialized storage.
 assert.equal(store.getState().preferences.savingsGoals.savings.saved,100);
 assert.ok(store.getState().pendingSavings);
 fail=false;
 await store.getState().syncPendingSavings();
 assert.equal(writes.at(-1).savings_goals.savings.saved,100);
 let release;
 blocked=new Promise(resolve=>release=resolve);
 store.getState().addSavingsProgress('savings',50);
 const inFlight=store.getState().syncPendingSavings();
 await new Promise(resolve=>setImmediate(resolve));
 store.getState().addSavingsProgress('savings',25);
 release(); await inFlight;
 assert.equal(writes.at(-1).savings_goals.savings.saved,175);
 assert.equal(store.getState().pendingSavings,null);
 user=null;
 store.getState().addSavingsProgress('savings',10);
 await store.getState().syncPendingSavings();
 const count=writes.length;
 user={id:'other-user'};
 await store.getState().syncPendingSavings();
 assert.equal(writes.length,count,'An account must not receive another account edits');
 store.getState().addSavingsProgress('savings',NaN);
 assert.equal(store.getState().preferences.savingsGoals.savings.saved,185);
 console.log('PASS: cloud saving, offline reload and retry, rapid deposits, account isolation, invalid amounts');
})().catch(error=>{console.error(error);process.exitCode=1});
