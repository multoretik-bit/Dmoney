export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'KGS', symbol: 'с', name: 'Kyrgyzstani Som' },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'AMD', symbol: '֏', name: 'Armenian Dram' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'MDL', symbol: 'L', name: 'Moldovan Leu' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Rial' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'TJS', symbol: 'SM', name: 'Tajikistani Somoni' },
  { code: 'TMT', symbol: 'T', name: 'Turkmenistani Manat' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'UZS', symbol: "so'm", name: 'Uzbekistani Som' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

export const COMMON_CURRENCIES = ['USD', 'EUR', 'RUB', 'KZT', 'THB', 'KGS', 'GEL', 'TRY'];

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const data = await res.json();
    if (data && data.rates && data.rates[to]) {
      return amount * data.rates[to];
    }
    return amount; 
  } catch (error) {
    console.error('Failed to fetch exchange rate', error);
    return amount;
  }
}
