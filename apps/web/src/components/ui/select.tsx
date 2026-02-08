import * as React from "react";
import { cn } from "@/lib/utils";

type SelectSize = "sm" | "md";

const sizeClass: Record<SelectSize, string> = {
  sm: "h-[var(--ui-control-h-sm)] px-2.5 text-[var(--ui-font-size-body)]",
  md: "h-[var(--ui-control-h-md)] px-3 text-[var(--ui-font-size-body)]",
};

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  controlSize?: SelectSize;
}

export function Select({
  className,
  controlSize = "md",
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-[var(--ui-radius-control)] border border-neutral-300 bg-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
        sizeClass[controlSize],
        className,
      )}
      {...props}
    />
  );
}
