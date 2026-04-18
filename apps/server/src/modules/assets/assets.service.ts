import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { generateSlug } from '../../shared/lib/slug';
import { DEFAULT_ASSET_SYMBOL } from './constants/accessible-icons';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  AssetJson,
  AssetRecord,
  computeTotalsFromTransactions,
  HistoryJson,
  mapAssetToJson,
  mapTransactionToHistoryJson,
  TransactionRecord,
  TxTotalsInput,
} from './mappers/asset.mapper';

/** Статические моки: те же формы ответа, что и при работе с БД. */
const MOCK_ASSETS: AssetRecord[] = [
  {
    id: 'mock_asset_cash',
    kind: 'BASE',
    name: 'Наличные',
    slug: 'cash',
    symbol: DEFAULT_ASSET_SYMBOL,
    price: 0,
    unit: null,
    count: null,
    icon: {
      name: 'banknote',
      backgroundColor: '#E8F5E9',
      color: '#1B5E20',
    },
    transactions: [],
  },
  {
    id: 'mock_asset_zoloto',
    kind: 'PRICED',
    name: 'Золото',
    slug: 'zoloto',
    symbol: DEFAULT_ASSET_SYMBOL,
    price: 0,
    unit: 'г',
    count: 0,
    icon: {
      name: 'gem',
      backgroundColor: '#FFF3E0',
      color: '#E65100',
    },
    transactions: [
      { price: 6200.5, occurredAt: new Date('2026-04-10T12:00:00.000Z') },
      { price: 6100, occurredAt: new Date('2026-04-09T10:00:00.000Z') },
    ],
  },
];

const MOCK_TX_BY_SLUG: Record<string, TransactionRecord[]> = {
  cash: [
    {
      id: 'mock_tx_cash_1',
      type: 'BUY',
      occurredAt: new Date('2026-04-08T09:00:00.000Z'),
      price: 5000,
      unit: DEFAULT_ASSET_SYMBOL,
      count: 1,
    },
  ],
  zoloto: [
    {
      id: 'mock_tx_z_2',
      type: 'BUY',
      occurredAt: new Date('2026-04-10T12:00:00.000Z'),
      price: 6200.5,
      unit: 'г',
      count: 2,
    },
    {
      id: 'mock_tx_z_1',
      type: 'BUY',
      occurredAt: new Date('2026-04-09T10:00:00.000Z'),
      price: 6100,
      unit: 'г',
      count: 10,
    },
  ],
};

function slugSet(): Set<string> {
  return new Set(MOCK_ASSETS.map((a) => a.slug));
}

function findMockAsset(slug: string): AssetRecord | undefined {
  return MOCK_ASSETS.find((a) => a.slug === slug);
}

function totalsInputsForAsset(asset: AssetRecord): TxTotalsInput[] {
  return (MOCK_TX_BY_SLUG[asset.slug] ?? []).map((t) => ({
    type: t.type,
    price: t.price,
    count: t.count,
  }));
}

@Injectable()
export class AssetsService {
  async listForUser(_userId: string): Promise<AssetJson[]> {
    return MOCK_ASSETS.map((a) =>
      mapAssetToJson(
        a,
        computeTotalsFromTransactions(totalsInputsForAsset(a), a.kind),
      ),
    );
  }

  async getBySlug(_userId: string, slug: string): Promise<AssetJson> {
    const asset = findMockAsset(slug);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    const totals = computeTotalsFromTransactions(
      totalsInputsForAsset(asset),
      asset.kind,
    );
    return mapAssetToJson(asset, totals);
  }

  async listTransactions(
    _userId: string,
    slug: string,
  ): Promise<HistoryJson[]> {
    if (!findMockAsset(slug)) {
      throw new NotFoundException('Asset not found');
    }
    const txs = [...(MOCK_TX_BY_SLUG[slug] ?? [])].sort(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
    );
    return txs.map(mapTransactionToHistoryJson);
  }

  async createAsset(_userId: string, dto: CreateAssetDto): Promise<AssetJson> {
    if (dto.type === 'priced' && (!dto.unit || dto.unit.length === 0)) {
      throw new BadRequestException('unit is required for priced assets');
    }
    const baseSlug = generateSlug(dto.name) || 'asset';
    const kind = dto.type === 'base' ? 'BASE' : 'PRICED';
    const slug = slugSet().has(baseSlug) ? `${baseSlug}-mock` : baseSlug;

    const record: AssetRecord = {
      id: `mock_new_${randomUUID()}`,
      kind,
      name: dto.name,
      slug,
      symbol: DEFAULT_ASSET_SYMBOL,
      price: 0,
      unit: dto.type === 'priced' ? dto.unit! : null,
      count: dto.type === 'priced' ? 0 : null,
      icon: {
        name: dto.icon.name,
        backgroundColor: dto.icon.backgroundColor,
        color: dto.icon.color,
      },
      transactions: [],
    };

    const emptyTotals = computeTotalsFromTransactions([], kind);
    return mapAssetToJson(record, emptyTotals);
  }

  async createTransaction(
    _userId: string,
    slug: string,
    dto: CreateTransactionDto,
  ): Promise<HistoryJson> {
    const asset = findMockAsset(slug);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const price = parseFloat(dto.price);
    if (Number.isNaN(price)) {
      throw new BadRequestException('Invalid price');
    }

    let countNum: number;
    if (asset.kind === 'BASE') {
      countNum = 1;
    } else {
      countNum = parseFloat(dto.count);
      if (Number.isNaN(countNum)) {
        throw new BadRequestException('Invalid count');
      }
    }

    const type: 'BUY' | 'SELL' = dto.type === 'buy' ? 'BUY' : 'SELL';
    const unit = asset.kind === 'BASE' ? asset.symbol : asset.unit ?? 'г';

    const row: TransactionRecord = {
      id: `mock_tx_${randomUUID()}`,
      type,
      occurredAt: new Date(),
      price,
      unit,
      count: countNum,
    };

    return mapTransactionToHistoryJson(row);
  }
}
