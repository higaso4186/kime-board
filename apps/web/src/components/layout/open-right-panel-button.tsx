"use client";

import { Button } from "@/components/ui/button";
import { useRightPanel } from "@/components/layout/project-shell";

export function OpenRightPanelButton({
  label,
  tab = "chat",
  size = "md",
  className,
}: {
  label: string;
  tab?: "chat" | "log";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { openPanel } = useRightPanel();
  return (
    <Button
      variant="outline"
      size={size}
      className={className}
      onClick={() => openPanel(tab)}
    >
      {label}
    </Button>
  );
}
