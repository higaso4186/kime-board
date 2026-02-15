"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

export function Radio({ className, ...props }: RadioProps) {
  return (
    <label className={cn("relative inline-flex cursor-pointer", className)}>
      <input type="radio" className="peer sr-only" {...props} />
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-white transition peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        <span className="h-2 w-2 rounded-full bg-white opacity-0 transition peer-checked:opacity-100" />
      </span>
    </label>
  );
}
