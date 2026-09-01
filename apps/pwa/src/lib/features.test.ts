import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  hasFilledVacationPeriods,
  shouldShowVacationBanner,
} from './features';

const filledVacation = {
  start_date: '2026-07-16',
  end_date: '2026-07-31',
};

describe('hasFilledVacationPeriods', () => {
  it('false для пустого списка', () => {
    expect(hasFilledVacationPeriods([])).toBe(false);
  });

  it('true если есть период с датами', () => {
    expect(hasFilledVacationPeriods([filledVacation])).toBe(true);
  });

  it('false если даты пустые', () => {
    expect(
      hasFilledVacationPeriods([{ start_date: '', end_date: '' }]),
    ).toBe(false);
  });
});

describe('shouldShowVacationBanner', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('показывает баннер при включённом флаге и без отпусков', () => {
    vi.stubEnv('VITE_FEATURE_VACATION_BANNER', 'true');
    expect(shouldShowVacationBanner([])).toBe(true);
  });

  it('скрывает баннер при включённом флаге и хотя бы одном отпуске', () => {
    vi.stubEnv('VITE_FEATURE_VACATION_BANNER', 'true');
    expect(shouldShowVacationBanner([filledVacation])).toBe(false);
  });

  it('скрывает баннер при выключенном флаге', () => {
    vi.stubEnv('VITE_FEATURE_VACATION_BANNER', 'false');
    expect(shouldShowVacationBanner([])).toBe(false);
    expect(shouldShowVacationBanner([filledVacation])).toBe(false);
  });
});
