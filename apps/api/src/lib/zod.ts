import { z, type ZodTypeAny } from "zod";

export const parseJson = async (req: Request): Promise<unknown> => {
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

export const validate = <T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> => schema.parse(data);
