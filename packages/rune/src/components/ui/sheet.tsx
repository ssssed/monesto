import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/40',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-200',
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'bottom' | 'top';
  }
>(({ side = 'bottom', className, children, onOpenAutoFocus, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        onOpenAutoFocus?.(event);
      }}
      className={cn(
        'fixed z-50 flex max-h-[92vh] w-full flex-col gap-0 bg-white shadow-xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'duration-300 ease-out',
        side === 'bottom' &&
          'inset-x-0 bottom-0 rounded-t-3xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        side === 'top' &&
          'inset-x-0 top-0 rounded-b-3xl border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-200" />
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col space-y-1 px-6 pb-2 pt-3 text-center sm:text-left',
        className,
      )}
      {...props}
    />
  );
}

export function SheetBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-2',
        className,
      )}
      {...props}
    />
  );
}

export function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'shrink-0 space-y-2 border-t border-slate-100 bg-white px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-3',
        className,
      )}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-center text-lg font-bold text-slate-900', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-[var(--color-muted-foreground)]', className)}
      {...props}
    />
  );
}
