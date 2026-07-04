import { FinanceType, type FinanceRecord } from '@prisma/client';
import { isDetailedRecord } from '../allocation-rules/net-income.calc';
import {
  UNALLOCATED_MANDATORY_LABEL,
  UNALLOCATED_MANDATORY_NAME,
} from './lib/mandatory-breakdown.constants';
import { parseFinanceAmount } from './lib/parse-finance-amount';
import type { MandatoryBreakdownLineKind } from './dto/patch-month-finance.dto';
import { MandatoryBreakdownLineKind as BreakdownKind } from './dto/patch-month-finance.dto';

export type MonthFinanceStatus = 'empty' | 'partial' | 'complete';

export type MonthFinanceBreakdownLine = {
  id: string;
  kind: MandatoryBreakdownLineKind;
  label: string;
  amount: string;
};

export type MonthFinanceStepState = {
  filled: boolean;
  value: string;
  breakdown: MonthFinanceBreakdownLine[];
};

export type MonthFinanceView = {
  status: MonthFinanceStatus;
  incoming: MonthFinanceStepState;
  mandatory: MonthFinanceStepState;
};

function formatAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) {
    return '';
  }
  return String(amount);
}

function mapRecordToBreakdownLine(
  record: FinanceRecord,
): MonthFinanceBreakdownLine {
  if (record.name === UNALLOCATED_MANDATORY_NAME) {
    return {
      id: String(record.id),
      kind: BreakdownKind.unallocated,
      label: UNALLOCATED_MANDATORY_LABEL,
      amount: formatAmount(Number(record.amount)),
    };
  }

  return {
    id: String(record.id),
    kind: BreakdownKind.custom,
    label: record.name!.trim(),
    amount: formatAmount(Number(record.amount)),
  };
}

function sortBreakdownLines(
  lines: MonthFinanceBreakdownLine[],
): MonthFinanceBreakdownLine[] {
  return [...lines].sort((left, right) => {
    if (left.kind === right.kind) {
      return left.id.localeCompare(right.id);
    }
    return left.kind === BreakdownKind.unallocated ? -1 : 1;
  });
}

function mapStepFromRecords(
  records: FinanceRecord[],
  type: FinanceType,
): MonthFinanceStepState {
  const ofType = records.filter((record) => record.type === type);
  if (ofType.length === 0) {
    return { filled: false, value: '', breakdown: [] };
  }

  const detailed = ofType.filter((record) => isDetailedRecord(record.name));
  if (detailed.length > 0) {
    const breakdown = sortBreakdownLines(
      detailed.map((record) => mapRecordToBreakdownLine(record)),
    );
    const total = detailed.reduce(
      (sum, record) => sum + Number(record.amount),
      0,
    );

    return {
      filled: true,
      value: formatAmount(total),
      breakdown,
    };
  }

  const aggregateTotal = ofType
    .filter((record) => !isDetailedRecord(record.name))
    .reduce((sum, record) => sum + Number(record.amount), 0);

  return {
    filled: aggregateTotal > 0,
    value: formatAmount(aggregateTotal),
    breakdown: [],
  };
}

export function mapRecordsToMonthFinanceView(
  records: FinanceRecord[],
): MonthFinanceView {
  const incoming = mapStepFromRecords(records, FinanceType.income);
  const mandatory = mapStepFromRecords(records, FinanceType.expense);

  let status: MonthFinanceStatus = 'empty';
  if (incoming.filled && mandatory.filled) {
    status = 'complete';
  } else if (incoming.filled || mandatory.filled) {
    status = 'partial';
  }

  return { status, incoming, mandatory };
}

export type MandatoryBreakdownLineInput = {
  kind?: MandatoryBreakdownLineKind;
  label: string;
  amount: string;
};

export type ResolvedMandatoryRow = {
  name: string;
  amount: number;
};

export function resolveMandatoryLines(
  value: string | undefined,
  breakdown: MandatoryBreakdownLineInput[] | undefined,
):
  | { mode: 'detailed'; rows: ResolvedMandatoryRow[] }
  | { mode: 'aggregate'; amount: number } {
  const rows = (breakdown ?? [])
    .map((line) => ({
      kind: line.kind ?? BreakdownKind.custom,
      label: line.label.trim(),
      amount: parseFinanceAmount(line.amount),
    }))
    .filter(
      (line) =>
        line.amount > 0 &&
        (line.kind === BreakdownKind.unallocated || line.label.length > 0),
    )
    .map((line) => ({
      name:
        line.kind === BreakdownKind.unallocated
          ? UNALLOCATED_MANDATORY_NAME
          : line.label,
      amount: line.amount,
    }));

  if (rows.length > 0) {
    return { mode: 'detailed', rows };
  }

  const amount = parseFinanceAmount(value ?? '');
  return { mode: 'aggregate', amount };
}
