import { parse, HTMLElement } from 'node-html-parser';

const URL_OFFICES_CURRENCY = 'https://www.bystrobank.ru/sitecurrency/web/currency_converter.php';

/** Куки для выбора города (Саратов) при запросе курсов. */
const CURRENCY_COOKIES = 'city=saratov;';

/** Индекс колонки USD в таблице #officesCurrency (0 — Офис, 1 — USD, 2 — EUR, …). */
const USD_COLUMN_INDEX = 1;

/** В ячейке USD два span.money: первый — покупка, второй — продажа. */
const BUY_SPAN_INDEX = 0;
const SELL_SPAN_INDEX = 1;

export interface UsdRates {
  /** Покупка (первый span.money в колонке USD). */
  buy: number;
  /** Продажа (второй span.money в колонке USD). */
  sell: number;
}

function parseMoneySpan(td: HTMLElement): number[] {
  const spans = td.querySelectorAll('span.money');
  return spans.map((span) => parseFloat(span.textContent?.trim().replace(',', '.') ?? '0'));
}

/**
 * Парсинг таблицы #officesCurrency: первая строка tbody, колонка USD,
 * два span.money — покупка и продажа.
 */
export function parseUsdColumnFromTable(html: string): UsdRates | null {
  const document = parse(html);
  const table = document.querySelector('table#officesCurrency');
  if (!table) return null;

  const firstRow = table.querySelector('tbody tr');
  if (!firstRow) return null;

  const cells = firstRow.querySelectorAll('td');
  const usdCell = cells[USD_COLUMN_INDEX];
  if (!usdCell) return null;

  const values = parseMoneySpan(usdCell);
  if (values.length < 2) return null;

  const buy = values[BUY_SPAN_INDEX];
  const sell = values[SELL_SPAN_INDEX];
  if (!Number.isFinite(buy) || !Number.isFinite(sell)) return null;

  return { buy, sell };
}

export class Parser {
  /**
   * Курс USD: возвращает курс покупки (первый span.money в колонке USD).
   */
  static async getUsdCourse(): Promise<number> {
    const response = await fetch(
      'https://www.bystrobank.ru/sitecurrency/web/currency_converter.php',
      {
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'max-age=0',
          'if-none-match': 'XML_Output_abbhgQoPEBQAAF0scegAAAB8',
          'sec-ch-ua': '"Chromium";v="145", "Not:A-Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          cookie:
            'guest=aa_L5woPEBQAAP-9gJ8AAACg; _ym_uid=1773128680443116950; _ym_d=1773128680; l=Izhevsk; o=%D0%98%D0%B6%D0%B5%D0%B2%D1%81%D0%BA%3B(3412)%2090-80-90%3B%C2%AB%D0%93%D0%BE%D0%BB%D0%BE%D0%B2%D0%BD%D0%BE%D0%B9%20%D0%BE%D1%84%D0%B8%D1%81%20(%D0%98%D0%B6%D0%B5%D0%B2%D1%81%D0%BA)%C2%BB%3Bizh; _ym_isad=1; city=saratov; cityName=%D0%A1%D0%B0%D1%80%D0%B0%D1%82%D0%BE%D0%B2',
          Referer: 'https://www.bystrobank.ru/geoeditor/web/citySelection.php'
        },
        body: null,
        method: 'GET'
      }
    );
    const html = await response.text();
    const rates = parseUsdColumnFromTable(html);

    if (!rates) throw new Error('Не удалось распарсить курс USD из таблицы #officesCurrency');
    return rates.buy + rates.buy * 0.035; // 3.5% комиссия банка
  }

  /** Покупка и продажа USD из первой строки таблицы. */
  static async getUsdBuyAndSell(): Promise<UsdRates> {
    const response = await fetch(URL_OFFICES_CURRENCY, {
      headers: { Cookie: CURRENCY_COOKIES }
    });
    const html = await response.text();
    const rates = parseUsdColumnFromTable(html);
    if (!rates) throw new Error('Не удалось распарсить курс USD из таблицы #officesCurrency');
    return rates;
  }
}
