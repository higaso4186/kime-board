"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <label className={cn("relative inline-flex cursor-pointer", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-neutral-300 bg-white transition peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        <Check className="h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
    </label>
  );
}
