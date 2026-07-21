import { parse, type HTMLElement } from 'node-html-parser';

const URL_OFFICES_CURRENCY =
  'https://www.bystrobank.ru/sitecurrency/web/currency_converter.php';
const URL_CITY_SELECTION = 'https://www.bystrobank.ru/geoeditor/web/citySelection.php';

/** Колонка USD в #officesCurrency: 0 — офис, 1 — USD. */
const USD_COLUMN_INDEX = 1;

/** В ячейке USD: 0 — покупка, 1 — продажа. */
const SELL_SPAN_INDEX = 1;

/** Комиссия банка поверх курса продажи. */
const BANK_COMMISSION_RATE = 0.025;

export interface UsdRates {
  buy: number;
  sell: number;
}

function parseMoneySpans(td: HTMLElement): number[] {
  return td.querySelectorAll('span.money').map((span) => {
    const raw = span.textContent?.trim().replace(',', '.') ?? '';
    return Number.parseFloat(raw);
  });
}

/** Покупка/продажа USD из первой строки tbody таблицы #officesCurrency. */
export function parseUsdColumnFromTable(html: string): UsdRates | null {
  const document = parse(html);
  const table = document.querySelector('table#officesCurrency');
  if (!table) return null;

  const firstRow = table.querySelector('tbody tr');
  if (!firstRow) return null;

  const usdCell = firstRow.querySelectorAll('td')[USD_COLUMN_INDEX];
  if (!usdCell) return null;

  const values = parseMoneySpans(usdCell);
  if (values.length <= SELL_SPAN_INDEX) return null;

  const buy = values[0];
  const sell = values[SELL_SPAN_INDEX];
  if (!Number.isFinite(buy) || !Number.isFinite(sell)) return null;

  return { buy, sell };
}

function readSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const raw = headers.get('set-cookie');
  if (!raw) return [];

  // RN/Node могут склеивать несколько Set-Cookie через запятую.
  return raw.split(/,(?=\s*[^;=]+=[^;]+)/).map((part) => part.trim());
}

function toCookieHeader(setCookieHeaders: string[]): string {
  return setCookieHeaders
    .map((header) => header.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

/**
 * Guest-сессия Bystrobank.
 * В Node читаем Set-Cookie вручную; в RN cookie jar часто подхватывает сам.
 */
async function bootstrapBystrobankSession(): Promise<string | null> {
  const response = await fetch(URL_CITY_SELECTION, {
    credentials: 'include',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'ru-RU,ru;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Bystrobank city selection responded with ${response.status}`);
  }

  const cookieHeader = toCookieHeader(readSetCookieHeaders(response));
  if (cookieHeader.includes('guest=')) {
    return cookieHeader;
  }

  // RN: cookie уже в нативном jar — продолжаем без ручного Cookie.
  return null;
}

async function fetchCurrencyPageHtml(): Promise<string> {
  const cookieHeader = await bootstrapBystrobankSession();

  const response = await fetch(URL_OFFICES_CURRENCY, {
    credentials: 'include',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'ru-RU,ru;q=0.9',
      Referer: URL_CITY_SELECTION,
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Bystrobank currency page responded with ${response.status}`);
  }

  return response.text();
}

/** Покупка и продажа USD с сайта Bystrobank. */
export async function fetchUsdBuyAndSell(): Promise<UsdRates> {
  const html = await fetchCurrencyPageHtml();
  const rates = parseUsdColumnFromTable(html);
  if (!rates) {
    throw new Error('Не удалось распарсить курс USD из таблицы #officesCurrency');
  }
  return rates;
}

/**
 * Курс USD→RUB для приложения: продажа + комиссия 2.5%.
 * rubPerUnit — сколько ₽ за 1 $.
 */
export async function fetchUsdRubRate(): Promise<number> {
  const { sell } = await fetchUsdBuyAndSell();
  return Math.round(sell * (1 + BANK_COMMISSION_RATE) * 100) / 100;
}
