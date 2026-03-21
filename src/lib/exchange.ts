// Mock Exchange Rates against USD as base 1
const MOCK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  RUB: 92.5,
  KZT: 450.0,
  GBP: 0.79,
  TRY: 32.0,
  GEL: 2.67
};

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const fromRate = MOCK_RATES[fromCurrency] || 1;
  const toRate = MOCK_RATES[toCurrency] || 1;
  // Convert from first to USD, then from USD to target
  return toRate / fromRate;
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}
