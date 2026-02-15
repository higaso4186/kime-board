"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getFirebaseAuth } from "@/lib/firebase";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductLogo } from "@/components/ui/product-logo";

export default function SignupPage() {
  const router = useRouter();
  const useDemoAuth = process.env.NEXT_PUBLIC_USE_DEMO_AUTH === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const auth = getFirebaseAuth();

  useEffect(() => {
    if (useDemoAuth) {
      router.replace(ROUTES.login);
    }
  }, [useDemoAuth, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!auth) {
      setError("Firebase is not configured. Check apps/web/.env.local.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  }

  if (useDemoAuth) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center shadow-sm">
        <ProductLogo />
        <p className="mt-4 text-sm text-neutral-600">Demo mode only supports login.</p>
        <Button asChild className="mt-4">
          <Link href={ROUTES.login}>Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex justify-center">
        <ProductLogo />
      </div>
      <h1 className="mb-6 text-center text-lg font-semibold text-neutral-900">Sign up</h1>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
            Password (6+ chars)
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-neutral-700">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}