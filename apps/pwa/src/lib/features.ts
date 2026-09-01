export function isFeatureEnabled(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export function isYearSummaryEnabled(): boolean {
  return isFeatureEnabled(import.meta.env.VITE_FEATURE_YEAR_SUMMARY);
}

export function isVacationBannerEnabled(): boolean {
  return isFeatureEnabled(import.meta.env.VITE_FEATURE_VACATION_BANNER);
}

/** Включён по умолчанию — флаг только чтобы полностью выключить баннер. */
export function isBackupBannerEnabled(): boolean {
  const raw = import.meta.env.VITE_FEATURE_BACKUP_BANNER;
  if (raw === undefined || raw === '') return true;
  return isFeatureEnabled(raw);
}

type VacationPeriodLike = {
  start_date: string;
  end_date: string;
};

export function hasFilledVacationPeriods(vacations: VacationPeriodLike[]): boolean {
  return vacations.some(
    (vacation) =>
      vacation.start_date.trim().length > 0 && vacation.end_date.trim().length > 0,
  );
}

export function shouldShowVacationBanner(vacations: VacationPeriodLike[]): boolean {
  if (!isVacationBannerEnabled()) return false;
  return !hasFilledVacationPeriods(vacations);
}
