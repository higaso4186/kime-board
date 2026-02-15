"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const DEMO_TOKEN_KEY = "kimeboard_demo_token";
const DEMO_LOGIN_ID_KEY = "kimeboard_demo_login_id";

type DemoUser = {
  displayName: string;
  email: string;
};

type AuthContextValue = {
  user: User | DemoUser | null;
  loading: boolean;
  signIn: (emailOrLoginId: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function useDemoAuth(): boolean {
  return process.env.NEXT_PUBLIC_USE_DEMO_AUTH === "true";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const useDemo = useDemoAuth();
  const auth = getFirebaseAuth();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [demoLoginId, setDemoLoginId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const user = useDemo
    ? demoToken && demoLoginId
      ? ({ displayName: demoLoginId, email: demoLoginId } as DemoUser)
      : null
    : firebaseUser;

  useEffect(() => {
    if (useDemo) {
      const stored = typeof window !== "undefined"
        ? localStorage.getItem(DEMO_TOKEN_KEY)
        : null;
      const storedId = typeof window !== "undefined"
        ? localStorage.getItem(DEMO_LOGIN_ID_KEY)
        : null;
      setDemoToken(stored);
      setDemoLoginId(storedId);
      setLoading(false);
      return;
    }
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setFirebaseUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth, useDemo]);

  const signIn = useCallback(
    async (emailOrLoginId: string, password: string) => {
      if (useDemo) {
        const res = await fetch("/api/backend/auth/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loginId: emailOrLoginId, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message ?? "ログインに失敗しました");
        }
        const { token, loginId } = data;
        setDemoToken(token);
        setDemoLoginId(loginId);
        if (typeof window !== "undefined") {
          localStorage.setItem(DEMO_TOKEN_KEY, token);
          localStorage.setItem(DEMO_LOGIN_ID_KEY, loginId);
        }
        return;
      }
      if (!auth) throw new Error("Firebase Auth is not configured");
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, emailOrLoginId, password);
    },
    [auth, useDemo],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (useDemo) {
        throw new Error("デモモードでは新規登録できません。ログインID/パスワードでログインしてください。");
      }
      if (!auth) throw new Error("Firebase Auth is not configured");
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      await createUserWithEmailAndPassword(auth, email, password);
    },
    [auth, useDemo],
  );

  const signOut = useCallback(async () => {
    if (useDemo) {
      setDemoToken(null);
      setDemoLoginId(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(DEMO_TOKEN_KEY);
        localStorage.removeItem(DEMO_LOGIN_ID_KEY);
      }
      return;
    }
    if (auth) await auth.signOut();
  }, [auth, useDemo]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (useDemo) return demoToken;
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  }, [useDemo, demoToken, firebaseUser]);

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
