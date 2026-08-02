import { createFileRoute } from '@tanstack/react-router';
import { RulesScreen } from '@/components/screens';
export const Route = createFileRoute('/settings/rules/')({ component: RulesScreen });
