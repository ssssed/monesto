export const monthData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-uuid-1',
  year: 2026,
  month: 1,
  incomingAmount: null,
  incomingCurrency: '$',
  mandatoryAmount: null,
  mandatoryCurrency: '$',
  strategy: 'savings', // пример стратегии
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-05T12:00:00Z'),
  user: {
    id: 'user-uuid-1',
    telegramId: '123456789',
    registeredAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-12-31T00:00:00Z'),
  },
  userMonthSavingsHistories: [
    {
      id: 'hist-uuid-1',
      userMonthId: '123e4567-e89b-12d3-a456-426614174000',
      value: 450,
      currency: '$', // добавлено поле currency для истории
      createdAt: new Date('2026-01-10T10:00:00Z'),
    },
    {
      id: 'hist-uuid-2',
      userMonthId: '123e4567-e89b-12d3-a456-426614174000',
      value: 600,
      currency: '$',
      createdAt: new Date('2026-01-15T10:00:00Z'),
    },
  ],
};

export const monthRecentData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-uuid-1',
  year: 2026,
  month: 1,
  incomingAmount: 3200,
  incomingCurrency: '$',
  mandatoryAmount: 800,
  mandatoryCurrency: '$',
  strategy: 'savings', // пример стратегии
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-05T12:00:00Z'),
  user: {
    id: 'user-uuid-1',
    telegramId: '123456789',
    registeredAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-12-31T00:00:00Z'),
  },
  userMonthSavingsHistories: [
    {
      id: 'hist-uuid-1',
      userMonthId: '123e4567-e89b-12d3-a456-426614174000',
      value: 450,
      currency: '$', // добавлено поле currency для истории
      createdAt: new Date('2026-01-10T10:00:00Z'),
    },
    {
      id: 'hist-uuid-2',
      userMonthId: '123e4567-e89b-12d3-a456-426614174000',
      value: 600,
      currency: '$',
      createdAt: new Date('2026-01-15T10:00:00Z'),
    },
  ],
};
