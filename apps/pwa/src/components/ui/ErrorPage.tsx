import { Button } from '@monesto/rune';
import {
  Link,
  type ErrorComponentProps,
  type NotFoundRouteProps,
} from '@tanstack/react-router';
import { Home, RefreshCw, SearchX, ServerCrash } from 'lucide-react';

type Props = {
  status?: 404 | 500;
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorPage({
  status = 404,
  title,
  message,
  onRetry,
}: Props) {
  const is404 = status === 404;
  const heading =
    title ?? (is404 ? 'Страница не найдена' : 'Что-то пошло не так');
  const body =
    message ??
    (is404
      ? 'Такой страницы нет или она была перемещена. Вернитесь на главную и продолжите.'
      : 'Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.');

  const Icon = is404 ? SearchX : ServerCrash;

  return (
    <main className="mx-auto flex min-h-full w-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 animate-in fade-in-0 zoom-in-95 duration-500">
        <Icon className="h-9 w-9" strokeWidth={1.75} />
      </div>

      <p className="mb-2 text-sm font-bold tracking-[0.2em] text-blue-600 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        {status}
      </p>
      <h1 className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 [animation-delay:60ms] [animation-fill-mode:both] text-2xl font-bold text-slate-900">
        {heading}
      </h1>
      <p className="mt-2 max-w-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500 [animation-delay:120ms] [animation-fill-mode:both] text-[15px] leading-relaxed text-slate-400">
        {body}
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:180ms] [animation-fill-mode:both]">
        <Link to="/" className="w-full">
          <Button className="w-full" size="lg">
            <Home className="h-4 w-4" />
            На главную
          </Button>
        </Link>
        {!is404 && onRetry ? (
          <Button
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={onRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Попробовать снова
          </Button>
        ) : (
          <button
            type="button"
            className="w-full py-2 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
            onClick={() => window.history.back()}
          >
            Назад
          </button>
        )}
      </div>
    </main>
  );
}

export function NotFoundScreen(_props: NotFoundRouteProps) {
  return <ErrorPage status={404} />;
}

export function ServerErrorScreen({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : undefined;

  return (
    <ErrorPage
      status={500}
      message={message}
      onRetry={reset}
    />
  );
}
