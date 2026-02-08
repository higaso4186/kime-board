"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui/select";

type ThemeOption = { id: string; label: string };
type PaletteWindow = Window & {
  __kimeboardPalette?: {
    defaultTheme: string;
    themes: Record<string, { label: string }>;
  };
  setKimeboardTheme?: (themeName: string) => void;
};

const STORAGE_KEY = "kimeboard-theme";
const READY_EVENT = "kimeboard-theme-ready";

export function ThemeSwitcher() {
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    function hydrateFromWindow() {
      const runtimeWindow = window as PaletteWindow;
      const palette = runtimeWindow.__kimeboardPalette;
      if (!palette) return;

      const options = Object.entries(palette.themes).map(([id, theme]) => ({
        id,
        label: theme.label,
      }));
      setThemes(options);

      const stored = localStorage.getItem(STORAGE_KEY);
      setCurrent(stored || palette.defaultTheme);
    }

    hydrateFromWindow();
    window.addEventListener(READY_EVENT, hydrateFromWindow);
    return () => window.removeEventListener(READY_EVENT, hydrateFromWindow);
  }, []);

  if (themes.length === 0) return null;

  return (
    <Select
      controlSize="sm"
      className="max-w-[130px]"
      value={current}
      onChange={(event) => {
        const next = event.target.value;
        setCurrent(next);
        (window as PaletteWindow).setKimeboardTheme?.(next);
      }}
      aria-label="テーマ切り替え"
    >
      {themes.map((theme) => (
        <option key={theme.id} value={theme.id}>
          {theme.label}
        </option>
      ))}
    </Select>
  );
}
