/** Единственный источник правды для путей приложения. */
export const ROUTES = {
  home: '/',
  history: '/history',
  yearSummary: '/year-summary',
  assets: {
    index: '/assets',
    new: '/assets/new',
    detail: '/assets/$slug',
  },
  onboarding: {
    index: '/onboarding',
    income: '/onboarding/income',
    expenses: '/onboarding/expenses',
    plan: '/onboarding/plan',
  },
  settings: {
    index: '/settings',
    income: '/settings/income',
    expenses: '/settings/expenses',
    vacation: '/settings/vacation',
    rules: {
      index: '/settings/rules',
      new: '/settings/rules/new',
      detail: '/settings/rules/$id',
    },
  },
} as const;
