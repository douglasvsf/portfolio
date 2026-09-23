"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Marca o input como inválido (borda + cor de destructive, aria-invalid). */
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, disabled, readOnly, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-readonly={readOnly || undefined}
        className={cn(
          "flex h-(--size-control-md) w-full rounded-md border border-input bg-background px-3 py-2 text-body-sm text-foreground",
          "placeholder:text-muted-foreground",
          "transition-colors duration-(--duration-fast) ease-(--ease-standard)",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "read-only:bg-muted read-only:cursor-default",
          invalid && "border-destructive focus-visible:ring-destructive",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
