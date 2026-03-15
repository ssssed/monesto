import prompts from 'prompts';

import type { MonestoConfig } from '../services/config.js';

export interface PromptResult extends MonestoConfig {}

export async function askMissingParameters(existing: Partial<MonestoConfig>): Promise<PromptResult> {
  const questions: prompts.PromptObject[] = [];

  if (existing.money == null) {
    questions.push({
      type: 'number',
      name: 'money',
      message: 'Месячный доход (до налога), RUB:',
      min: 0
    });
  }

  if (existing.tax == null) {
    questions.push({
      type: 'text',
      name: 'tax',
      message: 'Налог (например, 13% или 31200):',
      validate: (value: string) => (value && value.trim().length > 0 ? true : 'Укажите налог или оставьте флагом')
    });
  }

  if (existing.gold == null && existing.usd == null && existing.rub == null) {
    questions.push(
      {
        type: 'text',
        name: 'gold',
        message: 'Распределение в золото (например, 10% или 50000 RUB). Оставьте пустым, чтобы пропустить:',
        initial: ''
      },
      {
        type: 'text',
        name: 'usd',
        message: 'Распределение в USD (например, 10% или 250 USD). Оставьте пустым, чтобы пропустить:',
        initial: ''
      },
      {
        type: 'text',
        name: 'rub',
        message: 'Распределение в RUB (например, 10% или 50000 RUB). Оставьте пустым, чтобы пропустить:',
        initial: ''
      }
    );
  }

  if (questions.length === 0) {
    return existing as PromptResult;
  }

  const answers = await prompts(questions);

  const merged: PromptResult = {
    ...existing,
    ...answers
  };

  if (typeof merged.money === 'string') {
    const parsedMoney = Number(merged.money);
    merged.money = Number.isFinite(parsedMoney) ? parsedMoney : existing.money;
  }

  merged.imprestDate = merged.imprestDate ?? existing.imprestDate ?? 25;

  if (merged.gold != null && merged.gold !== '') {
    merged.gold = String(merged.gold);
  } else if (existing.gold != null) {
    merged.gold = existing.gold;
  } else {
    merged.gold = undefined;
  }

  if (merged.usd != null && merged.usd !== '') {
    merged.usd = String(merged.usd);
  } else if (existing.usd != null) {
    merged.usd = existing.usd;
  } else {
    merged.usd = undefined;
  }

  if (merged.rub != null && merged.rub !== '') {
    merged.rub = String(merged.rub);
  } else if (existing.rub != null) {
    merged.rub = existing.rub;
  } else {
    merged.rub = undefined;
  }

  if (!merged.currency) {
    merged.currency = 'rub';
  }

  return merged;
}

