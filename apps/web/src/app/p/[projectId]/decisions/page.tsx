"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { DecisionRelationFlow } from "@/components/pages/decision-relation-flow";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/status-chip";
import {
  decisionStatusLabels,
  decisionStatusOrder,
  type Decision,
  type DecisionStatus,
} from "@/lib/mock/data";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { patchDecisionStatus } from "@/lib/api/demo";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/routes";
import { Settings2 } from "lucide-react";

function DecisionListTable({
  projectId,
  items,
  sortBy,
  setSortBy,
  moveStatus,
}: {
  projectId: string;
  items: Decision[];
  sortBy: "week" | "due" | "updated";
  setSortBy: (v: "week" | "due" | "updated") => void;
  moveStatus: (decisionId: string, status: DecisionStatus) => Promise<void>;
}) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | "ALL">("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    title: true,
    status: true,
    owner: true,
    dueAt: true,
  });

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (statusFilter !== "ALL") {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.summary || "").toLowerCase().includes(q) ||
          (d.owner || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, statusFilter, globalFilter]);

  const columns = useMemo<ColumnDef<Decision>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "タイトル",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.title || "（無題）"}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "ステータス",
        cell: ({ row }) => <StatusChip status={row.original.status} />,
      },
      {
        id: "owner",
        accessorKey: "owner",
        header: "決裁者",
        cell: ({ row }) => row.original.owner || "未設定",
      },
      {
        id: "dueAt",
        accessorKey: "dueAt",
        header: "期限",
        cell: ({ row }) => row.original.dueAt?.slice(0, 10) ?? "—",
      },
      {
        id: "statusSelect",
        header: "操作",
        enableHiding: false,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              controlSize="sm"
              className="w-[140px] min-w-0"
              value={row.original.status}
              onChange={(e) =>
                void moveStatus(row.original.decisionId, e.target.value as DecisionStatus)
              }
            >
              {decisionStatusOrder.map((s) => (
                <option key={s} value={s}>
                  {decisionStatusLabels[s]}
                </option>
              ))}
            </Select>
          </div>
        ),
      },
    ],
    [moveStatus],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="検索..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 w-48 text-sm"
          />
          <Select
            controlSize="sm"
            className="h-8 w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DecisionStatus | "ALL")}
          >
            <option value="ALL">すべてのステータス</option>
            {decisionStatusOrder.map((s) => (
              <option key={s} value={s}>
                {decisionStatusLabels[s]}
              </option>
            ))}
          </Select>
          <Select
            controlSize="sm"
            className="h-8 w-[120px]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "week" | "due" | "updated")}
          >
            <option value="week">今週決める</option>
            <option value="due">期限順</option>
            <option value="updated">更新順</option>
          </Select>
          <details className="relative ml-auto">
            <summary className="flex cursor-pointer items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
              <Settings2 className="size-4" />
              表示列
            </summary>
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <label key={col.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                    />
                    {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                  </label>
                ))}
            </div>
          </details>
        </div>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left font-medium text-neutral-700"
                      style={{ width: header.id === "title" ? "30%" : header.id === "statusSelect" ? "140px" : undefined }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(ROUTES.decisionDetail(projectId, row.original.decisionId))}
                  className="cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50 last:border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 text-neutral-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neutral-500">
          {filteredItems.length} 件（行クリックで詳細へ）
        </p>
      </div>
    </Card>
  );
}

export default function DecisionsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const { snapshot, loading, error, refresh } = useDemoProjectSnapshot(projectId);
  const { getIdToken } = useAuth();
  const baseItems = useMemo(() => snapshot?.decisions ?? [], [snapshot]);
  const [view, setView] = useState<"kanban" | "list" | "flow">("kanban");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DecisionStatus | null>(null);
  const [sortBy, setSortBy] = useState<"week" | "due" | "updated">("week");
  const [notice, setNotice] = useState("");

  const items = baseItems;

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
  const isEmpty = items.length === 0;

  async function moveStatus(decisionId: string, status: DecisionStatus) {
    const target = items.find((item) => item.decisionId === decisionId);
    try {
      await patchDecisionStatus(projectId, decisionId, status, getIdToken);
      await refresh();
      if (target) {
        setNotice(`「${target.title}」を ${decisionStatusLabels[status]} に更新しました`);
      }
    } catch (e) {
      setNotice(
        e instanceof Error
          ? `ステータス更新に失敗しました: ${e.message}`
          : "ステータス更新に失敗しました",
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

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href={ROUTES.decisionNew(projectId)}>新規決裁</Link>
          </Button>
          <div className="h-6 w-px bg-neutral-200" />
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

        {view === "kanban" || view === "list" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">並び順</span>
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
        ) : null}
      </Card>

      {notice ? (
        <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {notice}
        </p>
      ) : null}

      {isEmpty ? (
        <Card className="space-y-4 bg-blue-50/60">
          <div>
            <CardTitle>このプロジェクトにはまだ決裁がありません</CardTitle>
            <p className="mt-1 text-sm text-neutral-600">
              初回は「新規会議メモ」で議事録を貼り付けると、決裁一覧を自動生成できます。
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={ROUTES.meetingNew(projectId)}>新規会議メモを作成</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.decisionNew(projectId)}>手動で新規決裁</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {view === "flow" ? (
        <DecisionRelationFlow projectId={projectId} />
      ) : view === "kanban" ? (
        <div className="grid grid-cols-4 gap-3">
          {decisionStatusOrder.map((status) => {
            const colColors: Record<DecisionStatus, string> = {
              NEEDS_INFO: "bg-amber-50/80",
              READY_TO_DECIDE: "bg-blue-50/80",
              DECIDED: "bg-green-50/80",
              REOPEN: "bg-rose-50/80",
            };
            const dropColors: Record<DecisionStatus, string> = {
              NEEDS_INFO: "ring-2 ring-amber-400",
              READY_TO_DECIDE: "ring-2 ring-blue-400",
              DECIDED: "ring-2 ring-green-400",
              REOPEN: "ring-2 ring-rose-400",
            };
            return (
              <div
                key={status}
                className={`min-w-0 rounded-xl p-2 ${colColors[status]} ${dropTarget === status ? dropColors[status] : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget(status);
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  const decisionId = event.dataTransfer.getData("text/decision-id");
                  if (decisionId) void moveStatus(decisionId, status);
                  setDropTarget(null);
                  setDraggingId(null);
                }}
              >
                <div className="px-1 py-2 text-sm font-medium text-neutral-700">
                  {decisionStatusLabels[status]} ({items.filter((item) => item.status === status).length})
                </div>
                <div className="min-h-[200px] space-y-2 p-1">
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
                            ? "rounded-lg bg-white px-3 py-2 opacity-60 shadow-sm"
                            : "rounded-lg bg-white px-3 py-2 shadow-sm"
                        }
                      >
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600">{item.summary}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <StatusChip status={item.status} />
                          <p className="text-xs text-neutral-500">{item.owner || "未設定"}</p>
                        </div>
                        <div className="mt-2 flex justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={ROUTES.decisionDetail(projectId, item.decisionId)}>詳細</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DecisionListTable
          projectId={projectId}
          items={sortedItems}
          sortBy={sortBy}
          setSortBy={setSortBy}
          moveStatus={moveStatus}
        />
      )}
    </div>
  );
}
