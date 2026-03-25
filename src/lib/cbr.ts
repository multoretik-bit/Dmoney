export interface CBRResponse {
  Date: string;
  PreviousDate: string;
  PreviousURL: string;
  Timestamp: string;
  Valute: Record<string, {
    ID: string;
    NumCode: string;
    CharCode: string;
    Nominal: number;
    Name: string;
    Value: number;
    Previous: number;
  }>;
}

let cachedCBR: CBRResponse | null = null;
let lastFetch = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export async function fetchCBRRates(): Promise<CBRResponse | null> {
  const now = Date.now();
  if (cachedCBR && (now - lastFetch < CACHE_DURATION)) {
    return cachedCBR;
  }

  try {
    const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
    const data = await response.json();
    cachedCBR = data;
    lastFetch = now;
    return data;
  } catch (error) {
    console.error('Failed to fetch CBR rates:', error);
    return null;
  }
}

export function getCBRRate(charCode: string): number {
  if (!cachedCBR) return 1;
  const valute = cachedCBR.Valute[charCode];
  if (!valute) return 1;
  return valute.Value / valute.Nominal;
}
