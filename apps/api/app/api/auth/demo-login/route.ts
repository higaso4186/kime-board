import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { parseJson, validate } from "@/lib/zod";
import { z } from "zod";

export const runtime = "nodejs";

const LoginBody = z.object({
  loginId: z.string().min(1),
  password: z.string().min(1),
});

/**
 * 繝・Δ逕ｨ繝ｭ繧ｰ繧､繝ｳ縲・EMO_LOGIN_ID / DEMO_LOGIN_PASSWORD 縺ｨ荳閾ｴ縺吶ｌ縺ｰ
 * DEMO_AUTH_TOKEN 繧定ｿ斐☆縲・irebase 縺ｯ菴ｿ逕ｨ縺励↑縺・・ */
export async function POST(req: Request) {
  try {
    const loginId = process.env.DEMO_LOGIN_ID;
    const password = process.env.DEMO_LOGIN_PASSWORD;
    const token = process.env.DEMO_AUTH_TOKEN;

    if (!loginId || !password || !token) {
      return jsonError({
        code: "INTERNAL",
        message: "Demo login is not configured. Set DEMO_LOGIN_ID, DEMO_LOGIN_PASSWORD, DEMO_AUTH_TOKEN.",
        status: 503,
      });
    }

    const body = await parseJson(req);
    const input = validate(LoginBody, body);

    if (input.loginId !== loginId || input.password !== password) {
      return jsonError({
        code: "FORBIDDEN",
        message: "Invalid login ID or password",
        status: 401,
      });
    }

    return jsonOk({ token, loginId: input.loginId });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

