"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { Textarea } from "@/components/ui/textarea";
import { StatusChip } from "@/components/status-chip";
import { decisionStatusLabels } from "@/lib/mock/data";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { ROUTES } from "@/lib/routes";

type AgendaSectionKey = "ready" | "needs" | "review";

export default function MeetingDetailPage() {
  const params = useParams<{ projectId: string; meetingId: string }>();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const meetingId = Array.isArray(params.meetingId) ? params.meetingId[0] : params.meetingId;
  const { snapshot, loading, error } = useDemoProjectSnapshot(projectId);

  const meeting = snapshot?.meetings.find((item) => item.meetingId === meetingId) ?? null;
  const [agendaNotice, setAgendaNotice] = useState("");
  const [meetingMemo, setMeetingMemo] = useState("");
  const [memoNotice, setMemoNotice] = useState("");
  const [sendingMemo, setSendingMemo] = useState(false);
  const [refreshingAgenda, setRefreshingAgenda] = useState(false);
  const [showCloseFlow, setShowCloseFlow] = useState(false);
  const [sectionOpen, setSectionOpen] = useState<Record<AgendaSectionKey, boolean>>({
    ready: true,
    needs: true,
    review: true,
  });
  const closeMemoRef = useRef<HTMLDivElement | null>(null);

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

  const decisions = (snapshot?.decisions ?? []).filter((decision) =>
    meeting.extractedDecisionIds.includes(decision.decisionId),
  );
  const actions = (snapshot?.actions ?? []).filter((action) =>
    meeting.extractedDecisionIds.includes(action.decisionId),
  );
  const readyDecisions = decisions.filter((decision) => decision.status === "READY_TO_DECIDE");
  const needsInfoDecisions = decisions.filter((decision) => decision.status === "NEEDS_INFO");
  const reviewDecisions = decisions.filter(
    (decision) => decision.status === "REOPEN" || decision.status === "DECIDED",
  );

  function refreshAgenda() {
    setRefreshingAgenda(true);
    setAgendaNotice("");
    setTimeout(() => {
      setRefreshingAgenda(false);
      setAgendaNotice("AIが決裁粒度と選択肢を再整理し、会議アジェンダを更新しました。");
    }, 350);
  }

  function startCloseMeetingFlow() {
    setShowCloseFlow(true);
    setMemoNotice("会議を終了するには、議事録を貼り付けて送信してください。");
    setTimeout(() => {
      closeMemoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("meeting-close-memo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function toggleSection(key: AgendaSectionKey) {
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function submitMeetingMemo() {
    if (!meetingMemo.trim()) {
      setMemoNotice("議事録を貼り付けてから送信してください。");
      return;
    }

    setSendingMemo(true);
    setMemoNotice("");
    setTimeout(() => {
      setSendingMemo(false);
      setMemoNotice("議事録を送信しました。次の決裁候補とアクション候補の抽出を更新しました。");
    }, 700);
  }

  function renderDecisionAgendaItem(decision: (typeof decisions)[number]) {
    const relatedActions = actions.filter((action) => action.decisionId === decision.decisionId);
    const doneActionCount = relatedActions.filter((action) => action.status === "DONE").length;

    return (
      <div key={decision.decisionId} className="rounded-[10px] border border-neutral-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-neutral-900">{decision.title}</p>
          <div className="flex items-center gap-2">
            <StatusChip status={decision.status} />
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.decisionDetail(projectId, decision.decisionId)}>詳細を見る</Link>
            </Button>
          </div>
        </div>
        <p className="mt-1 text-xs text-neutral-600">{decision.summary}</p>
        <p className="mt-1 text-xs text-neutral-600">
          決裁者: {decision.owner || "未設定"} / 期限:{" "}
          {decision.dueAt ? decision.dueAt.slice(0, 16).replace("T", " ") : "未設定"}
        </p>

        <div className="mt-2 rounded-[8px] bg-neutral-50 p-2">
          <p className="text-xs font-medium text-neutral-700">選択肢（メリット / デメリット / 備考）</p>
          {(decision.options ?? []).length === 0 ? (
            <p className="mt-1 text-xs text-neutral-500">選択肢は決裁詳細で未入力です。</p>
          ) : (
            <div className="mt-2 space-y-2">
              {decision.options?.map((option) => (
                <div key={option.id} className="rounded-[8px] border border-neutral-200 bg-white p-2">
                  <p className="text-xs font-semibold text-neutral-800">{option.label}</p>
                  <p className="text-xs text-neutral-600">メリット: {option.merit || "未入力"}</p>
                  <p className="text-xs text-neutral-600">デメリット: {option.demerit || "未入力"}</p>
                  <p className="text-xs text-neutral-600">備考: {option.note || "未入力"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 rounded-[8px] border border-dashed border-neutral-300 px-2 py-1">
          <p className="text-xs text-neutral-600">
            関連アクション進捗: 完了 {doneActionCount} / 全 {relatedActions.length}
          </p>
        </div>
      </div>
    );
  }

  function renderAgendaSection(
    key: AgendaSectionKey,
    title: string,
    items: typeof decisions,
    emptyMessage: string,
  ) {
    const isOpen = sectionOpen[key];
    return (
      <div className="rounded-[10px] border border-neutral-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-neutral-900">
            {title} ({items.length}件)
          </p>
          <Button variant="ghost" size="sm" onClick={() => toggleSection(key)}>
            {isOpen ? "閉じる" : "開く"}
          </Button>
        </div>
        {isOpen ? (
          <div className="mt-2 space-y-2">
            {items.length === 0 ? (
              <p className="rounded-[8px] bg-neutral-50 px-3 py-2 text-xs text-neutral-500">{emptyMessage}</p>
            ) : (
              items.map((decision) => renderDecisionAgendaItem(decision))
            )}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackButton label="一覧へ戻る" />

      <Card className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{meeting.title}</CardTitle>
          <CardDescription>
            {meeting.heldAt.slice(0, 16).replace("T", " ")} / {meeting.participants.join("、")}
          </CardDescription>
          <p className="mt-2 text-xs text-neutral-600">
            会議の冒頭で本画面を投影し、決裁候補と選択肢の全体像を確認する前提です。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAgenda} disabled={refreshingAgenda}>
            {refreshingAgenda ? "更新中..." : "アジェンダを更新"}
          </Button>
          <Button variant="secondary" size="sm" onClick={startCloseMeetingFlow}>
            会議を終了
          </Button>
        </div>
      </Card>

      <Card id="agenda">
        <CardTitle>会議アジェンダ</CardTitle>
        <CardDescription className="mt-1">
          会議対象の決裁と選択肢を全件表示します。概要をこの画面で確認し、必要時のみ詳細へ遷移します。
        </CardDescription>
        <div className="mt-3 space-y-3">
          {renderAgendaSection(
            "ready",
            `この会議で決める（${decisionStatusLabels.READY_TO_DECIDE}）`,
            readyDecisions,
            "決裁可能の決裁はありません。",
          )}
          {renderAgendaSection(
            "needs",
            `材料を揃える（${decisionStatusLabels.NEEDS_INFO}）`,
            needsInfoDecisions,
            "情報不足の決裁はありません。",
          )}
          {renderAgendaSection(
            "review",
            `再審・注意（${decisionStatusLabels.REOPEN} / ${decisionStatusLabels.DECIDED}）`,
            reviewDecisions,
            "再審・注意対象の決裁はありません。",
          )}
        </div>
        {agendaNotice ? (
          <p className="mt-4 rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {agendaNotice}
          </p>
        ) : null}
      </Card>

      <div id="meeting-close-memo" ref={closeMemoRef}>
        <Card className="space-y-3">
        <CardTitle>会議終了後の議事録送信</CardTitle>
        <CardDescription>
          会議終了ボタンを押したあと、この欄で議事録を送信して次の決裁・アクション候補を抽出します。
        </CardDescription>
        {!showCloseFlow ? (
          <p className="rounded-[10px] bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            まだ会議終了フローは開始していません。右上の「会議を終了」を押してください。
          </p>
        ) : (
          <>
            <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              議事録を貼り付けて送信してください。
            </p>
            <Textarea
              value={meetingMemo}
              onChange={(event) => setMeetingMemo(event.target.value)}
              className="min-h-[220px] bg-neutral-50"
              placeholder="会議で決まった内容、保留事項、次のアクションを貼り付けてください"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setMeetingMemo("")}>
                クリア
              </Button>
              <Button onClick={submitMeetingMemo} disabled={sendingMemo}>
                {sendingMemo ? "送信中..." : "議事録を送信"}
              </Button>
            </div>
          </>
        )}
        {memoNotice ? (
          <p className="rounded-[10px] bg-green-50 px-3 py-2 text-xs text-green-700">{memoNotice}</p>
        ) : null}
        </Card>
      </div>
    </div>
  );
}
