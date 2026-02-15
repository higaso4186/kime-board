"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/routes";

const PUBLIC_PATHS = ["/login", "/signup"];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";
  const useDemoAuth = process.env.NEXT_PUBLIC_USE_DEMO_AUTH === "true";

  useEffect(() => {
    if (authDisabled) return;
    if (loading) return;

    const onPublic = isPublicPath(pathname);

    if (user && onPublic) {
      router.replace(ROUTES.projects);
      return;
    }

    if (!user && !onPublic) {
      router.replace(ROUTES.login);
      return;
    }
  }, [user, loading, pathname, router, authDisabled, useDemoAuth]);

  if (authDisabled) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user && !isPublicPath(pathname)) {
    return null; // redirecting
  }

  return <>{children}</>;
}
