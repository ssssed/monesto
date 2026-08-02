import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@monesto/rune';

export function PageHeader({
  title,
  backTo,
  onBack,
  backLabel = 'Назад',
  right,
}: {
  title: string;
  backTo?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
}) {
  const backClass =
    'absolute left-0 flex items-center gap-0.5 text-[15px] font-medium text-[var(--color-primary)]';

  return (
    <header className="relative mb-4 flex h-11 items-center justify-center">
      {onBack ? (
        <button type="button" onClick={onBack} className={backClass}>
          <ChevronLeft className="h-5 w-5" />
          {backLabel}
        </button>
      ) : backTo ? (
        <Link to={backTo} className={backClass}>
          <ChevronLeft className="h-5 w-5" />
          {backLabel}
        </Link>
      ) : null}
      <h1 className="text-[17px] font-semibold text-slate-900">{title}</h1>
      {right ? <div className="absolute right-0">{right}</div> : null}
    </header>
  );
}

export function PageTitle({
  title,
  subtitle,
  align = 'left',
}: {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={cn('mb-5', align === 'center' && 'text-center')}>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'mt-1.5 text-[15px] leading-snug text-slate-400',
            align === 'center' && 'mx-auto max-w-sm',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
