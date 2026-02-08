"use client";

import { useEffect } from "react";

type ThemeTokens = Record<string, string>;
type PaletteTheme = {
  label: string;
  tokens: ThemeTokens;
};
type PaletteConfig = {
  defaultTheme: string;
  themes: Record<string, PaletteTheme>;
};

declare global {
  interface Window {
    __kimeboardPalette?: PaletteConfig;
    setKimeboardTheme?: (themeName: string) => void;
  }
}

const STORAGE_KEY = "kimeboard-theme";
const READY_EVENT = "kimeboard-theme-ready";

function applyTheme(config: PaletteConfig, themeName: string) {
  const fallbackThemeName = config.defaultTheme;
  const resolvedThemeName = config.themes[themeName] ? themeName : fallbackThemeName;
  const theme = config.themes[resolvedThemeName];
  if (!theme) return;

  Object.entries(theme.tokens).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
  document.documentElement.dataset.theme = resolvedThemeName;
  localStorage.setItem(STORAGE_KEY, resolvedThemeName);
}

export function PaletteRuntime() {
  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const res = await fetch("/palette.json", { cache: "no-store" });
        if (!res.ok) return;

        const config = (await res.json()) as PaletteConfig;
        if (!mounted) return;

        window.__kimeboardPalette = config;
        const stored = localStorage.getItem(STORAGE_KEY);
        const initialTheme = stored || config.defaultTheme;
        applyTheme(config, initialTheme);

        window.setKimeboardTheme = (themeName: string) => {
          applyTheme(config, themeName);
          window.dispatchEvent(new CustomEvent(READY_EVENT));
        };

        window.dispatchEvent(new CustomEvent(READY_EVENT));
      } catch {
        // noop: fallback variables from globals.css remain active
      }
    }

    void boot();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
