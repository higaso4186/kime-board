export const newId = (): string => {
  // Web Crypto if available
  // @ts-ignore
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export const isValidId = (s: string): boolean => typeof s === "string" && s.length >= 8;
