import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import firebaseDefaults from "@/data/firebase-defaults.json";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Auth Emulator 利用時（ローカル開発） */
const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true";
const emulatorUrl =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ?? firebaseDefaults.authEmulatorUrl;

function getFirebaseApp(): FirebaseApp | null {
  if (getApps().length > 0) {
    return getApps()[0] as FirebaseApp;
  }
  // Emulator 利用時はダミー設定で初期化可能
  if (useEmulator) {
    return initializeApp({
      apiKey: firebaseDefaults.emulatorApiKey,
      authDomain: firebaseDefaults.emulatorAuthDomain,
      projectId: firebaseConfig.projectId ?? firebaseDefaults.emulatorProjectId,
    });
  }
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  return initializeApp(firebaseConfig);
}

let emulatorConnected = false;

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  const auth = getAuth(app);
  if (useEmulator && !emulatorConnected) {
    connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
    emulatorConnected = true;
  }
  return auth;
}
