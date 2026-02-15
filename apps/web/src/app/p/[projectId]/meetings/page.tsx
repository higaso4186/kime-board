"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { ROUTES } from "@/lib/routes";

export default function MeetingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const { snapshot, loading, error } = useDemoProjectSnapshot(projectId);
  const decisions = snapshot?.decisions ?? [];
  const meetings = snapshot?.meetings ?? [];

  if (loading) {
    return (
      <Card>
        <CardTitle>読み込み中</CardTitle>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle>読み込みに失敗しました</CardTitle>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>会議一覧</CardTitle>
      <div className="mt-4 space-y-2">
        {meetings.map((meeting) => {
          const linkedDecisions = decisions.filter((decision) =>
            meeting.extractedDecisionIds.includes(decision.decisionId),
          );
          if (linkedDecisions.length === 0) {
            return null;
          }

          return (
            <div
              key={meeting.meetingId}
              className="rounded-[10px] border border-neutral-200 px-3 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={ROUTES.meetingDetail(projectId, meeting.meetingId)}
                  className="text-sm font-medium hover:text-blue-600"
                >
                  {meeting.title}
                </Link>
                <p className="text-xs text-neutral-600">
                  {meeting.heldAt.slice(0, 16).replace("T", " ")}
                </p>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                この会議で決める決裁
              </p>
              <p className="mt-1 text-sm text-neutral-800">
                {linkedDecisions.map((decision) => decision.title).join(" / ")}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
