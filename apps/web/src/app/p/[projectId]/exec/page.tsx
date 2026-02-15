"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";

export default function ExecPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;

  useEffect(() => {
    router.replace(ROUTES.projectDashboard(projectId));
  }, [projectId, router]);

  return (
    <Card>
      <CardTitle>管理職ビューはダッシュボードに統合しました</CardTitle>
      <CardDescription className="mt-2">
        自動的にダッシュボードへ移動します。移動しない場合は下記リンクを利用してください。
      </CardDescription>
      <Link
        href={ROUTES.projectDashboard(projectId)}
        className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        ダッシュボードへ移動
      </Link>
    </Card>
  );
}
