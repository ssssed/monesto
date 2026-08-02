import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { registerSW } from 'virtual:pwa-register';

import './index.css';
import { BootGate } from '@/components/ui/BootGate';
import { routeTree } from './routeTree.gen';

/** Vite `base` ends with `/`; TanStack expects no trailing slash (except root). */
const baseUrl = import.meta.env.BASE_URL;
const basepath = baseUrl === '/' ? '/' : baseUrl.replace(/\/$/, '');

const router = createRouter({
  routeTree,
  basepath,
  notFoundMode: 'root',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BootGate>
      <RouterProvider router={router} />
    </BootGate>
  </StrictMode>,
);
