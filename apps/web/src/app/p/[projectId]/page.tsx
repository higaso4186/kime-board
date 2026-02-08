"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OpenRightPanelButton } from "@/components/layout/open-right-panel-button";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/status-chip";
import {
  getProject,
  getProjectDecisions,
  getProjectMeetings,
  type DecisionStatus,
} from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

export default function ProjectHomePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const project = getProject(projectId);
  const allDecisions = getProjectDecisions(projectId);
  const nextMeeting = getProjectMeetings(projectId)[0];
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | "ALL">("ALL");

  const decisions = useMemo(
    () =>
      statusFilter === "ALL"
        ? allDecisions
        : allDecisions.filter((decision) => decision.status === statusFilter),
    [allDecisions, statusFilter],
  );

  if (!project) {
    return (
      <Card>
        <CardTitle>プロジェクトが見つかりません</CardTitle>
        <CardDescription className="mt-2">
          URLが無効です。プロジェクト一覧から選択してください。
        </CardDescription>
        <Button asChild className="mt-4 w-fit">
          <Link href={ROUTES.projects}>プロジェクト一覧へ</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-12 gap-6">
        <Card className="col-span-3">
          <CardDescription>未決決裁</CardDescription>
          <p className="mt-2 text-3xl font-semibold">{project.undecided}</p>
        </Card>
        <Card className="col-span-3 border-blue-200 bg-blue-50">
          <CardDescription>決められる</CardDescription>
          <p className="mt-2 text-3xl font-semibold text-blue-700">{project.ready}</p>
        </Card>
        <Card className="col-span-3 border-red-200 bg-red-50">
          <CardDescription>期限超過</CardDescription>
          <p className="mt-2 text-3xl font-semibold text-red-700">{project.overdue}</p>
        </Card>
        <Card className="col-span-3 border-amber-200 bg-amber-50">
          <CardDescription>決裁者未設定</CardDescription>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{project.missingOwner}</p>
        </Card>
      </section>

      <Card className="flex items-center justify-between">
        <div>
          <CardTitle>会議メモを貼り付けて解析</CardTitle>
          <CardDescription>議事録を決裁に変換し、不足を質問します。</CardDescription>
        </div>
        <Button asChild>
          <Link className="text-white hover:text-white" href={ROUTES.meetingNew(projectId)}>
            会議メモを追加
          </Link>
        </Button>
      </Card>

      <section className="grid grid-cols-12 gap-6">
        <Card className="col-span-7">
          <CardTitle>決裁（上位）</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant={statusFilter === "ALL" ? "secondary" : "ghost"} onClick={() => setStatusFilter("ALL")}>全て</Button>
            <Button size="sm" variant={statusFilter === "NEEDS_INFO" ? "secondary" : "ghost"} onClick={() => setStatusFilter("NEEDS_INFO")}>NEEDS_INFO</Button>
            <Button size="sm" variant={statusFilter === "READY_TO_DECIDE" ? "secondary" : "ghost"} onClick={() => setStatusFilter("READY_TO_DECIDE")}>READY</Button>
            <Button size="sm" variant={statusFilter === "DECIDED" ? "secondary" : "ghost"} onClick={() => setStatusFilter("DECIDED")}>DECIDED</Button>
          </div>
          <div className="mt-4 space-y-2">
            {decisions.slice(0, 5).map((decision) => (
              <div
                key={decision.decisionId}
                className="grid grid-cols-12 items-center rounded-[10px] border border-neutral-200 px-3 py-2 text-sm"
              >
                <div className="col-span-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-0 py-0"
                    onClick={() => setStatusFilter(decision.status)}
                  >
                    <StatusChip status={decision.status} />
                  </Button>
                </div>
                <Link
                  href={ROUTES.decisionDetail(projectId, decision.decisionId)}
                  className="col-span-5 font-medium hover:text-blue-600"
                >
                  {decision.title}
                </Link>
                <p className="col-span-2 text-neutral-600">{decision.owner || "未設定"}</p>
                <p className="col-span-2 text-neutral-600">{decision.dueAt?.slice(5, 10)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-5">
          <CardTitle>次の会議で決める候補</CardTitle>
          <div className="mt-4 space-y-3">
            {allDecisions.slice(0, 3).map((decision, index) => (
              <div
                key={decision.decisionId}
                className="rounded-[10px] border border-neutral-200 px-3 py-3"
              >
                <p className="text-sm font-medium">{decision.title}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-600">
                  <span>タイムボックス: {15 + index * 10}分</span>
                  <StatusChip status={decision.status} />
                </div>
                <Link
                  href={
                    nextMeeting
                      ? ROUTES.meetingAgenda(projectId, nextMeeting.meetingId)
                      : ROUTES.meetings(projectId)
                  }
                  className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline"
                >
                  会議ページでアジェンダ素案を開く
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <OpenRightPanelButton label="質問を見る" tab="chat" />
          </div>
        </Card>
      </section>
    </div>
  );
}
