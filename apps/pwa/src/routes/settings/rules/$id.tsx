import { createFileRoute, notFound } from '@tanstack/react-router';
import { RuleFormScreen } from '@/components/screens';
import { getRuleById } from '@/lib/db';
export const Route = createFileRoute('/settings/rules/$id')({
  loader: async ({ params }) => {
    const rule = await getRuleById(Number(params.id));
    if (!rule) throw notFound();
    return rule;
  },
  component: () => <RuleFormScreen rule={Route.useLoaderData()} />,
});
