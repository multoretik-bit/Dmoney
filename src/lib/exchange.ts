// Rates are expressed as units of each currency per 1 USD. These complete
// fallbacks prevent unsupported currencies from being treated as 1:1 with USD
// during the first render or when the user is offline.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.867144,
  RUB: 83.274165,
  KZT: 465.072777,
  THB: 33.154966,
  KGS: 87.491799,
  GBP: 0.75161,
  TRY: 47.81172,
  GEL: 2.61476,
};

let cachedRates: Record<string, number> = { ...FALLBACK_RATES };
let lastFetch = 0;
const CACHE_DURATION = 1000 * 60; // Poll for newly published quotes every minute.
let refreshInFlight: Promise<Record<string, number>> | null = null;
const REQUEST_TIMEOUT = 8000;
const STORAGE_KEY = 'dmoney-exchange-rates';


function isValidRates(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object') return false;
  const rates = value as Record<string, unknown>;
  return Object.keys(FALLBACK_RATES).every(currency => {
    const rate = rates[currency];
    return typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
  });
}

export function hydrateCachedRates(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const stored = JSON.parse(raw) as { rates?: unknown; fetchedAt?: unknown };
    if (!isValidRates(stored.rates)) return false;

    cachedRates = { ...FALLBACK_RATES, ...stored.rates };
    lastFetch = typeof stored.fetchedAt === 'number' ? stored.fetchedAt : 0;
    return true;
  } catch {
    return false;
  }
}

function persistRates() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      rates: cachedRates,
      fetchedAt: lastFetch,
    }));
  } catch {
    // Private browsing or storage pressure can disable localStorage. The live
    // in-memory rates still remain valid for the current session.
  }
}

async function fetchRateJson(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error('Exchange-rate request failed: ' + response.status);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchLatestRates(force = false) {
  if (refreshInFlight) return refreshInFlight;
  if (!force && Date.now() - lastFetch < CACHE_DURATION) return cachedRates;

  refreshInFlight = (async () => {
    try {
      const data = await fetchRateJson('https://api.exchangerate.fun/latest?base=USD');
      if (!isValidRates(data?.rates)) throw new Error('Invalid exchange rates');
      cachedRates = { ...FALLBACK_RATES, ...data.rates };
      lastFetch = Date.now();
      persistRates();
    } catch (error) {
      console.warn('Live exchange-rate source unavailable:', error);
      // Keep the last successful quote during an outage; do not replace it
      // with a daily fixing that makes the capital jump backwards in time.
      if (lastFetch > 0) return cachedRates;
      try {
        // The fallback gets its own timeout, even if the primary timed out.
        const data = await fetchRateJson('https://open.er-api.com/v6/latest/USD');
        if (!isValidRates(data?.rates)) throw new Error('Invalid fallback rates');
        cachedRates = { ...FALLBACK_RATES, ...data.rates };
        lastFetch = Date.now();
        persistRates();
      } catch (fallbackError) {
        console.warn('Exchange-rate fallback unavailable:', fallbackError);
      }
    }
    return cachedRates;
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const fromRate = cachedRates[fromCurrency];
  const toRate = cachedRates[toCurrency];
  if (!fromRate || !toRate) {
    console.warn(`Missing exchange rate for ${fromCurrency} or ${toCurrency}`);
    return 1;
  }
  return toRate / fromRate;
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}
