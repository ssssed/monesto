/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_URL?: string;
  readonly VITE_TELEGRAM_NAME?: string;
  readonly VITE_FEATURE_YEAR_SUMMARY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
