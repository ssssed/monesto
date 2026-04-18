import { Test, TestingModule } from '@nestjs/testing';
import { computeTotalsFromTransactions } from './mappers/asset.mapper';
import { AssetsService } from './assets.service';

describe('computeTotalsFromTransactions', () => {
  it('BUY увеличивает сумму и количество, SELL уменьшает', () => {
    const txs = [
      { type: 'BUY' as const, price: 10, count: 2 },
      { type: 'SELL' as const, price: 5, count: 1 },
    ];
    const r = computeTotalsFromTransactions(txs, 'PRICED');
    expect(r.price).toBe(15);
    expect(r.count).toBe(1);
  });

  it('для BASE только денежная сумма', () => {
    const txs = [{ type: 'BUY' as const, price: 100, count: 1 }];
    const r = computeTotalsFromTransactions(txs, 'BASE');
    expect(r.price).toBe(100);
    expect(r.count).toBeNull();
  });
});

describe('AssetsService (моки)', () => {
  let service: AssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsService],
    }).compile();
    service = module.get(AssetsService);
  });

  describe('listForUser', () => {
    it('возвращает фиксированный список активов', async () => {
      const list = await service.listForUser('any');
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.map((a) => a.slug).sort()).toContain('cash');
      expect(list.map((a) => a.slug).sort()).toContain('zoloto');
    });
  });

  describe('getBySlug', () => {
    it('успех для известного slug', async () => {
      const one = await service.getBySlug('u1', 'cash');
      expect(one.type).toBe('base');
      expect(one.slug).toBe('cash');
    });

    it('404 если актив не найден', async () => {
      await expect(service.getBySlug('u1', 'nope')).rejects.toThrow(
        'Asset not found',
      );
    });
  });

  describe('listTransactions', () => {
    it('успех: история для mock-актива', async () => {
      const rows = await service.listTransactions('u1', 'cash');
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows[0].type).toBe('buy');
    });

    it('404 если актива нет', async () => {
      await expect(service.listTransactions('u1', 'x')).rejects.toThrow(
        'Asset not found',
      );
    });
  });

  describe('createAsset', () => {
    it('base: возвращает объект без сохранения в БД', async () => {
      const out = await service.createAsset('u1', {
        type: 'base',
        name: 'Тест',
        icon: {
          name: 'banknote',
          backgroundColor: '#fff',
          color: '#000',
        },
      });
      expect(out.type).toBe('base');
      expect(out.name).toBe('Тест');
    });

    it('priced без unit → BadRequest', async () => {
      await expect(
        service.createAsset('u1', {
          type: 'priced',
          name: 'Gold',
          unit: '',
          icon: {
            name: 'gem',
            backgroundColor: '#fff',
            color: '#000',
          },
        }),
      ).rejects.toThrow('unit is required for priced assets');
    });
  });

  describe('createTransaction', () => {
    it('priced: парсит price и count', async () => {
      const row = await service.createTransaction('u1', 'zoloto', {
        type: 'sell',
        price: '12.5',
        count: '3',
      });
      expect(row.count).toBe(3);
      expect(row.price).toBe(12.5);
    });

    it('base: count всегда 1', async () => {
      const row = await service.createTransaction('u1', 'cash', {
        type: 'buy',
        price: '100',
        count: '99',
      });
      expect(row.count).toBe(1);
    });

    it('невалидный price → 400', async () => {
      await expect(
        service.createTransaction('u1', 'cash', {
          type: 'buy',
          price: 'x',
          count: '1',
        }),
      ).rejects.toThrow('Invalid price');
    });

    it('несуществующий slug → 404', async () => {
      await expect(
        service.createTransaction('u1', 'x', {
          type: 'buy',
          price: '1',
          count: '1',
        }),
      ).rejects.toThrow('Asset not found');
    });
  });
});
