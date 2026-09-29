"use client";

import { forwardRef, type ChangeEvent } from "react";
import { Input, type InputProps } from "@godzilla/ui";
import { applyMask, type MaskKind } from "@/lib/erp/masks";

/**
 * Input do Design System com máscara aplicada enquanto a pessoa digita.
 * Funciona sem estado (formulários com `defaultValue` + server action): a
 * máscara reescreve o valor do próprio campo.
 */
export const MaskedInput = forwardRef<HTMLInputElement, InputProps & { mask: MaskKind }>(function MaskedInput({ mask, onChange, defaultValue, ...props }, ref) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(mask, event.currentTarget.value);
    if (masked !== event.currentTarget.value) event.currentTarget.value = masked;
    onChange?.(event);
  };
  return <Input ref={ref} {...props} defaultValue={typeof defaultValue === "string" ? applyMask(mask, defaultValue) : defaultValue} onChange={handleChange} />;
});
