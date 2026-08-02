import { createFileRoute } from '@tanstack/react-router';
import { RuleFormScreen } from '@/components/screens';
export const Route = createFileRoute('/settings/rules/new')({ component: RuleFormScreen });
