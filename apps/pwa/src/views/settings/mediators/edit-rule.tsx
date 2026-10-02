import { getRouteApi } from '@tanstack/react-router';

import { RuleFormScreen } from '../rule-form-screen';
import { ROUTES } from '@/shared/config/routes';

const route = getRouteApi(ROUTES.settings.rules.detail);

export function EditRule() {
  return <RuleFormScreen rule={route.useLoaderData()} />;
}
