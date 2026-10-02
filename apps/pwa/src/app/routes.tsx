import {
  createRootRoute,
  createRoute,
  lazyRouteComponent,
  notFound,
  redirect,
} from '@tanstack/react-router';

import { RootLayout } from './layouts/root-layout';
import { requireIncompleteOnboarding } from './guards/onboarding-guard';
import { NotFoundScreen, ServerErrorScreen } from '@/shared/ui/error-page';
import { ROUTES } from '@/shared/config/routes';
import { getRuleById, isOnboardingCompleted } from '@/kernel/db';
import { isYearSummaryEnabled } from '@/kernel/features';

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundScreen,
  errorComponent: ServerErrorScreen,
});

const requireOnboardingCompleted = async () => {
  if (!(await isOnboardingCompleted())) throw redirect({ to: ROUTES.onboarding.index });
};

// --- home -------------------------------------------------------------

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.home,
  beforeLoad: requireOnboardingCompleted,
  component: lazyRouteComponent(() => import('@/views/home'), 'Home'),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.history,
  beforeLoad: requireOnboardingCompleted,
  component: lazyRouteComponent(() => import('@/views/history'), 'CycleHistory'),
});

const yearSummaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.yearSummary,
  beforeLoad: async () => {
    await requireOnboardingCompleted();
    if (!isYearSummaryEnabled()) throw redirect({ to: ROUTES.home });
  },
  component: lazyRouteComponent(() => import('@/views/year-summary'), 'YearSummary'),
});

// --- assets -------------------------------------------------------------

const assetsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.assets.index,
  component: lazyRouteComponent(() => import('@/views/assets'), 'Assets'),
});

const assetsDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.assets.detail,
  component: lazyRouteComponent(() => import('@/views/assets'), 'AssetDetail'),
});

const assetsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.assets.new,
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === 'string' ? search.from : undefined,
  }),
  component: lazyRouteComponent(() => import('@/views/assets'), 'AssetForm'),
});

// --- wishlist -----------------------------------------------------------

type WishlistSearch = { tab?: 'items' | 'planned' };

const wishlistIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.wishlist.index,
  beforeLoad: requireOnboardingCompleted,
  validateSearch: (search: Record<string, unknown>): WishlistSearch => ({
    tab: search.tab === 'planned' ? 'planned' : search.tab === 'items' ? 'items' : undefined,
  }),
  component: lazyRouteComponent(() => import('@/views/wishlist'), 'Wishlist'),
});

const wishlistNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.wishlist.new,
  beforeLoad: requireOnboardingCompleted,
  component: lazyRouteComponent(() => import('@/views/wishlist'), 'WishlistForm'),
});

const wishlistDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.wishlist.detail,
  beforeLoad: requireOnboardingCompleted,
  component: lazyRouteComponent(() => import('@/views/wishlist'), 'WishlistDetail'),
});

// --- onboarding -----------------------------------------------------------

const onboardingIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.onboarding.index,
  beforeLoad: requireIncompleteOnboarding,
  component: lazyRouteComponent(() => import('@/views/onboarding'), 'Welcome'),
});

const onboardingIncomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.onboarding.income,
  beforeLoad: requireIncompleteOnboarding,
  component: lazyRouteComponent(() => import('@/views/money-flow'), 'OnboardingIncome'),
});

const onboardingExpensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.onboarding.expenses,
  beforeLoad: requireIncompleteOnboarding,
  component: lazyRouteComponent(() => import('@/views/money-flow'), 'OnboardingExpenses'),
});

const onboardingPlanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.onboarding.plan,
  beforeLoad: requireIncompleteOnboarding,
  component: lazyRouteComponent(() => import('@/views/onboarding'), 'AssetsIntro'),
});

// --- settings ---------------------------------------------------------

const settingsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings.index,
  component: lazyRouteComponent(() => import('@/views/settings'), 'Settings'),
});

type MoneyFlowSearch = { _cycle?: string };

const settingsIncomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings.income,
  validateSearch: (search: Record<string, unknown>): MoneyFlowSearch => ({
    _cycle: typeof search._cycle === 'string' ? search._cycle : undefined,
  }),
  component: lazyRouteComponent(() => import('@/views/money-flow'), 'IncomeSettings'),
});

const settingsExpensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings.expenses,
  validateSearch: (search: Record<string, unknown>): MoneyFlowSearch => ({
    _cycle: typeof search._cycle === 'string' ? search._cycle : undefined,
  }),
  component: lazyRouteComponent(() => import('@/views/money-flow'), 'ExpensesSettings'),
});

const settingsVacationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings.vacation,
  component: lazyRouteComponent(() => import('@/views/vacation'), 'Vacation'),
});

const settingsRulesIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings.rules.index,
  component: lazyRouteComponent(() => import('@/views/settings'), 'Rules'),
});

const settingsRulesNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings.rules.new,
  validateSearch: (search: Record<string, unknown>): { asset?: string } => ({
    asset: typeof search.asset === 'string' ? search.asset : undefined,
  }),
  component: lazyRouteComponent(() => import('@/views/settings'), 'NewRule'),
});

const settingsRulesDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES.settings.rules.detail,
  loader: async ({ params }) => {
    const rule = await getRuleById(Number(params.id));
    if (!rule) throw notFound();
    return rule;
  },
  component: lazyRouteComponent(() => import('@/views/settings'), 'EditRule'),
});

export const routeTree = rootRoute.addChildren([
  homeRoute,
  historyRoute,
  yearSummaryRoute,
  assetsIndexRoute,
  assetsDetailRoute,
  assetsNewRoute,
  wishlistIndexRoute,
  wishlistNewRoute,
  wishlistDetailRoute,
  onboardingIndexRoute,
  onboardingIncomeRoute,
  onboardingExpensesRoute,
  onboardingPlanRoute,
  settingsIndexRoute,
  settingsIncomeRoute,
  settingsExpensesRoute,
  settingsVacationRoute,
  settingsRulesIndexRoute,
  settingsRulesNewRoute,
  settingsRulesDetailRoute,
]);
