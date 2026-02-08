export const nowIso = (): string => new Date().toISOString();
export const toIso = (d: Date): string => d.toISOString();
export const parseIso = (s: string): Date => new Date(s);
