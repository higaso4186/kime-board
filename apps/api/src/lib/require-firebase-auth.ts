import type { ApiError } from "./http";
import { verifyFirebaseToken } from "./firebase-admin";

/**
 * リクエストから Firebase ID Token を検証する。
 * 検証に失敗した場合は ApiError を throw する。
 * 戻り値の uid, email を利用してユーザー識別を行う。
 */
export async function requireFirebaseAuth(req: Request): Promise<{
  uid: string;
  email?: string;
}> {
  const authHeader = req.headers.get("authorization");
  const result = await verifyFirebaseToken(authHeader);

  if (!result.ok) {
    const err: ApiError = {
      code: "FORBIDDEN",
      message: result.error,
      status: 401,
    };
    throw err;
  }

  return { uid: result.uid, email: result.email };
}
