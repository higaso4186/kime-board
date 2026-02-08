"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { OpenRightPanelButton } from "@/components/layout/open-right-panel-button";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { StatusChip } from "@/components/status-chip";
import {
  agentLogs,
  getMeeting,
  getProjectActions,
  getProjectDecisions,
  getProjectMeetings,
  type Meeting,
  type MeetingStatus,
} from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

export default function MeetingDetailPage() {
  const params = useParams<{ projectId: string; meetingId: string }>();
  const searchParams = useSearchParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const meetingId = Array.isArray(params.meetingId)
    ? params.meetingId[0]
    : params.meetingId;

  const meetingData = getMeeting(projectId, meetingId);
  const fallbackMeeting = getProjectMeetings(projectId)[0];
  const meeting: Meeting | null = meetingData ?? fallbackMeeting ?? null;

  const queryState = searchParams.get("state") as MeetingStatus | null;
  const [status, setStatus] = useState<MeetingStatus>(queryState ?? meeting?.status ?? "ANALYZING");
  const [agendaNotice, setAgendaNotice] = useState("");
  const [generatingAgenda, setGeneratingAgenda] = useState(false);

  if (!meeting) {
    return (
      <Card>
        <CardTitle>会議が見つかりません</CardTitle>
        <CardDescription className="mt-2">
          URLが無効です。プロジェクト一覧から選択してください。
        </CardDescription>
        <Button asChild className="mt-4 w-fit">
          <Link href={ROUTES.projects}>プロジェクト一覧へ</Link>
        </Button>
      </Card>
    );
  }

  const decisions = getProjectDecisions(projectId).filter((decision) =>
    meeting.extractedDecisionIds.includes(decision.decisionId),
  );
  const actions = getProjectActions(projectId).filter((action) =>
    meeting.extractedDecisionIds.includes(action.decisionId),
  );

  const isAnalyzing = status === "ANALYZING";
  const readyDecisions = decisions.filter((decision) => decision.status === "READY_TO_DECIDE");
  const needsInfoDecisions = decisions.filter((decision) => decision.status === "NEEDS_INFO");
  const reopenDecisions = decisions.filter((decision) => decision.status === "REOPEN");

  function generateAgendaDraft() {
    setGeneratingAgenda(true);
    setAgendaNotice("");
    setTimeout(() => {
      setGeneratingAgenda(false);
      setAgendaNotice("この会議に紐づく決裁とアクションから、アジェンダ素案を更新しました。");
    }, 300);
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12">
        <BackButton label="一覧へ戻る" />
      </div>
      <Card className="col-span-12 flex items-start justify-between">
        <div>
          <CardTitle>{meeting.title}</CardTitle>
          <CardDescription>
            {meeting.heldAt.slice(0, 16).replace("T", " ")} / {meeting.participants.join("、")}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip status={status} />
          {status === "FAILED" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("ANALYZING")}
            >
              再解析
            </Button>
          ) : null}
        </div>
      </Card>

      {status === "FAILED" ? (
        <Card className="col-span-12 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">
            解析に失敗しました。再解析ボタンで再試行してください。
          </p>
        </Card>
      ) : null}

      <Card className="col-span-8">
        <CardTitle>抽出された決裁</CardTitle>
        {isAnalyzing ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-[88px] animate-pulse rounded-[10px] bg-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {decisions.map((decision) => (
              <div
                key={decision.decisionId}
                className="flex items-center justify-between rounded-[10px] border border-neutral-200 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{decision.title}</p>
                  <p className="text-xs text-neutral-600">{decision.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={decision.status} />
                  <span
                    className={
                      decision.owner
                        ? "text-xs text-neutral-600"
                        : "rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700"
                    }
                  >
                    {decision.owner || "決裁者未設定"}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={ROUTES.decisionDetail(projectId, decision.decisionId)}>詳細</Link>
                  </Button>
                  {decision.status === "NEEDS_INFO" ? (
                    <>
                      <OpenRightPanelButton label="質問を見る" tab="chat" size="sm" />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={ROUTES.chat(projectId, decision.decisionId)}>Q&Aへ</Link>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="col-span-4">
        <CardTitle>エージェントログ</CardTitle>
        <div className="mt-4 space-y-2">
          {agentLogs.map((line) => (
            <p key={line} className="rounded-[10px] bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
              {line}
            </p>
          ))}
        </div>
        <div className="mt-4">
          <OpenRightPanelButton label="ログを見る" tab="log" />
        </div>
      </Card>

      <Card id="agenda" className="col-span-12">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>会議アジェンダ素案（会議に紐づく決裁・アクション）</CardTitle>
            <CardDescription className="mt-1">
              この会議で扱う決裁と、その決裁に紐づくアクション進捗をもとに素案を表示します。
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateAgendaDraft} disabled={generatingAgenda}>
              {generatingAgenda ? "生成中..." : "素案を再生成"}
            </Button>
            <Button onClick={() => setAgendaNotice("会議アジェンダ素案を保存しました（モック）。")}>
              保存
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-5 rounded-[10px] border border-neutral-200 p-3">
            <p className="text-sm font-semibold text-neutral-900">この会議で決める（READY）</p>
            <div className="mt-2 space-y-2">
              {readyDecisions.length === 0 ? (
                <p className="text-xs text-neutral-500">READY_TO_DECIDE の決裁はありません。</p>
              ) : (
                readyDecisions.map((decision) => (
                  <div key={decision.decisionId} className="rounded-[8px] bg-neutral-50 px-3 py-2">
                    <p className="text-sm font-medium">{decision.title}</p>
                    <p className="mt-1 text-xs text-neutral-600">
                      決裁者: {decision.owner || "未設定"} / 期限:{" "}
                      {decision.dueAt ? decision.dueAt.slice(5, 10) : "未設定"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="col-span-4 rounded-[10px] border border-neutral-200 p-3">
            <p className="text-sm font-semibold text-neutral-900">材料を揃える（NEEDS_INFO）</p>
            <div className="mt-2 space-y-2">
              {needsInfoDecisions.length === 0 ? (
                <p className="text-xs text-neutral-500">不足情報のある決裁はありません。</p>
              ) : (
                needsInfoDecisions.map((decision) => {
                  const relatedActions = actions.filter((action) => action.decisionId === decision.decisionId);
                  return (
                    <div key={decision.decisionId} className="rounded-[8px] bg-neutral-50 px-3 py-2">
                      <p className="text-sm font-medium">{decision.title}</p>
                      {relatedActions.length === 0 ? (
                        <p className="mt-1 text-xs text-neutral-600">関連アクション: なし</p>
                      ) : (
                        <p className="mt-1 text-xs text-neutral-600">
                          関連アクション:{" "}
                          {relatedActions
                            .slice(0, 2)
                            .map((action) => `${action.title} (${action.status})`)
                            .join(" / ")}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="col-span-3 rounded-[10px] border border-neutral-200 p-3">
            <p className="text-sm font-semibold text-neutral-900">再審・注意（REOPEN）</p>
            <div className="mt-2 space-y-2">
              {reopenDecisions.length === 0 ? (
                <p className="text-xs text-neutral-500">再審対象はありません。</p>
              ) : (
                reopenDecisions.map((decision) => (
                  <div key={decision.decisionId} className="rounded-[8px] bg-neutral-50 px-3 py-2">
                    <p className="text-sm font-medium">{decision.title}</p>
                    <p className="mt-1 text-xs text-neutral-600">前提変化を確認して再判定します。</p>
                  </div>
                ))
              )}
              <div className="rounded-[8px] border border-dashed border-neutral-300 px-3 py-2">
                <p className="text-xs text-neutral-600">
                  アクション進捗: 完了 {actions.filter((action) => action.status === "DONE").length} / 全{" "}
                  {actions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {agendaNotice ? (
          <p className="mt-4 rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {agendaNotice}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
