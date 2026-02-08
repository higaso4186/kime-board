import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] px-2.5 py-1 text-[var(--ui-font-size-caption)] font-medium leading-none text-[var(--color-neutral-700)]",
        className,
      )}
      {...props}
    />
  );
}
