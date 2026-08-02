import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[#1d4ed8]',
        secondary:
          'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[#e2e8f0]',
        outline:
          'border border-[var(--color-border)] bg-white hover:bg-[var(--color-muted)]',
        ghost: 'hover:bg-[var(--color-muted)]',
        link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
        destructive:
          'border border-[var(--color-destructive)] bg-white text-[var(--color-destructive)] hover:bg-[var(--color-danger-soft)]',
        navy: 'bg-[var(--color-navy)] text-[var(--color-navy-foreground)] hover:bg-[#1e293b]',
      },
      size: {
        default: 'h-12 px-5 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-14 rounded-2xl px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
