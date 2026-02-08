"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DecisionRelationFlow } from "@/components/pages/decision-relation-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/status-chip";
import { OpenRightPanelButton } from "@/components/layout/open-right-panel-button";
import {
  decisions as seedDecisions,
  type Decision,
  type DecisionStatus,
} from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

const columns: DecisionStatus[] = [
  "NEEDS_INFO",
  "READY_TO_DECIDE",
  "DECIDED",
  "REOPEN",
];

const statusLabel: Record<DecisionStatus, string> = {
  NEEDS_INFO: "情報不足",
  READY_TO_DECIDE: "決められる",
  DECIDED: "確定",
  REOPEN: "再審",
};

export default function DecisionsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const [items, setItems] = useState<Decision[]>(() =>
    seedDecisions.filter((item) => item.projectId === projectId),
  );
  const [view, setView] = useState<"kanban" | "list" | "flow">("flow");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DecisionStatus | null>(null);
  const [sortBy, setSortBy] = useState<"week" | "due" | "updated">("week");
  const [notice, setNotice] = useState("");

  const sortedItems = useMemo(() => {
    const cloned = [...items];
    if (sortBy === "due") {
      return cloned.sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
    }
    if (sortBy === "updated") {
      return cloned.reverse();
    }
    return cloned.sort((a, b) => b.readiness - a.readiness);
  }, [items, sortBy]);

  function moveStatus(decisionId: string, status: DecisionStatus) {
    setItems((prev) =>
      prev.map((item) => (item.decisionId === decisionId ? { ...item, status } : item)),
    );
    const target = items.find((item) => item.decisionId === decisionId);
    if (target) {
      setNotice(`「${target.title}」を ${statusLabel[status]} に移動しました`);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={view === "kanban" ? "secondary" : "ghost"}
            onClick={() => setView("kanban")}
          >
            カンバン
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            onClick={() => setView("list")}
          >
            リスト
          </Button>
          <Button
            size="sm"
            variant={view === "flow" ? "secondary" : "ghost"}
            onClick={() => setView("flow")}
          >
            フロー
          </Button>
        </div>

        {view === "flow" ? (
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <Badge className="border-blue-300 bg-blue-50 text-blue-700">Decision ノード</Badge>
            <Badge className="border-cyan-300 bg-cyan-50 text-cyan-700">Action ノード</Badge>
            <Badge>実線: 紐づき</Badge>
            <Badge>点線: 別決裁を支援</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <Badge>決裁者</Badge>
            <Badge>期限</Badge>
            <Badge>タグ</Badge>
            <Badge>状態</Badge>
            <Select
              controlSize="sm"
              className="w-auto min-w-[120px]"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as "week" | "due" | "updated")}
            >
              <option value="week">今週決める</option>
              <option value="due">期限順</option>
              <option value="updated">更新順</option>
            </Select>
          </div>
        )}
      </Card>

      {notice ? (
        <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {notice}
        </p>
      ) : null}

      {view === "flow" ? (
        <DecisionRelationFlow projectId={projectId} />
      ) : view === "kanban" ? (
        <div className="grid grid-cols-4 gap-4">
          {columns.map((status) => (
            <Card
              key={status}
              className={
                dropTarget === status
                  ? "space-y-3 border-blue-300 bg-blue-50/40"
                  : "space-y-3"
              }
              onDragOver={(event) => {
                event.preventDefault();
                setDropTarget(status);
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(event) => {
                event.preventDefault();
                const decisionId = event.dataTransfer.getData("text/decision-id");
                if (decisionId) {
                  moveStatus(decisionId, status);
                }
                setDropTarget(null);
                setDraggingId(null);
              }}
            >
              <CardTitle>
                {statusLabel[status]} ({items.filter((item) => item.status === status).length})
              </CardTitle>

              {sortedItems
                .filter((item) => item.status === status)
                .map((item) => (
                  <div
                    key={item.decisionId}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/decision-id", item.decisionId);
                      setDraggingId(item.decisionId);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropTarget(null);
                    }}
                    className={
                      draggingId === item.decisionId
                        ? "rounded-[10px] border border-blue-300 bg-white px-3 py-3 opacity-50"
                        : "rounded-[10px] border border-neutral-200 bg-white px-3 py-3"
                    }
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-neutral-600">{item.summary}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusChip status={item.status} />
                      <p className="text-xs text-neutral-500">{item.owner || "未設定"}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={ROUTES.decisionDetail(projectId, item.decisionId)}>詳細</Link>
                      </Button>
                      {item.status === "NEEDS_INFO" ? (
                        <OpenRightPanelButton label="質問" tab="chat" size="sm" />
                      ) : null}
                    </div>
                  </div>
                ))}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardTitle>決裁一覧</CardTitle>
          <div className="mt-4 space-y-2">
            {sortedItems.map((item) => (
              <div
                key={item.decisionId}
                className="grid grid-cols-12 items-center rounded-[10px] border border-neutral-200 px-3 py-2 text-sm"
              >
                <Link
                  href={ROUTES.decisionDetail(projectId, item.decisionId)}
                  className="col-span-4 font-medium hover:text-blue-700"
                >
                  {item.title}
                </Link>
                <p className="col-span-2 text-neutral-600">{item.owner || "未設定"}</p>
                <p className="col-span-2 text-neutral-600">{item.dueAt?.slice(0, 10)}</p>
                <p className="col-span-2 text-neutral-600">{item.tag}</p>
                <Select
                  controlSize="sm"
                  className="col-span-2"
                  value={item.status}
                  onChange={(event) =>
                    moveStatus(item.decisionId, event.target.value as DecisionStatus)
                  }
                >
                  {columns.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusLabel[statusOption]}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
