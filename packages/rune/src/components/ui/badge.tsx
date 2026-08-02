import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary)] text-white',
        secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
        success: 'bg-[var(--color-success-foreground)] text-[var(--color-success)]',
        outline: 'border border-[var(--color-border)] text-[var(--color-foreground)]',
        soft: 'bg-[#eff6ff] text-[var(--color-primary)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
