export const normalizeWhitespace = (s: string): string =>
  s.replace(/\s+/g, " ").trim();

export const truncate = (s: string, max: number): string =>
  s.length <= max ? s : s.slice(0, Math.max(0, max - 1)) + "…";
