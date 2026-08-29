import { Send } from 'lucide-react';

const APP_VERSION = __APP_VERSION__;
const TELEGRAM_URL =
  import.meta.env.VITE_TELEGRAM_URL ?? 'https://t.me/monesto_news';
const TELEGRAM_NAME = import.meta.env.VITE_TELEGRAM_NAME ?? '@monesto_news';

/** Compact about strip — mirrors webapp settings info-section. */
export function AppAboutFooter() {
  return (
    <section className="mt-auto flex flex-col items-center gap-1 py-8">
      <span className="text-xs font-medium text-slate-300">
        Monesto v{APP_VERSION}
      </span>
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-blue-600"
      >
        <Send className="h-3.5 w-3.5" strokeWidth={2} />
        {TELEGRAM_NAME}
      </a>
    </section>
  );
}
