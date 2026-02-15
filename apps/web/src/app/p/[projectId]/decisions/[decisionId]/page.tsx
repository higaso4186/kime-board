"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, PencilLine } from "lucide-react";
import { useRightPanel } from "@/components/layout/project-shell";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusChip } from "@/components/status-chip";
import {
  actionStatusLabels,
  actionStatusOrder,
  decisionDetailDefaults,
  decisionStatusLabels,
  decisionStatusOrder,
  getMissingFieldLabel,
  type Action,
  type DecisionOption,
  type DecisionStatus,
} from "@/lib/mock/data";
import {
  patchDemoDecision,
} from "@/lib/api/demo";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/routes";

type OptionSelectMode = "SINGLE" | "HYBRID";
type ActionOutcome = "CLOSE_DECISION" | "NEXT_DECISION";

export default function DecisionDetailPage() {
  const params = useParams<{ projectId: string; decisionId: string }>();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const decisionId = Array.isArray(params.decisionId) ? params.decisionId[0] : params.decisionId;

  const { snapshot, loading, error, refresh } = useDemoProjectSnapshot(projectId);
  const { getIdToken } = useAuth();
  const { openChatForQuestion } = useRightPanel();
  const decision = snapshot?.decisions.find((item) => item.decisionId === decisionId) ?? null;

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [statusDraft, setStatusDraft] = useState<DecisionStatus | null>(null);
  const [ownerDraft, setOwnerDraft] = useState<string | null>(null);
  const [dueAtDraft, setDueAtDraft] = useState<string | null>(null);
  const [optionMode, setOptionMode] = useState<OptionSelectMode>("SINGLE");
  const [options, setOptions] = useState<DecisionOption[]>(
    decisionDetailDefaults.options.map((option) => ({
      ...option,
      merit: option.merit ?? "",
      demerit: option.demerit ?? "",
      note: option.note ?? "",
    })),
  );
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    decisionDetailDefaults.selectedOptionIds,
  );
  const [decisionConclusion, setDecisionConclusion] = useState(decisionDetailDefaults.conclusion);
  const [assumptions, setAssumptions] = useState(decisionDetailDefaults.assumptions);
  const [reopenTrigger, setReopenTrigger] = useState(decisionDetailDefaults.reopenTrigger);
  const [showDeepContext, setShowDeepContext] = useState(false);
  const [activeTab, setActiveTab] = useState<"Prep" | "Exec">("Prep");
  const [notice, setNotice] = useState("");
  const [actionStatusOverrides, setActionStatusOverrides] = useState<
    Record<string, (typeof actionStatusOrder)[number]>
  >({});
  const [actionOutcomeOverrides, setActionOutcomeOverrides] = useState<
    Record<string, ActionOutcome>
  >({});
  const [actionNextDecisionOverrides, setActionNextDecisionOverrides] = useState<
    Record<string, string>
  >({});
  const [actionNoteOverrides, setActionNoteOverrides] = useState<Record<string, string>>({});
  const [actionAssigneeOverrides, setActionAssigneeOverrides] = useState<Record<string, string>>({});
  const [actionDueAtOverrides, setActionDueAtOverrides] = useState<Record<string, string>>({});
  const [actionTitleOverrides, setActionTitleOverrides] = useState<Record<string, string>>({});
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [isEditingConclusion, setIsEditingConclusion] = useState(false);
  const [isEditingAssumptions, setIsEditingAssumptions] = useState(false);
  const [isEditingReopenTrigger, setIsEditingReopenTrigger] = useState(false);
  const [extraActions, setExtraActions] = useState<Action[]>([]);

  const title = titleDraft ?? decision?.title ?? "";
  const status = statusDraft ?? decision?.status ?? "NEEDS_INFO";
  const owner = ownerDraft ?? decision?.owner ?? "";
  const dueAt = dueAtDraft ?? (decision?.dueAt ? decision.dueAt.slice(0, 16) : "");

  const baseActions =
    decision && snapshot
      ? snapshot.actions.filter((item) => item.decisionId === decision.decisionId)
      : [];

  const actions = [
    ...baseActions.map((action) => ({
      ...action,
      status: actionStatusOverrides[action.actionId] ?? action.status,
    })),
    ...extraActions,
  ];

  const openQuestions = (snapshot?.insufficientQuestions ?? []).filter(
    (question) => question.decisionId === decision?.decisionId && question.status === "OPEN",
  );

  const actionList = actions.filter((item) => item.type === activeTab);

  const selectedOptionLabels = options
    .filter((option) => selectedOptionIds.includes(option.id))
    .map((option) => option.label);

  const visibleActionCount =
    activeTab === "Prep" ? actionList.length + openQuestions.length : actionList.length;
  const nextDecisionCandidates = (snapshot?.decisions ?? []).filter(
    (item) => item.decisionId !== decision?.decisionId,
  );

  function updateOption(optionId: string, patch: Partial<DecisionOption>) {
    setOptions((prev) => prev.map((option) => (option.id === optionId ? { ...option, ...patch } : option)));
  }

  function toggleOption(optionId: string) {
    if (optionMode === "SINGLE") {
      setSelectedOptionIds([optionId]);
      return;
    }
    setSelectedOptionIds((prev) =>
      prev.includes(optionId) ? prev.filter((item) => item !== optionId) : [...prev, optionId],
    );
  }

  function addOption() {
    const nextId = `opt_${String(options.length + 1).padStart(2, "0")}`;
    setOptions((prev) => [
      ...prev,
      {
        id: nextId,
        label: decisionDetailDefaults.newOptionLabel,
        merit: "",
        demerit: "",
        note: "",
      },
    ]);
    setEditingOptionId(nextId);
  }

  function updateActionStatus(actionId: string, nextStatus: (typeof actionStatusOrder)[number]) {
    setExtraActions((prev) =>
      prev.map((action) => (action.actionId === actionId ? { ...action, status: nextStatus } : action)),
    );
    setActionStatusOverrides((prev) => ({ ...prev, [actionId]: nextStatus }));
  }

  function getDefaultActionOutcome(action: Action): ActionOutcome {
    return action.supportsDecisionId ? "NEXT_DECISION" : "CLOSE_DECISION";
  }

  function getActionOutcome(action: Action): ActionOutcome {
    return actionOutcomeOverrides[action.actionId] ?? getDefaultActionOutcome(action);
  }

  function updateActionOutcome(actionId: string, outcome: ActionOutcome) {
    setActionOutcomeOverrides((prev) => ({ ...prev, [actionId]: outcome }));
  }

  function getNextDecisionId(action: Action) {
    return actionNextDecisionOverrides[action.actionId] ?? action.supportsDecisionId ?? "";
  }

  function updateActionNextDecision(actionId: string, nextDecisionId: string) {
    setActionNextDecisionOverrides((prev) => ({ ...prev, [actionId]: nextDecisionId }));
  }

  function getActionNote(action: Action) {
    return actionNoteOverrides[action.actionId] ?? action.note ?? "";
  }

  function updateActionNote(actionId: string, note: string) {
    setExtraActions((prev) =>
      prev.map((action) => (action.actionId === actionId ? { ...action, note } : action)),
    );
    setActionNoteOverrides((prev) => ({ ...prev, [actionId]: note }));
  }

  function toDatetimeLocalValue(value?: string): string {
    if (!value) return "";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const pad = (num: number) => String(num).padStart(2, "0");
      const year = parsed.getFullYear();
      const month = pad(parsed.getMonth() + 1);
      const day = pad(parsed.getDate());
      const hours = pad(parsed.getHours());
      const minutes = pad(parsed.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    if (value.includes("T")) return value.slice(0, 16);
    return "";
  }

  function formatDueAtLabel(value?: string): string {
    if (!value) return "（未設定）";
    return value.replace("T", " ").slice(0, 16);
  }

  function getActionAssignee(action: Action) {
    return actionAssigneeOverrides[action.actionId] ?? action.assignee ?? "";
  }

  function updateActionAssignee(actionId: string, assignee: string) {
    setExtraActions((prev) =>
      prev.map((action) => (action.actionId === actionId ? { ...action, assignee } : action)),
    );
    setActionAssigneeOverrides((prev) => ({ ...prev, [actionId]: assignee }));
  }

  function getActionDueAt(action: Action) {
    const override = actionDueAtOverrides[action.actionId];
    if (override !== undefined) return override;
    return toDatetimeLocalValue(action.dueAt);
  }

  function updateActionDueAt(actionId: string, dueAt: string) {
    setExtraActions((prev) =>
      prev.map((action) => (action.actionId === actionId ? { ...action, dueAt: dueAt || undefined } : action)),
    );
    setActionDueAtOverrides((prev) => ({ ...prev, [actionId]: dueAt }));
  }

  function addAction(type: "Prep" | "Exec") {
    if (!decision) return;
    const nextNumber = actions.length + 1;
    const nextActionId = `act_local_${nextNumber}`;
    setExtraActions((prev) => [
      ...prev,
      {
        actionId: nextActionId,
        decisionId: decision.decisionId,
        projectId,
        title: `${type}アクション ${nextNumber}`,
        type,
        status: "TODO",
        note: "",
      },
    ]);
    if (type === "Exec") {
      setActionOutcomeOverrides((prev) => ({
        ...prev,
        [nextActionId]: "CLOSE_DECISION",
      }));
    }
    setNotice(`${type} アクションを追加しました`);
  }

  async function saveDecision() {
    if (!decision) return;
    try {
      await patchDemoDecision(
        projectId,
        decision.decisionId,
        {
          title: title || decision.title,
          status: statusDraft ?? decision.status,
          owner: owner || undefined,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        },
        getIdToken,
      );
      await refresh();
      setTitleDraft(null);
      setStatusDraft(null);
      setOwnerDraft(null);
      setDueAtDraft(null);
      setNotice("更新内容を保存しました");
    } catch (e) {
      setNotice(`更新に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function moveReadyToDecide() {
    if (!decision) return;
    try {
      await patchDemoDecision(projectId, decision.decisionId, { status: "READY_TO_DECIDE" }, getIdToken);
      await refresh();
      setStatusDraft("READY_TO_DECIDE");
      setNotice("ステータスを「議題上げ」に変更しました");
    } catch (e) {
      setNotice(`ステータス更新に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
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

  if (!decision) {
    return (
      <Card>
        <CardTitle>決裁が見つかりません</CardTitle>
        <p className="mt-2 text-sm text-neutral-600">URLが無効です。プロジェクト一覧から選択してください。</p>
        <Button asChild className="mt-4 w-fit">
          <Link href={ROUTES.projects}>プロジェクト一覧へ</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <BackButton label="戻る" />
          <span className="h-4 w-px bg-neutral-200" />
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              autoFocus
              className="h-9 flex-1 min-w-0 text-base font-semibold lg:max-w-[50%]"
            />
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2 lg:max-w-[50%]">
              <p className="truncate text-base font-semibold">{title || "（無題）"}</p>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setIsEditingTitle(true)}>
                <PencilLine className="size-4" />
              </Button>
            </div>
          )}
          <div className="ml-auto flex shrink-0 gap-2">
            <Button size="sm" onClick={() => void saveDecision()}>保存</Button>
            <Button size="sm" variant="secondary" onClick={() => void moveReadyToDecide()}>
              議題に上げる
            </Button>
          </div>
        </div>
        {notice ? (
          <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {notice}
          </p>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
        <div className="space-y-4 xl:col-span-8">
          <Card>
            <CardTitle>選択肢（メリット / デメリット / 備考）</CardTitle>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={optionMode === "SINGLE" ? "secondary" : "ghost"}
                onClick={() => {
                  setOptionMode("SINGLE");
                  setSelectedOptionIds((prev) => (prev[0] ? [prev[0]] : []));
                }}
              >
                単一選択
              </Button>
              <Button
                size="sm"
                variant={optionMode === "HYBRID" ? "secondary" : "ghost"}
                onClick={() => setOptionMode("HYBRID")}
              >
                複数選択
              </Button>
            </div>
            <div className="mt-3 space-y-3">
              {options.map((option) => {
                const selected = selectedOptionIds.includes(option.id);
                const isEditing = editingOptionId === option.id;
                return (
                  <div key={option.id} className="rounded-[10px] bg-neutral-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {optionMode === "SINGLE" ? (
                        <Radio
                          name="decision-option"
                          value={option.id}
                          checked={selected}
                          onChange={() => toggleOption(option.id)}
                        />
                      ) : (
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleOption(option.id)}
                        />
                      )}
                      {isEditing ? (
                        <Input
                          value={option.label}
                          onChange={(event) => updateOption(option.id, { label: event.target.value })}
                          className="flex-1"
                        />
                      ) : (
                        <div className="flex flex-1 items-center gap-2">
                          <p className="text-sm font-medium">{option.label || "（無題）"}</p>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                          <Textarea
                            className="min-h-[96px]"
                            value={option.merit}
                            onChange={(event) => updateOption(option.id, { merit: event.target.value })}
                            placeholder="メリット"
                          />
                          <Textarea
                            className="min-h-[96px]"
                            value={option.demerit}
                            onChange={(event) => updateOption(option.id, { demerit: event.target.value })}
                            placeholder="デメリット"
                          />
                          <Textarea
                            className="min-h-[96px]"
                            value={option.note}
                            onChange={(event) => updateOption(option.id, { note: event.target.value })}
                            placeholder="備考"
                          />
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setEditingOptionId(null)}>完了</Button>
                      </>
                    ) : (
                      <div className="mt-2 flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1 text-xs text-neutral-600">
                          {[option.merit, option.demerit, option.note].some(Boolean) ? (
                            <>
                              {option.merit ? <p>メリット: {option.merit}</p> : null}
                              {option.demerit ? <p>デメリット: {option.demerit}</p> : null}
                              {option.note ? <p>備考: {option.note}</p> : null}
                            </>
                          ) : (
                            <p>メリット・デメリット・備考を入力</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 shrink-0" onClick={() => setEditingOptionId(option.id)}>
                          <PencilLine className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={addOption}>
                選択肢を追加
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>決裁結論</CardTitle>
            <p className="mt-2 text-xs text-neutral-600">
              {selectedOptionLabels.length
                ? `選択中: ${selectedOptionLabels.join(optionMode === "HYBRID" ? " + " : "")}`
                : "選択肢が未選択です"}
            </p>
            {isEditingConclusion ? (
              <div className="mt-3">
                <Textarea
                  value={decisionConclusion}
                  onChange={(event) => setDecisionConclusion(event.target.value)}
                />
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setIsEditingConclusion(false)}>完了</Button>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2">
                <p className="flex-1 text-sm text-neutral-700 whitespace-pre-wrap">{decisionConclusion || "（未入力）"}</p>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingConclusion(true)}>
                  <PencilLine className="size-4" />
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>前提条件 / 再検討トリガー</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDeepContext((prev) => !prev)}>
                {showDeepContext ? "非表示" : "表示"}
              </Button>
            </div>
            {showDeepContext ? (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-600">前提条件</p>
                  {isEditingAssumptions ? (
                    <div>
                      <Textarea value={assumptions} onChange={(event) => setAssumptions(event.target.value)} />
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setIsEditingAssumptions(false)}>完了</Button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm text-neutral-700 whitespace-pre-wrap">{assumptions || "（未入力）"}</p>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingAssumptions(true)}>
                        <PencilLine className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-600">再検討トリガー</p>
                  {isEditingReopenTrigger ? (
                    <div>
                      <Textarea value={reopenTrigger} onChange={(event) => setReopenTrigger(event.target.value)} />
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setIsEditingReopenTrigger(false)}>完了</Button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm text-neutral-700 whitespace-pre-wrap">{reopenTrigger || "（未入力）"}</p>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingReopenTrigger(true)}>
                        <PencilLine className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Card className="space-y-3">
            <CardTitle>決裁メタ情報</CardTitle>
            {isEditingMeta ? (
              <div className="space-y-3">
                <Select
                  value={status}
                  onChange={(event) => {
                    setStatusDraft(event.target.value as DecisionStatus);
                    setNotice("ステータスを変更しました");
                  }}
                  controlSize="md"
                >
                  {decisionStatusOrder.map((item) => (
                    <option key={item} value={item}>
                      {decisionStatusLabels[item]}
                    </option>
                  ))}
                </Select>
                <Input value={owner} onChange={(event) => setOwnerDraft(event.target.value)} placeholder="決裁者" />
                <Input type="datetime-local" value={dueAt} onChange={(event) => setDueAtDraft(event.target.value)} />
                <Button variant="ghost" size="sm" onClick={() => setIsEditingMeta(false)}>完了</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1 text-sm text-neutral-700">
                  <div className="flex items-center gap-2">
                    <span>ステータス:</span>
                    <StatusChip status={status} />
                  </div>
                  <p>決裁者: {owner || "（未設定）"}</p>
                  <p>期限: {dueAt ? dueAt.replace("T", " ").slice(0, 16) : "（未設定）"}</p>
                </div>
                <Button variant="ghost" size="sm" className="w-fit" onClick={() => setIsEditingMeta(true)}>
                  <PencilLine className="mr-1 size-3" />
                  編集
                </Button>
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <CardTitle>アクション</CardTitle>
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={activeTab === "Prep" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("Prep")}
                >
                  準備
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === "Exec" ? "secondary" : "ghost"}
                  onClick={() => setActiveTab("Exec")}
                >
                  実行
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-neutral-600">{visibleActionCount} 件</p>
                <Button variant="outline" size="sm" onClick={() => addAction(activeTab)}>
                  {activeTab === "Prep" ? "準備を追加" : "実行を追加"}
                </Button>
              </div>
            </div>
            <p className="rounded-[10px] border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              決裁を前に進めるためのアクション管理です。個別タスクの管理は既存のタスク管理ツールで行う前提です。
            </p>

            <div className="space-y-2">
              {actionList.map((action) => {
                const displayTitle = actionTitleOverrides[action.actionId] ?? action.title;
                const actionNote = getActionNote(action);
                const actionAssignee = getActionAssignee(action);
                const actionDueAt = getActionDueAt(action);
                const isEditingAction = editingActionId === action.actionId;
                return (
                  <div key={action.actionId} className="rounded-[10px] bg-neutral-50 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{displayTitle || "（無題）"}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setEditingActionId(isEditingAction ? null : action.actionId)}
                      >
                        <PencilLine className="mr-1 size-3" />
                        {isEditingAction ? "完了" : "編集"}
                      </Button>
                    </div>

                    {isEditingAction ? (
                      <div className="mt-2 space-y-2">
                        <Input
                          value={displayTitle}
                          onChange={(e) =>
                            setActionTitleOverrides((prev) => ({
                              ...prev,
                              [action.actionId]: e.target.value,
                            }))
                          }
                          className="h-8 text-sm"
                        />
                        <Input
                          value={actionAssignee}
                          onChange={(event) => updateActionAssignee(action.actionId, event.target.value)}
                          placeholder="担当者"
                          className="h-8 text-sm"
                        />
                        <Input
                          type="datetime-local"
                          value={actionDueAt}
                          onChange={(event) => updateActionDueAt(action.actionId, event.target.value)}
                          className="h-8 text-sm"
                        />
                        <Select
                          value={action.status}
                          onChange={(event) =>
                            updateActionStatus(
                              action.actionId,
                              event.target.value as (typeof actionStatusOrder)[number],
                            )
                          }
                          controlSize="sm"
                        >
                          {actionStatusOrder.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {actionStatusLabels[statusOption]}
                            </option>
                          ))}
                        </Select>
                        {action.type === "Exec" ? (
                          <>
                            <Select
                              value={getActionOutcome(action)}
                              onChange={(event) =>
                                updateActionOutcome(action.actionId, event.target.value as ActionOutcome)
                              }
                              controlSize="sm"
                            >
                              <option value="CLOSE_DECISION">この決裁をクローズする</option>
                              <option value="NEXT_DECISION">次の決裁につなげる</option>
                            </Select>
                            {getActionOutcome(action) === "NEXT_DECISION" ? (
                              nextDecisionCandidates.length > 0 ? (
                                <Select
                                  value={getNextDecisionId(action)}
                                  onChange={(event) =>
                                    updateActionNextDecision(action.actionId, event.target.value)
                                  }
                                  controlSize="sm"
                                >
                                  <option value="">次の決裁を選択</option>
                                  {nextDecisionCandidates.map((candidate) => (
                                    <option key={candidate.decisionId} value={candidate.decisionId}>
                                      {candidate.title}
                                    </option>
                                  ))}
                                </Select>
                              ) : (
                                <p className="text-xs text-amber-700">連携先の決裁がありません</p>
                              )
                            ) : null}
                          </>
                        ) : (
                          <Badge className="w-fit border-blue-200 bg-blue-50 text-blue-700">
                            本決裁のための準備（固定）
                          </Badge>
                        )}
                        <Textarea
                          className="min-h-[72px]"
                          placeholder="備考（進捗・連絡事項）"
                          value={actionNote}
                          onChange={(event) => updateActionNote(action.actionId, event.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <Badge className="w-fit border-neutral-300 bg-white text-neutral-700">
                          {actionStatusLabels[action.status]}
                        </Badge>
                        {action.type === "Prep" ? (
                          <Badge className="w-fit border-blue-200 bg-blue-50 text-blue-700">
                            本決裁のための準備（固定）
                          </Badge>
                        ) : (
                          <p className="text-xs text-neutral-600">
                            完了時:{" "}
                            {getActionOutcome(action) === "CLOSE_DECISION"
                              ? "この決裁をクローズする"
                              : `次の決裁につなげる${
                                  getNextDecisionId(action)
                                    ? `（${
                                        nextDecisionCandidates.find((c) => c.decisionId === getNextDecisionId(action))
                                          ?.title ?? "選択済み"
                                      }）`
                                    : "（未選択）"
                                }`}
                          </p>
                        )}
                        <p className="text-xs text-neutral-600">
                          備考: {actionNote || "（未入力）"}
                        </p>
                        <p className="text-xs text-neutral-600">
                          担当: {actionAssignee || "（未設定）"}
                        </p>
                        <p className="text-xs text-neutral-600">
                          期限: {formatDueAtLabel(actionDueAt)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {activeTab === "Prep"
                ? openQuestions.map((question) => (
                    <div key={question.questionId} className="rounded-[10px] border border-amber-200 bg-amber-50 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{question.title}</p>
                          <Badge className="mt-1 border-amber-300 bg-amber-100 text-amber-800">
                            未対応
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => openChatForQuestion(question.questionId)}
                        >
                          <MessageSquare className="mr-1 size-3" />
                          チャット
                        </Button>
                      </div>
                      <p className="text-xs text-neutral-600">
                        不足: {question.missingFields.map(getMissingFieldLabel).join(" / ")}
                      </p>
                    </div>
                  ))
                : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
