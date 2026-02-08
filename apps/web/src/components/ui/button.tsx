import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  default:
    "border border-[var(--color-blue-700)] bg-[var(--color-blue-600)] !text-white hover:bg-[var(--color-blue-700)] hover:!text-white",
  secondary:
    "border border-[var(--color-blue-200)] bg-[var(--color-blue-50)] text-[var(--color-blue-800)] hover:bg-[var(--color-blue-100)]",
  outline:
    "border border-[var(--color-neutral-300)] bg-white text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)]",
  ghost: "text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]",
  danger:
    "border border-[var(--color-red-700)] bg-[var(--color-red-600)] !text-white hover:bg-[var(--color-red-700)] hover:!text-white",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-[var(--ui-control-h-sm)] px-3 text-[var(--ui-font-size-body)]",
  md: "h-[var(--ui-control-h-md)] px-4 text-[var(--ui-font-size-body)]",
  lg: "h-[var(--ui-control-h-lg)] px-5 text-[var(--ui-font-size-body)]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export function Button({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--ui-radius-control)] font-medium leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
