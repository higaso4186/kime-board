"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OpenRightPanelButton } from "@/components/layout/open-right-panel-button";
import { StatusChip } from "@/components/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getDecision,
  getDecisionActions,
  getDecisionQuestions,
  getMissingFieldLabel,
  getProjectDecisions,
  type Action,
  type ActionStatus,
  type Decision,
  type DecisionStatus,
} from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

const decisionStatuses: DecisionStatus[] = [
  "NEEDS_INFO",
  "READY_TO_DECIDE",
  "DECIDED",
  "REOPEN",
];
const actionStatuses: ActionStatus[] = ["TODO", "DOING", "DONE", "BLOCKED"];
type OptionSelectMode = "SINGLE" | "HYBRID";
type DecisionOption = { id: string; label: string };

export default function DecisionDetailPage() {
  const params = useParams<{ projectId: string; decisionId: string }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const decisionId = Array.isArray(params.decisionId)
    ? params.decisionId[0]
    : params.decisionId;

  const baseDecision = getDecision(projectId, decisionId);
  const fallbackDecision = getProjectDecisions(projectId)[0];
  const decision: Decision | null = baseDecision ?? fallbackDecision ?? null;

  const [title, setTitle] = useState(decision?.title ?? "");
  const [tag, setTag] = useState(decision?.tag ?? "");
  const [status, setStatus] = useState<DecisionStatus>(decision?.status ?? "NEEDS_INFO");
  const [owner, setOwner] = useState(decision?.owner ?? "");
  const [dueAt, setDueAt] = useState(
    decision?.dueAt ? decision.dueAt.slice(0, 16) : "",
  );
  const [optionMode, setOptionMode] = useState<OptionSelectMode>("SINGLE");
  const [options, setOptions] = useState<DecisionOption[]>([
    { id: "opt_01", label: "全社共通の標準テンプレートへ統一" },
    { id: "opt_02", label: "部門ごとに2テンプレートを維持" },
    { id: "opt_03", label: "現行のまま運用を継続" },
  ]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(["opt_01"]);
  const [decisionConclusion, setDecisionConclusion] = useState(
    "採用理由と、複合案の場合の適用条件を記載します。",
  );
  const [prosCons, setProsCons] = useState(
    "賛成: 入力揺れ削減 / 反対: 例外対応コスト増 / 条件: 2週間の試験運用",
  );
  const [assumptions, setAssumptions] = useState(
    "営業部のテンプレート運用ルールが週次で共有されること。",
  );
  const [reopenTrigger, setReopenTrigger] = useState(
    "商談登録率が導入前比で5%以上低下した場合。",
  );
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"Prep" | "Exec">("Prep");

  const [actions, setActions] = useState<Action[]>(() =>
    decision ? getDecisionActions(projectId, decision.decisionId) : [],
  );

  const openQuestions = getDecisionQuestions(projectId, decision?.decisionId ?? "").filter(
    (question) => question.status === "OPEN",
  );

  const actionList = useMemo(
    () => actions.filter((item) => item.type === activeTab),
    [actions, activeTab],
  );

  const canDecide = status === "READY_TO_DECIDE";
  const hasSelectedOption = selectedOptionIds.length > 0;
  const selectedOptionLabels = options
    .filter((option) => selectedOptionIds.includes(option.id))
    .map((option) => option.label);

  function updateActionStatus(actionId: string, nextStatus: ActionStatus) {
    setActions((prev) =>
      prev.map((action) =>
        action.actionId === actionId ? { ...action, status: nextStatus } : action,
      ),
    );
  }

  function toggleOption(optionId: string) {
    if (optionMode === "SINGLE") {
      setSelectedOptionIds([optionId]);
      return;
    }

    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((item) => item !== optionId)
        : [...prev, optionId],
    );
  }

  function addOption() {
    const nextId = `opt_${String(options.length + 1).padStart(2, "0")}`;
    setOptions((prev) => [...prev, { id: nextId, label: "新しい選択肢" }]);
  }

  function addAction(type: "Prep" | "Exec") {
    if (!decision) return;
    const nextNumber = actions.length + 1;
    setActions((prev) => [
      ...prev,
      {
        actionId: `act_local_${nextNumber}`,
        decisionId: decision.decisionId,
        projectId,
        title: `${type}アクション ${nextNumber}`,
        type,
        status: "TODO",
      },
    ]);
    setNotice(`${type} アクションを追加しました`);
  }

  if (!decision) {
    return (
      <Card>
        <CardTitle>決裁が見つかりません</CardTitle>
        <p className="mt-2 text-sm text-neutral-600">
          URLが無効です。プロジェクト一覧から選択してください。
        </p>
        <Button asChild className="mt-4 w-fit">
          <Link href={ROUTES.projects}>プロジェクト一覧へ</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton label="一覧へ戻る" />
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 text-base font-semibold"
            />
            <div className="grid grid-cols-4 gap-2">
              <Input value={tag} onChange={(event) => setTag(event.target.value)} />
              <Select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as DecisionStatus);
                  setNotice("状態を更新しました");
                }}
                controlSize="md"
              >
                {decisionStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Input
                value={owner}
                placeholder="決裁者"
                className={owner ? "" : "border-amber-300 bg-amber-50"}
                onChange={(event) => setOwner(event.target.value)}
              />
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge>{tag}</Badge>
              <StatusChip status={status} />
              <Badge>決裁者: {owner || "未設定"}</Badge>
              <Badge>不足質問: {openQuestions.length}件</Badge>
              <Badge>
                採用案:{" "}
                {selectedOptionLabels.length
                  ? `${optionMode === "HYBRID" ? "複合" : "単一"} / ${selectedOptionLabels.length}件`
                  : "未設定"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() =>
                setNotice(`「${title}」の編集内容を保存しました`)
              }
            >
              保存
            </Button>
            <Button
              variant="secondary"
              disabled={!canDecide || !hasSelectedOption}
              onClick={() => {
                setStatus("DECIDED");
                setNotice("決裁を確定しました");
              }}
            >
              確定
            </Button>
              <Button variant="outline" asChild>
              <Link href={ROUTES.chat(projectId, decision.decisionId)}>不足質問を開く</Link>
              </Button>
          </div>
        </div>
        {notice ? (
          <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {notice}
          </p>
        ) : null}
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-4">
          <Card>
            <CardTitle>選択肢（Options）</CardTitle>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant={optionMode === "SINGLE" ? "secondary" : "ghost"}
                onClick={() => {
                  setOptionMode("SINGLE");
                  setSelectedOptionIds((prev) => (prev[0] ? [prev[0]] : []));
                }}
              >
                単一案
              </Button>
              <Button
                size="sm"
                variant={optionMode === "HYBRID" ? "secondary" : "ghost"}
                onClick={() => setOptionMode("HYBRID")}
              >
                複合案
              </Button>
              <p className="text-xs text-neutral-500">
                {optionMode === "SINGLE"
                  ? "1つの選択肢を採用します"
                  : "複数の選択肢を組み合わせて採用します"}
              </p>
            </div>
            <div className="mt-3 space-y-2">
              {options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-center gap-2 rounded-[10px] border border-neutral-200 px-2 py-2"
                >
                  <input
                    type={optionMode === "SINGLE" ? "radio" : "checkbox"}
                    name="decision-option"
                    checked={selectedOptionIds.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                  />
                  <Input
                    value={option.label}
                    onChange={(event) =>
                      setOptions((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, label: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  {selectedOptionIds.includes(option.id) ? <Badge>採用</Badge> : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOptions((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                      setSelectedOptionIds((prev) =>
                        prev.filter((selectedId) => selectedId !== option.id),
                      );
                    }}
                  >
                    削除
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                選択肢を追加
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>決定結果（採用オプション）</CardTitle>
            <p className="mt-2 text-xs text-neutral-600">
              {selectedOptionLabels.length
                ? optionMode === "HYBRID"
                  ? `複合案: ${selectedOptionLabels.join(" + ")}`
                  : `採用案: ${selectedOptionLabels[0]}`
                : "採用案が未設定です。上の Options から選択してください。"}
            </p>
            <Textarea
              className="mt-3"
              value={decisionConclusion}
              onChange={(event) => setDecisionConclusion(event.target.value)}
            />
          </Card>

          <Card>
            <CardTitle>根拠（賛成/反対/条件）</CardTitle>
            <Textarea className="mt-3" value={prosCons} onChange={(event) => setProsCons(event.target.value)} />
          </Card>

          <Card>
            <CardTitle>前提（Assumptions）</CardTitle>
            <Textarea className="mt-3" value={assumptions} onChange={(event) => setAssumptions(event.target.value)} />
          </Card>

          <Card>
            <CardTitle>反証条件（Reopen Trigger）</CardTitle>
            <Textarea className="mt-3" value={reopenTrigger} onChange={(event) => setReopenTrigger(event.target.value)} />
          </Card>
        </div>

        <Card className="col-span-4 space-y-3">
          <CardTitle>アクション</CardTitle>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeTab === "Prep" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("Prep")}
            >
              Prep（決裁前）
            </Button>
            <Button
              size="sm"
              variant={activeTab === "Exec" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("Exec")}
            >
              Exec（決裁後）
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-[10px] border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs">
              <p>紐づくアクション数: {actions.length}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => addAction("Prep")}>
                  Prep追加
                </Button>
                <Button variant="outline" size="sm" onClick={() => addAction("Exec")}>
                  Exec追加
                </Button>
              </div>
            </div>
            {actionList.map((action) => (
              <div key={action.actionId} className="rounded-[10px] border border-neutral-200 p-2">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-neutral-500">
                  担当: {action.assignee || "未設定"} / 期限: {action.dueAt?.slice(0, 10) || "未設定"}
                </p>
                <Select
                  value={action.status}
                  onChange={(event) =>
                    updateActionStatus(action.actionId, event.target.value as ActionStatus)
                  }
                  controlSize="sm"
                  className="mt-2"
                >
                  {actionStatuses.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>

          <div className="rounded-[10px] border border-neutral-200 p-3 text-xs">
            <p className="font-medium">不足質問（OPEN）</p>
            <div className="mt-2 space-y-1">
              {openQuestions.slice(0, 3).map((question) => (
                <p key={question.questionId} className="text-neutral-600">
                  {question.title} / {question.missingFields.map(getMissingFieldLabel).join("/")}
                </p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setNotice("アクション素案を生成しました");
              }}
            >
              素案生成（Skill）
            </Button>
            <OpenRightPanelButton label="質問を見る" tab="chat" className="w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}
