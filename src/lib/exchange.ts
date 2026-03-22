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

export async function fetchLatestRates() {
  const now = Date.now();
  if (now - lastFetch < CACHE_DURATION) return cachedRates;

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    if (data && data.rates) {
      cachedRates = data.rates;
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
