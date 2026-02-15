"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getFirebaseAuth } from "@/lib/firebase";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductLogo } from "@/components/ui/product-logo";

const useDemoAuth = () => process.env.NEXT_PUBLIC_USE_DEMO_AUTH === "true";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const auth = getFirebaseAuth();
  const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";
  const demoAuth = useDemoAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (demoAuth) {
      if (!loginId.trim() || !password) {
        setError("ログインIDとパスワードを入力してください");
        return;
      }
    } else if (!auth) {
      setError("Firebase が設定されていません。.env.local を確認してください。");
      return;
    }
    setLoading(true);
    try {
      await signIn(loginId.trim(), password);
      if (typeof window !== "undefined") {
        window.location.href = ROUTES.projects;
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "ログインに失敗しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (authDisabled) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-xs text-amber-800">
          <p className="font-medium">デモモード</p>
          <p className="mt-1">認証をスキップして利用しています。プロジェクト一覧へお進みください。</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm text-center">
          <ProductLogo />
          <Button asChild className="mt-4">
            <Link href={ROUTES.projects}>プロジェクト一覧へ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-blue-800">
        <p className="font-medium">認証</p>
        <p className="mt-1">
          {demoAuth
            ? "デモ用ログインID・パスワードでログインします。Firebase は使用しません。"
            : "Firebase Auth 対応。Gログイン・Firebase での接続が可能です。ハッカソン向けにログインオプションを追加予定です。"}
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex justify-center">
          <ProductLogo />
        </div>
        <h1 className="mb-6 text-center text-lg font-semibold text-neutral-900">
          ログイン
        </h1>
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={demoAuth ? "loginId" : "email"}
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {demoAuth ? "ログインID" : "メールアドレス"}
            </label>
            <Input
              id={demoAuth ? "loginId" : "email"}
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder={demoAuth ? "demo" : "you@example.com"}
              required
              autoComplete={demoAuth ? "username" : "email"}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              パスワード
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
          {!demoAuth && (
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              disabled
              title="近日追加"
            >
              Googleでログイン（追加予定）
            </Button>
          )}
        </form>
        {!demoAuth && (
          <p className="mt-4 text-center text-sm text-neutral-600">
            アカウントをお持ちでない方は{" "}
            <Link href={ROUTES.signup} className="text-blue-600 hover:underline">
              新規登録
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
