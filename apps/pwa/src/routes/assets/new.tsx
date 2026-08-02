import { createFileRoute } from '@tanstack/react-router';
import { AssetFormScreen } from '@/components/screens';
export const Route = createFileRoute('/assets/new')({ component: AssetFormScreen });
