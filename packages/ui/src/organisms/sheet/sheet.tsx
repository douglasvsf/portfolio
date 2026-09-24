"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "@godzilla/icons";
import { useTranslation } from "@godzilla/i18n";
import { cn } from "../../lib/utils";

/*
 * Sheet — painel que desliza de uma borda da tela (port do shadcn/ui sobre o
 * Dialog do Radix): foco preso dentro, Esc fecha, overlay clicável.
 * Uso típico: menu de navegação no mobile.
 */

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-(--z-overlay) bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const sheetVariants = cva(
  [
    "fixed z-(--z-modal) flex flex-col gap-4 border-border bg-background p-6 shadow-lg focus:outline-none",
    "transition ease-(--ease-emphasized) data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=open]:duration-(--duration-slow) data-[state=closed]:duration-(--duration-base)",
  ],
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
        left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        top: "inset-x-0 top-0 border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export interface SheetContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

export const SheetContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(
  ({ side, className, children, ...props }, ref) => {
    const t = useTranslation();
    return (
      <SheetPortal>
        <SheetOverlay />
        <DialogPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
          {children}
          <DialogPrimitive.Close
            aria-label={t.close}
            className={cn(
              "absolute right-4 top-4 rounded-sm p-1 text-muted-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X className="size-(--size-icon-md)" aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = "SheetContent";

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto flex flex-col gap-2", className)} {...props} />;
}

export const SheetTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-h4 font-semibold", className)} {...props} />
));
SheetTitle.displayName = "SheetTitle";

export const SheetDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-body-sm text-muted-foreground", className)} {...props} />
));
SheetDescription.displayName = "SheetDescription";
