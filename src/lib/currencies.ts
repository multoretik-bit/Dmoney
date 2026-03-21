export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
];

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const data = await res.json();
    if (data && data.rates && data.rates[to]) {
      return amount * data.rates[to];
    }
    return amount; // fallback 
  } catch (error) {
    console.error('Failed to fetch exchange rate', error);
    return amount;
  }
}
