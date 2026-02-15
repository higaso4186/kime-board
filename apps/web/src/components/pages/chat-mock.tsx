"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { BackButton } from "@/components/ui/back-button";
import {
  createDecisionThread,
  postThreadMessage,
} from "@/lib/api/demo";
import {
  getMissingFieldLabel as getMissingFieldLabelFromData,
  decisionStatusLabels,
  type Decision as DecisionFromData,
} from "@/lib/mock/data";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { useAuth } from "@/contexts/auth-context";
import { SimpleChatUI } from "@/components/chat/simple-chat-ui";
import { ROUTES } from "@/lib/routes";

export function ChatMock({
  projectId,
  decisionId,
}: {
  projectId: string;
  decisionId?: string;
}) {
  const router = useRouter();
  const { snapshot, loading, error, refresh } = useDemoProjectSnapshot(projectId);
  const { getIdToken } = useAuth();
  const decisionData = snapshot?.decisions.find((item) => item.decisionId === decisionId);
  const fallbackDecision = snapshot?.decisions[0];
  const targetDecision: DecisionFromData | null = decisionData ?? fallbackDecision ?? null;

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [notice, setNotice] = useState("");

  const openQuestions = useMemo(
    () =>
      snapshot && targetDecision
        ? snapshot.insufficientQuestions.filter(
            (q) =>
              q.decisionId === targetDecision.decisionId && q.status === "OPEN",
          )
        : [],
    [snapshot, targetDecision],
  );

  const messages = useMemo(
    () =>
      snapshot && targetDecision
        ? snapshot.chatMessages.filter(
            (m) => m.decisionId === targetDecision.decisionId,
          )
        : [],
    [snapshot, targetDecision],
  );

  const readiness = Math.max(35, 100 - openQuestions.length * 18);

  async function handleSend(text: string) {
    if (!targetDecision) return;

    try {
      setNotice("");
      const { threadId } = await createDecisionThread(
        projectId,
        targetDecision.decisionId,
        getIdToken,
      );

      const activeQuestion = openQuestions.find(
        (q) => q.questionId === selectedQuestionId,
      );

      if (activeQuestion) {
        await postThreadMessage(
          threadId,
          {
            senderType: "USER",
            format: "ANSWER_SET",
            content: text,
            metadata: { questionId: activeQuestion.questionId },
            relatesTo: {
              projectId,
              decisionId: targetDecision.decisionId,
              actionId: activeQuestion.actionId,
            },
          },
          getIdToken,
        );
      } else {
        await postThreadMessage(
          threadId,
          {
            senderType: "USER",
            format: "TEXT",
            content: text,
            relatesTo: {
              projectId,
              decisionId: targetDecision.decisionId,
            },
          },
          getIdToken,
        );
      }

      await refresh();
    } catch (e) {
      setNotice(
        e instanceof Error ? `送信に失敗しました: ${e.message}` : "送信に失敗しました",
      );
    }
  }

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

  if (!targetDecision) {
    return (
      <Card>
        <CardTitle>対象決裁が見つかりません</CardTitle>
        <p className="mt-2 text-sm text-neutral-600">
          URLが無効です。プロジェクト一覧から選択してください。
        </p>
        <Button className="mt-4 w-fit" onClick={() => router.push(ROUTES.projects)}>
          プロジェクト一覧へ
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12">
        <BackButton label="戻る" />
      </div>
      <Card className="col-span-8 flex h-[560px] flex-col">
        <CardTitle>チャット</CardTitle>
        <p className="mt-1 text-xs text-neutral-500">
          対象: {targetDecision.title} / OPEN {openQuestions.length}件
        </p>
        {notice ? (
          <p className="mt-2 text-xs text-red-700">{notice}</p>
        ) : null}

        {openQuestions.length > 0 ? (
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-neutral-600">回答先:</label>
            <Select
              className="max-w-[320px]"
              value={selectedQuestionId || openQuestions[0]?.questionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
            >
              {openQuestions.map((q) => (
                <option key={q.questionId} value={q.questionId}>
                  {q.title}
                </option>
              ))}
              <option value="">自由メモ</option>
            </Select>
          </div>
        ) : null}

        <div className="mt-3 flex-1">
          <SimpleChatUI
            messages={messages}
            onSend={handleSend}
            placeholder={
              openQuestions.length > 0 ? "回答を入力" : "メッセージを入力"
            }
          />
        </div>
      </Card>

      <Card className="col-span-4 space-y-3">
        <CardTitle>決裁プレビュー</CardTitle>
        <p className="text-xs text-neutral-600">対象: {targetDecision.decisionId}</p>
        <div>
          <p className="mb-1 text-xs text-neutral-600">埋まり具合 {readiness}%</p>
          <div className="h-2 w-full rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${readiness}%` }}
            />
          </div>
        </div>
        <div className="space-y-2">
          {openQuestions.length === 0 ? (
            <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              {decisionStatusLabels.READY_TO_DECIDE} になりました
            </p>
          ) : (
            openQuestions.slice(0, 3).map((q) => (
              <div
                key={q.questionId}
                className="rounded-[10px] border border-neutral-200 px-3 py-2 text-xs"
              >
                <p className="font-medium">{q.title}</p>
                <p className="mt-1 text-neutral-600">
                  不足: {q.missingFields.map(getMissingFieldLabelFromData).join(" / ")}
                </p>
              </div>
            ))
          )}
        </div>
        <Button
          onClick={() => {
            setNotice("回答を取り込み、決裁詳細へ反映しました");
            router.push(ROUTES.decisionDetail(projectId, targetDecision.decisionId));
          }}
        >
          回答を反映して決裁へ
        </Button>
      </Card>
    </div>
  );
}
