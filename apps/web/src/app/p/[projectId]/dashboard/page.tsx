"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OpenRightPanelButton } from "@/components/layout/open-right-panel-button";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/status-chip";
import {
  decisionStatusLabels,
  execDefaults,
  type DecisionStatus,
} from "@/lib/mock/data";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { ROUTES } from "@/lib/routes";

export default function ProjectDashboardPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const { snapshot, loading, error } = useDemoProjectSnapshot(projectId);
  const project = snapshot?.project ?? null;
  const allDecisions = useMemo(() => snapshot?.decisions ?? [], [snapshot?.decisions]);
  const meetings = useMemo(() => snapshot?.meetings ?? [], [snapshot?.meetings]);
  const actions = useMemo(() => snapshot?.actions ?? [], [snapshot?.actions]);
  const questions = useMemo(
    () => snapshot?.insufficientQuestions ?? [],
    [snapshot?.insufficientQuestions],
  );
  const nextMeeting = meetings[0];
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | "ALL">("ALL");

  const decisions = useMemo(
    () =>
      statusFilter === "ALL"
        ? allDecisions
        : allDecisions.filter((decision) => decision.status === statusFilter),
    [allDecisions, statusFilter],
  );
  const missingOwnerDecisions = useMemo(
    () => allDecisions.filter((decision) => !decision.owner),
    [allDecisions],
  );
  const overdueActions = useMemo(
    () => actions.filter((action) => action.status === "BLOCKED" || action.status === "TODO"),
    [actions],
  );

  function getSuggestedOwner(meetingTitle?: string) {
    if (!meetingTitle) return "候補未取得";
    const linkedMeeting = meetings.find((meeting) => meeting.title === meetingTitle);
    return linkedMeeting?.participants[0] ?? "候補未取得";
  }

  function getOverdueDays(dueAt?: string) {
    if (!dueAt) return 0;
    return Math.max(
      1,
      Math.floor(
        (new Date(execDefaults.overdueReferenceAt).getTime() - new Date(dueAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  }

  if (loading) {
    return (
      <Card>
        <CardTitle>読み込み中</CardTitle>
        <CardDescription className="mt-2">プロジェクトデータを読み込んでいます。</CardDescription>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle>読み込みに失敗しました</CardTitle>
        <CardDescription className="mt-2">{error}</CardDescription>
        <Button asChild className="mt-4 w-fit">
          <Link href={ROUTES.projects}>プロジェクト一覧へ</Link>
        </Button>
      </Card>
    );
  }

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

      <section className="grid grid-cols-12 gap-6">
        <Card className="col-span-7">
          <CardTitle>決裁（上位）</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant={statusFilter === "ALL" ? "secondary" : "ghost"} onClick={() => setStatusFilter("ALL")}>全て</Button>
            <Button size="sm" variant={statusFilter === "NEEDS_INFO" ? "secondary" : "ghost"} onClick={() => setStatusFilter("NEEDS_INFO")}>{decisionStatusLabels.NEEDS_INFO}</Button>
            <Button size="sm" variant={statusFilter === "READY_TO_DECIDE" ? "secondary" : "ghost"} onClick={() => setStatusFilter("READY_TO_DECIDE")}>{decisionStatusLabels.READY_TO_DECIDE}</Button>
            <Button size="sm" variant={statusFilter === "DECIDED" ? "secondary" : "ghost"} onClick={() => setStatusFilter("DECIDED")}>{decisionStatusLabels.DECIDED}</Button>
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

      <section className="grid grid-cols-12 gap-6">
        <Card className="col-span-7">
          <CardTitle>決裁者未設定（要対応）</CardTitle>
          <CardDescription className="mt-1">
            決裁者未設定のままだと会議で決める対象の責任が曖昧になるため、優先対応します。
          </CardDescription>
          <div className="mt-4 space-y-2">
            {missingOwnerDecisions.length === 0 ? (
              <p className="rounded-[10px] bg-neutral-50 px-3 py-3 text-sm text-neutral-500">
                決裁者未設定の決裁はありません。
              </p>
            ) : (
              missingOwnerDecisions.map((decision) => (
                <div
                  key={decision.decisionId}
                  className="grid grid-cols-12 items-center rounded-[10px] bg-neutral-50 px-3 py-2 text-sm"
                >
                  <Link
                    href={ROUTES.decisionDetail(projectId, decision.decisionId)}
                    className="col-span-5 font-medium hover:text-blue-700"
                  >
                    {decision.title}
                  </Link>
                  <p className="col-span-3 text-neutral-600">{decision.meetingTitle || "未紐付け"}</p>
                  <p className="col-span-2 text-neutral-600">
                    不足{" "}
                    {
                      questions.filter(
                        (question) =>
                          question.decisionId === decision.decisionId && question.status === "OPEN",
                      ).length
                    }
                    件
                  </p>
                  <p className="col-span-2 text-neutral-600">
                    候補: {getSuggestedOwner(decision.meetingTitle)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="col-span-5">
          <CardTitle>期限超過アクション</CardTitle>
          <CardDescription className="mt-1">
            TODO/BLOCKED のアクションを優先表示しています。
          </CardDescription>
          <div className="mt-4 space-y-2">
            {overdueActions.length === 0 ? (
              <p className="rounded-[10px] bg-neutral-50 px-3 py-3 text-sm text-neutral-500">
                期限超過アクションはありません。
              </p>
            ) : (
              overdueActions.map((action) => (
                <div key={action.actionId} className="rounded-[10px] bg-neutral-50 px-3 py-2 text-sm">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs text-neutral-600">
                    紐づく決裁: {action.decisionId} / 担当: {action.assignee || "未設定"} / 超過:{" "}
                    {getOverdueDays(action.dueAt)}日
                  </p>
                  <div className="mt-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={ROUTES.chat(projectId, action.decisionId)}>
                        状況確認（チャット）
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
