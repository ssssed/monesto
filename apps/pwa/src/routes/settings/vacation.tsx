import { createFileRoute } from '@tanstack/react-router';
import { VacationScreen } from '@/components/vacation/VacationScreen';

export const Route = createFileRoute('/settings/vacation')({
  component: VacationScreen,
});
