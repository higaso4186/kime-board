"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

/** プロジェクトを開いたときのデフォルトは決裁ページ。ダッシュボードは管理権限向け。 */
export default function ProjectRootRedirect() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  useEffect(() => {
    router.replace(ROUTES.decisions(projectId));
  }, [projectId, router]);

  return null;
}
