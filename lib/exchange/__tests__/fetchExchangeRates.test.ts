import { parseUsdColumnFromTable } from '@/lib/exchange/fetchExchangeRates';

const SAMPLE_HTML = `
<table id="officesCurrency">
  <thead><tr><th>Офис</th><th>USD</th><th>EUR</th></tr></thead>
  <tbody>
    <tr>
      <td><span class="bankName">Офис</span></td>
      <td><span class="money">79.79</span><span class="money">79.71</span></td>
      <td><span class="money">93.69</span><span class="money">92.21</span></td>
    </tr>
  </tbody>
</table>
`;

describe('parseUsdColumnFromTable', () => {
  it('читает покупку и продажу USD из первой строки', () => {
    expect(parseUsdColumnFromTable(SAMPLE_HTML)).toEqual({
      buy: 79.79,
      sell: 79.71,
    });
  });

  it('возвращает null без таблицы', () => {
    expect(parseUsdColumnFromTable('<div>no table</div>')).toBeNull();
  });
});
