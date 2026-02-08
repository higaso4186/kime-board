"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import {
  getChatMessages,
  getDecision,
  getDecisionActions,
  getDecisionQuestions,
  getMissingFieldLabel,
  getProjectDecisions,
  getQuestionTargetPath,
  type ChatMessage,
  type Decision,
  type InsufficientQuestion,
  type MissingFieldKey,
  type QuestionTargetType,
} from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

type ComposerMode = "answer" | "question";

const missingFieldOptions: MissingFieldKey[] = [
  "owner",
  "dueAt",
  "criteria",
  "options",
  "assignee",
  "definitionOfDone",
  "blockedReason",
];

export function ChatMock({
  projectId,
  decisionId,
}: {
  projectId: string;
  decisionId: string;
}) {
  const router = useRouter();
  const decisionData = getDecision(projectId, decisionId);
  const fallbackDecision = getProjectDecisions(projectId)[0];
  const targetDecision: Decision | null = decisionData ?? fallbackDecision ?? null;

  const decisionActions = getDecisionActions(projectId, targetDecision?.decisionId ?? "");

  const [questions, setQuestions] = useState<InsufficientQuestion[]>(() =>
    targetDecision ? getDecisionQuestions(projectId, targetDecision.decisionId) : [],
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    targetDecision ? getChatMessages(projectId, targetDecision.decisionId) : [],
  );

  const [text, setText] = useState("");
  const [mode, setMode] = useState<ComposerMode>("answer");
  const [targetType, setTargetType] = useState<QuestionTargetType>("DECISION");
  const [targetActionId, setTargetActionId] = useState(decisionActions[0]?.actionId ?? "");
  const [missingField, setMissingField] = useState<MissingFieldKey>("owner");
  const [typing, setTyping] = useState(false);
  const [notice, setNotice] = useState("");

  const openQuestions = useMemo(
    () => questions.filter((question) => question.status === "OPEN"),
    [questions],
  );

  const [selectedQuestionId, setSelectedQuestionId] = useState(
    openQuestions[0]?.questionId ?? "",
  );

  const activeQuestionId = useMemo(() => {
    if (mode !== "answer") return selectedQuestionId;
    if (openQuestions.length === 0) return "";
    const exists = openQuestions.some(
      (question) => question.questionId === selectedQuestionId,
    );
    return exists ? selectedQuestionId : openQuestions[0].questionId;
  }, [mode, openQuestions, selectedQuestionId]);

  const questionMap = useMemo(
    () => new Map(questions.map((question) => [question.questionId, question])),
    [questions],
  );

  const readiness = Math.max(35, 100 - openQuestions.length * 18);

  function appendMessage(payload: Omit<ChatMessage, "messageId" | "threadId" | "createdAt">) {
    if (!targetDecision) return;
    setMessages((prev) => [
      ...prev,
      {
        messageId: `msg_${prev.length + 1}`,
        threadId: `thr_${projectId}_${targetDecision.decisionId}`,
        createdAt: new Date().toISOString(),
        ...payload,
      },
    ]);
  }

  function submit() {
    if (!targetDecision) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    if (mode === "answer") {
      if (!activeQuestionId) return;
      const targetQuestion = questionMap.get(activeQuestionId);
      if (!targetQuestion) return;

      appendMessage({
        projectId,
        decisionId: targetDecision.decisionId,
        actionId: targetQuestion.actionId,
        questionId: targetQuestion.questionId,
        sender: "user",
        kind: "ANSWER",
        text: trimmed,
      });

      setQuestions((prev) =>
        prev.map((question) =>
          question.questionId === targetQuestion.questionId
            ? {
                ...question,
                status: "ANSWERED",
                resolvedAt: new Date().toISOString(),
              }
            : question,
        ),
      );

      setTyping(true);
      setTimeout(() => setTyping(false), 800);
    } else {
      const questionId = `qst_${questions.length + 1}`;
      const actionId = targetType === "ACTION" ? targetActionId : undefined;

      const newQuestion: InsufficientQuestion = {
        questionId,
        projectId,
        decisionId: targetDecision.decisionId,
        actionId,
        targetType,
        source: "user",
        title: `ユーザー起点: ${getMissingFieldLabel(missingField)}の確認`,
        prompt: trimmed,
        missingFields: [missingField],
        priority: "MEDIUM",
        status: "OPEN",
        createdAt: new Date().toISOString(),
      };

      setQuestions((prev) => [...prev, newQuestion]);

      appendMessage({
        projectId,
        decisionId: targetDecision.decisionId,
        actionId,
        questionId,
        sender: "user",
        kind: "QUESTION",
        text: trimmed,
      });

      setSelectedQuestionId(questionId);
    }

    setText("");
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
      <Card className="col-span-8 flex h-[680px] flex-col">
        <CardTitle>エージェントチャット</CardTitle>
        <p className="mt-1 text-xs text-neutral-500">
          対象: {targetDecision.title} / OPEN {openQuestions.length}件
        </p>

        <div className="mt-4 flex-1 space-y-3 overflow-auto rounded-[10px] bg-neutral-50 p-3">
          {messages.map((message) => {
            const linkedQuestion = message.questionId
              ? questionMap.get(message.questionId)
              : undefined;
            const aligned = message.sender === "agent" ? "text-left" : "text-right";

            return (
              <div key={message.messageId} className={aligned}>
                <div
                  className={
                    message.sender === "agent"
                      ? "inline-block max-w-[85%] rounded-[10px] bg-white px-3 py-2 text-left text-sm"
                      : "inline-block max-w-[85%] rounded-[10px] bg-blue-600 px-3 py-2 text-left text-sm text-white"
                  }
                >
                  <p className="text-[11px] opacity-80">
                    {message.sender === "agent" ? "AI" : "USER"} / {message.kind}
                  </p>
                  {linkedQuestion ? (
                    <p className="text-[11px] opacity-80">
                      {getQuestionTargetPath(linkedQuestion)}
                    </p>
                  ) : null}
                  <p className="mt-1">{message.text}</p>
                  {linkedQuestion ? (
                    <p className="mt-1 text-[11px] opacity-80">
                      不足: {linkedQuestion.missingFields.map(getMissingFieldLabel).join(" / ")}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
          {typing ? <p className="text-xs text-neutral-500">AI が回答を統合中...</p> : null}
        </div>

        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-12 gap-2">
            <Select
              className="col-span-2"
              value={mode}
              onChange={(event) => setMode(event.target.value as ComposerMode)}
            >
              <option value="answer">回答を送信</option>
              <option value="question">不足質問を追加</option>
            </Select>

            {mode === "answer" ? (
              <Select
                className="col-span-4"
                value={activeQuestionId}
                onChange={(event) => setSelectedQuestionId(event.target.value)}
              >
                {openQuestions.length === 0 ? (
                  <option value="">OPEN質問なし</option>
                ) : (
                  openQuestions.map((question) => (
                    <option key={question.questionId} value={question.questionId}>
                      {question.title}
                    </option>
                  ))
                )}
              </Select>
            ) : (
              <>
                <Select
                  className="col-span-2"
                  value={targetType}
                  onChange={(event) =>
                    setTargetType(event.target.value as QuestionTargetType)
                  }
                >
                  <option value="DECISION">決裁</option>
                  <option value="ACTION">アクション</option>
                </Select>
                <Select
                  className="col-span-2"
                  value={targetActionId}
                  disabled={targetType !== "ACTION"}
                  onChange={(event) => setTargetActionId(event.target.value)}
                >
                  {decisionActions.map((action) => (
                    <option key={action.actionId} value={action.actionId}>
                      {action.title}
                    </option>
                  ))}
                </Select>
                <Select
                  className="col-span-2"
                  value={missingField}
                  onChange={(event) =>
                    setMissingField(event.target.value as MissingFieldKey)
                  }
                >
                  {missingFieldOptions.map((field) => (
                    <option key={field} value={field}>
                      {getMissingFieldLabel(field)}
                    </option>
                  ))}
                </Select>
              </>
            )}

            <Input
              className="col-span-4"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                mode === "answer"
                  ? "回答を入力"
                  : "不足している内容を具体的に入力"
              }
            />
            <Button className="col-span-1" onClick={submit}>
              送信
            </Button>
            <Button
              variant="outline"
              className="col-span-1"
              onClick={() =>
                setText("前提: 期限は2/15、判断基準は商談化率5%改善を採用")
              }
            >
              テンプレ
            </Button>
          </div>
        </div>
      </Card>

      <Card className="col-span-4 space-y-3">
        <CardTitle>決裁プレビュー</CardTitle>
        <p className="text-xs text-neutral-600">対象: {targetDecision.decisionId}</p>
        <div>
          <p className="mb-1 text-xs text-neutral-600">埋まり具合 {readiness}%</p>
          <Progress value={readiness} />
        </div>

        <div className="space-y-2 rounded-[10px] bg-neutral-50 p-3 text-xs">
          <p>{readiness >= 60 ? "✓" : "□"} Owner</p>
          <p>{readiness >= 70 ? "✓" : "□"} Due Date</p>
          <p>{readiness >= 80 ? "✓" : "□"} Criteria</p>
          <p>{readiness >= 90 ? "✓" : "□"} Options(2+)</p>
        </div>

        <div className="space-y-2">
          {openQuestions.length === 0 ? (
            <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              READY_TO_DECIDE になりました
            </p>
          ) : (
            openQuestions.slice(0, 3).map((question) => (
              <div key={question.questionId} className="rounded-[10px] border border-neutral-200 px-3 py-2 text-xs">
                <p className="font-medium">{question.title}</p>
                <p className="mt-1 text-neutral-600">{getQuestionTargetPath(question)}</p>
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
        {notice ? <p className="text-xs text-green-700">{notice}</p> : null}
      </Card>
    </div>
  );
}
