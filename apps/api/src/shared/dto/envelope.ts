import { z } from "zod";
import { ErrorCode } from "../constants/errors";

export const ErrorResponse = z.object({
  code: ErrorCode,
  message: z.string(),
  details: z.any().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;

export const Paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    cursor: z.string().optional(),
  });
