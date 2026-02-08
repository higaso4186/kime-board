"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MockToastAction({
  primaryLabel,
  secondaryLabel,
  message,
}: {
  primaryLabel: string;
  secondaryLabel?: string;
  message: string;
}) {
  const [notice, setNotice] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {secondaryLabel ? (
          <Button variant="outline" onClick={() => setNotice(`${secondaryLabel} しました`)}>
            {secondaryLabel}
          </Button>
        ) : null}
        <Button onClick={() => setNotice(message)}>{primaryLabel}</Button>
      </div>
      {notice ? (
        <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
