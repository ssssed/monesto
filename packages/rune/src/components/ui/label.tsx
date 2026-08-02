import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';

import { cn } from '../../lib/utils';

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean;
  }
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'mb-1.5 block text-sm font-medium text-[var(--color-muted-foreground)]',
      className,
    )}
    {...props}
  >
    {children}
    {required ? <span className="ml-0.5 text-[var(--color-destructive)]">*</span> : null}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;
