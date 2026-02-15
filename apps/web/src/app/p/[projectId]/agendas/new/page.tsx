"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { ROUTES } from "@/lib/routes";

export default function AgendaNewPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const { snapshot, loading } = useDemoProjectSnapshot(projectId);

  useEffect(() => {
    if (loading) return;
    const nextMeeting = snapshot?.meetings[0];
    if (nextMeeting) {
      router.replace(ROUTES.meetingAgenda(projectId, nextMeeting.meetingId));
      return;
    }
    router.replace(ROUTES.meetings(projectId));
  }, [loading, projectId, router, snapshot]);

  return (
    <Card>
      <CardTitle>遷移中...</CardTitle>
    </Card>
  );
}
