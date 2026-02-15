import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import runtimeDefaults from "@/data/config/runtime-defaults.json";

let auth: Auth | null = null;

/**
 * Firebase Admin SDK を初期化し、Auth を取得する。
 * - FIREBASE_AUTH_EMULATOR_HOST が設定されている場合: Auth Emulator に接続（本番資格情報不要）
 * - DISABLE_AUTH=true の場合は null
 * - それ以外: サービスアカウント資格情報で本番 Firebase に接続
 */
export function getFirebaseAdminAuth(): Auth | null {
  if (auth) return auth;
  if (process.env.DISABLE_AUTH === "true") return null;

  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID ??
    runtimeDefaults.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const existingApp = getApps().find((a) => (a as App).name === "[DEFAULT]");
  if (existingApp) {
    auth = getAuth(existingApp as App);
    return auth;
  }

  // Auth Emulator 利用時: 資格情報不要で接続
  if (emulatorHost) {
    const app = initializeApp({ projectId });
    auth = getAuth(app);
    return auth;
  }

  // 本番: サービスアカウント資格情報必須
  if (!clientEmail || !privateKey) {
    return null;
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  auth = getAuth(app);
  return auth;
}

export type VerifyResult =
  | { ok: true; uid: string; email?: string }
  | { ok: false; error: string };

/**
 * Bearer トークンを検証する。
 * - DISABLE_AUTH=true: スキップし、ダミー UID を返す
 * - DEMO_AUTH_TOKEN 一致: デモログインとして許可（Firebase 不使用）
 * - それ以外: Firebase ID Token を検証（未設定時はエラー）
 */
export async function verifyFirebaseToken(
  authorizationHeader: string | null,
): Promise<VerifyResult> {
  if (process.env.DISABLE_AUTH === "true") {
    return {
      ok: true,
      uid: runtimeDefaults.devAuthBypass.uid,
      email: runtimeDefaults.devAuthBypass.email,
    };
  }

  const demoToken = process.env.DEMO_AUTH_TOKEN;
  if (demoToken && authorizationHeader?.startsWith("Bearer ")) {
    const token = authorizationHeader.slice(7);
    if (token === demoToken) {
      const loginId = process.env.DEMO_LOGIN_ID ?? "demo";
      return { ok: true, uid: `demo:${loginId}`, email: loginId };
    }
  }

  const adminAuth = getFirebaseAdminAuth();
  if (!adminAuth) {
    return { ok: false, error: "Auth is not configured (set DEMO_AUTH_TOKEN or Firebase)" };
  }

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return { ok: false, error: "Missing or invalid Authorization header" };
  }

  const token = authorizationHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      ok: true,
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid token";
    return { ok: false, error: msg };
  }
}
