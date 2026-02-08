import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-[var(--ui-control-h-md)] w-full rounded-[var(--ui-radius-control)] border border-neutral-300 bg-white px-3 text-[var(--ui-font-size-body)] text-neutral-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
        className,
      )}
      {...props}
    />
  );
}
