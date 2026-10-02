import { getRouteApi } from '@tanstack/react-router';

import { RuleFormScreen } from '../rule-form-screen';
import { ROUTES } from '@/shared/config/routes';

const route = getRouteApi(ROUTES.settings.rules.new);

export function NewRule() {
  const { asset } = route.useSearch();
  return (
    <RuleFormScreen defaultTargetAssetId={asset ? Number(asset) : undefined} />
  );
}
