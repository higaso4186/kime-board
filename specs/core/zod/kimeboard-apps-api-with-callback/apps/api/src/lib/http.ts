import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ErrorCode } from "@kimeboard/shared";

export type ApiError = {
  code: typeof ErrorCode._type;
  message: string;
  details?: unknown;
  status: number;
};

export const jsonOk = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json(data, { status: 200, ...init });

export const jsonCreated = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json(data, { status: 201, ...init });

export const jsonNoContent = () => new NextResponse(null, { status: 204 });

export const jsonError = (err: ApiError) =>
  NextResponse.json(
    { code: err.code, message: err.message, details: err.details },
    { status: err.status }
  );

export const fromZodError = (e: ZodError): ApiError => ({
  code: "VALIDATION_ERROR",
  message: "Validation error",
  details: e.flatten(),
  status: 400,
});

export const toApiError = (e: unknown): ApiError => {
  if (typeof e === "object" && e && "status" in e && "code" in e && "message" in e) {
    return e as ApiError;
  }
  if (e instanceof ZodError) return fromZodError(e);
  return { code: "INTERNAL", message: "Internal error", details: String(e), status: 500 };
};

export const requireParam = (v: string | undefined, name: string): string => {
  if (!v) {
    const err: ApiError = { code: "VALIDATION_ERROR", message: `Missing param: ${name}`, status: 400 };
    throw err;
  }
  return v;
};
