import { cn } from '@monesto/rune';
import { useId, type ReactNode } from 'react';

const ORBIT_R = 93;
const DOT_R = 6;
const VB_PAD = 14;

type Props = {
  title?: string;
  message?: string;
  center?: ReactNode;
  overlay?: boolean;
  className?: string;
};

/** Port of webapp Loader — orbital rings + wave dots. */
export function Loader({
  title = '',
  message = '',
  center,
  overlay = false,
  className,
}: Props) {
  const sid = useId().replace(/:/g, '');

  return (
    <div
      className={cn(
        overlay
          ? 'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white'
          : 'flex flex-col items-center justify-center',
        className,
      )}
    >
      <div className="loader-root flex flex-col items-center gap-7">
        <div
          className="relative shrink-0 overflow-visible"
          style={{
            width: 200 + 2 * VB_PAD,
            height: 200 + 2 * VB_PAD,
          }}
        >
          <svg
            className="h-full w-full overflow-visible"
            viewBox={`${-VB_PAD} ${-VB_PAD} ${200 + 2 * VB_PAD} ${200 + 2 * VB_PAD}`}
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient
                id={`${sid}-center-grad`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <filter
                id={`${sid}-dot-glow`}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id={`${sid}-center-shadow`}
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="10"
                  floodColor="#3b82f6"
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            <g className="loader-rings" transform="translate(100 100)">
              <circle
                className="loader-ring loader-ring--outer"
                r="99.25"
                fill="none"
                stroke="#bfdbfe"
                strokeWidth="1.5"
              />
              <circle
                className="loader-ring loader-ring--mid"
                r="77"
                fill="none"
                stroke="#93c5fd"
                strokeWidth="2"
              />
              <circle
                className="loader-ring loader-ring--inner"
                r="54.75"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2.5"
              />
            </g>

            <g transform="translate(100 100)">
              <g className="loader-orbit">
                <circle
                  cy={-ORBIT_R}
                  r={DOT_R}
                  fill="#3b82f6"
                  filter={`url(#${sid}-dot-glow)`}
                />
              </g>
            </g>

            <circle
              cx="100"
              cy="100"
              r="40"
              fill={`url(#${sid}-center-grad)`}
              filter={`url(#${sid}-center-shadow)`}
            />

            {center ? (
              <foreignObject
                x="60"
                y="60"
                width="80"
                height="80"
                className="overflow-visible"
              >
                <div className="flex h-full w-full items-center justify-center text-white [&_svg]:h-8 [&_svg]:w-8">
                  {center}
                </div>
              </foreignObject>
            ) : null}
          </svg>
        </div>

        {title || message ? (
          <div className="flex flex-col items-center gap-1">
            {title ? (
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            ) : null}
            {message ? (
              <p className="text-center text-sm text-slate-400">{message}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-2" aria-hidden>
          <span className="loader-wave-dot h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="loader-wave-dot h-2 w-2 rounded-full bg-blue-300" />
          <span className="loader-wave-dot h-2 w-2 rounded-full bg-blue-100" />
        </div>
      </div>
    </div>
  );
}
