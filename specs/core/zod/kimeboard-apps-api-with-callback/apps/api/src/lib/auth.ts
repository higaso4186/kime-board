import { ApiError } from "./http";

/**
 * MVP security for public API:
 * Agent callback endpoints must include a shared secret header.
 *
 * Cloud Run auth (service-to-service) is also possible, but this works even if api is public.
 * Set `AGENT_CALLBACK_TOKEN` in API (and agent) env.
 *
 * Agent should send: `X-Agent-Token: <token>`
 */
export const requireAgentToken = (req: Request) => {
  const expected = process.env.AGENT_CALLBACK_TOKEN;
  if (!expected) {
    // If not set, we fail closed to avoid accidental open callback.
    const err: ApiError = {
      code: "FORBIDDEN",
      message: "AGENT_CALLBACK_TOKEN is not configured",
      status: 403,
    };
    throw err;
  }
  const got = req.headers.get("x-agent-token") || req.headers.get("X-Agent-Token");
  if (!got || got !== expected) {
    const err: ApiError = { code: "FORBIDDEN", message: "Invalid agent token", status: 403 };
    throw err;
  }
};
