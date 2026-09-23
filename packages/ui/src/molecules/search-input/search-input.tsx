"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Search, X } from "@godzilla/icons";
import { useTranslation } from "@godzilla/i18n";
import { cn } from "../../lib/utils";
import { Input } from "../../atoms/input/input";

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Chamado quando o botão de limpar é clicado (ou o campo é esvaziado). */
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, placeholder, onClear, "aria-label": ariaLabel, ...props }, ref) => {
    const t = useTranslation();
    const labelId = useId();
    const showClear = Boolean(value);

    return (
      <div className={cn("relative", className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-(--size-icon-sm) -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={ref}
          type="search"
          value={value}
          placeholder={placeholder ?? t.search}
          aria-label={ariaLabel ?? t.search}
          id={labelId}
          className={cn("pl-9", showClear && "pr-9")}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={t.clear}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X className="size-(--size-icon-sm)" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
