import { createFileRoute } from '@tanstack/react-router';
import { AssetsScreen } from '@/components/screens';
export const Route = createFileRoute('/assets/')({ component: AssetsScreen });
