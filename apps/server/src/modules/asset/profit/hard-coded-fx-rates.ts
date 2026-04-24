import { Currency } from '@prisma/client';

/**
 * Временные курсы: сколько RUB за 1 единицу валюты (якорь — RUB).
 * Пример из тест-кейса: 1 USD = 100 RUB.
 */
export const RUB_PER_UNIT: Record<Currency, number> = {
  [Currency.rub]: 1,
  [Currency.usd]: 100,
  [Currency.gold]: 9500,
};
