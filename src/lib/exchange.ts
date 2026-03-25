// Real Exchange Rates using open.er-api.com
let cachedRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  RUB: 92.5,
  KZT: 450.0,
  GBP: 0.79,
  TRY: 32.0,
  GEL: 2.67
};

let lastFetch = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

import { fetchCBRRates } from './cbr';

export async function fetchLatestRates() {
  const now = Date.now();
  if (now - lastFetch < CACHE_DURATION) return cachedRates;

  try {
    // Fetch both, but prioritize CBR for RUB if needed
    const [erResponse, cbrData] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD'),
      fetchCBRRates()
    ]);
    
    const data = await erResponse.json();
    if (data && data.rates) {
      cachedRates = { ...data.rates };
      
      // If CBR data is available, we can override/augment rates
      // CBR gives rates against RUB, so we need to convert to USD-base
      if (cbrData && cbrData.Valute) {
          const usdToRub = cbrData.Valute.USD.Value / cbrData.Valute.USD.Nominal;
          cachedRates['RUB'] = usdToRub;
          
          // Optionally adjust other currencies relative to RUB if needed, 
          // but er-api is usually better for non-RUB pairs.
      }
      
      lastFetch = now;
    }
  } catch (error) {
    console.error('Failed to fetch rates:', error);
  }
  return cachedRates;
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const fromRate = cachedRates[fromCurrency] || 1;
  const toRate = cachedRates[toCurrency] || 1;
  return toRate / fromRate;
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

// Initial fetch attempt (silent)
if (typeof window !== 'undefined') {
  fetchLatestRates();
}
