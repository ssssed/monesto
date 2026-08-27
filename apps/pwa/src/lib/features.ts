export function isFeatureEnabled(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export function isYearSummaryEnabled(): boolean {
  return isFeatureEnabled(import.meta.env.VITE_FEATURE_YEAR_SUMMARY);
}
