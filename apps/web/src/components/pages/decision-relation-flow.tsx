"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StatusChip } from "@/components/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getProjectActions,
  getProjectDecisions,
  type Action,
  type ActionStatus,
  type Decision,
} from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

type DecisionNodeData = {
  kind: "decision";
  decision: Decision;
  linkedActionCount: number;
  supporterActionCount: number;
};

type ActionNodeData = {
  kind: "action";
  action: Action;
  ownerDecision: Decision | null;
  supportDecision: Decision | null;
};

type RelationNodeData = DecisionNodeData | ActionNodeData;

const DECISION_X = 70;
const ACTION_X = 520;
const DECISION_NODE_HEIGHT = 152;
const ACTION_NODE_HEIGHT = 164;
const ACTION_VERTICAL_GAP = 28;
const BLOCK_GAP = 92;
const FLOW_CANVAS_HEIGHT = 720;

function distributedPercents(count: number) {
  if (count <= 1) return [50];
  return Array.from({ length: count }, (_, i) => 18 + (64 * i) / (count - 1));
}

function actionStatusTone(status: ActionStatus) {
  if (status === "DONE") return "border-green-300 bg-green-50 text-green-700";
  if (status === "DOING") return "border-blue-300 bg-blue-50 text-blue-700";
  if (status === "BLOCKED") return "border-rose-300 bg-rose-50 text-rose-700";
  return "border-amber-300 bg-amber-50 text-amber-700";
}

function RelationNode({ data, selected }: NodeProps) {
  const relationData = data as RelationNodeData;

  if (relationData.kind === "decision") {
    const outHandlePercents = distributedPercents(
      Math.max(1, relationData.linkedActionCount),
    );

    return (
      <div
        className={
          selected
            ? "w-[320px] min-h-[152px] rounded-[14px] border-2 border-blue-500 bg-blue-50/80 px-3 py-2 shadow-sm"
            : "w-[320px] min-h-[152px] rounded-[14px] border-2 border-blue-300 bg-blue-50/40 px-3 py-2 shadow-sm"
        }
      >
        <Handle
          id="in-main"
          type="target"
          position={Position.Left}
          className="!size-2 !bg-blue-500"
          style={{ top: "50%" }}
        />
        <Handle
          id="in-support"
          type="target"
          position={Position.Left}
          className="!size-2 !bg-cyan-500"
          style={{ top: "86%" }}
        />
        <div className="mb-1 inline-flex items-center rounded-full border border-blue-300 bg-white px-2 py-0.5">
          <p className="text-[10px] font-semibold tracking-wide text-blue-700">DECISION</p>
        </div>
        <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
          {relationData.decision.title}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <StatusChip status={relationData.decision.status} />
          <Badge>{relationData.decision.owner || "決裁者未設定"}</Badge>
        </div>
        <p className="mt-1 text-[11px] text-neutral-600">
          紐づくAction: {relationData.linkedActionCount} / 他決裁からの支援Action:{" "}
          {relationData.supporterActionCount}
        </p>
        {outHandlePercents.map((topPercent, idx) => (
          <Handle
            key={`out-own-${idx}`}
            id={`out-own-${idx}`}
            type="source"
            position={Position.Right}
            className="!size-2 !bg-blue-500"
            style={{ top: `${topPercent}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={
        selected
          ? "w-[320px] min-h-[164px] rounded-[14px] border-2 border-cyan-500 bg-cyan-50/80 px-3 py-2 shadow-sm"
          : "w-[320px] min-h-[164px] rounded-[14px] border-2 border-cyan-300 bg-cyan-50/45 px-3 py-2 shadow-sm"
      }
      style={{ borderStyle: "dashed" }}
    >
      <Handle
        id="in-own"
        type="target"
        position={Position.Left}
        className="!size-2 !bg-cyan-500"
        style={{ top: "52%" }}
      />
      <div className="mb-1 inline-flex items-center rounded-full border border-cyan-300 bg-white px-2 py-0.5">
        <p className="text-[10px] font-semibold tracking-wide text-cyan-700">
          ACTION / {relationData.action.type}
        </p>
      </div>
      <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
        {relationData.action.title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge className={actionStatusTone(relationData.action.status)}>
          {relationData.action.status}
        </Badge>
        <Badge>{relationData.action.assignee || "担当未設定"}</Badge>
      </div>
      <p className="mt-1 line-clamp-1 text-[11px] text-neutral-600">
        紐づき: {relationData.ownerDecision?.title || relationData.action.decisionId}
      </p>
      {relationData.supportDecision &&
      relationData.supportDecision.decisionId !== relationData.action.decisionId ? (
        <p className="line-clamp-1 text-[11px] text-cyan-700">
          支援先: {relationData.supportDecision.title}
        </p>
      ) : null}
      <Handle
        id="out-support"
        type="source"
        position={Position.Right}
        className="!size-2 !bg-cyan-500"
        style={{ top: "88%" }}
      />
    </div>
  );
}

const nodeTypes = { relation: RelationNode };

export function DecisionRelationFlow({ projectId }: { projectId: string }) {
  const decisions = getProjectDecisions(projectId);
  const actions = getProjectActions(projectId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    decisions[0] ? `decision:${decisions[0].decisionId}` : null,
  );

  const { nodes, edges } = useMemo(() => {
    const nextNodes: Node<RelationNodeData>[] = [];
    const nextEdges: Edge[] = [];
    const decisionById = new Map<string, Decision>();
    let cursorY = 60;

    decisions.forEach((decision) => {
      decisionById.set(decision.decisionId, decision);
    });

    decisions.forEach((decision) => {
      const ownerActions = actions.filter(
        (action) => action.decisionId === decision.decisionId,
      );

      const linkedActionCount = actions.filter(
        (action) => action.decisionId === decision.decisionId,
      ).length;
      const supporterActionCount = actions.filter(
        (action) =>
          action.supportsDecisionId === decision.decisionId &&
          action.decisionId !== decision.decisionId,
      ).length;

      const actionStackHeight =
        ownerActions.length > 0
          ? ownerActions.length * ACTION_NODE_HEIGHT +
            (ownerActions.length - 1) * ACTION_VERTICAL_GAP
          : ACTION_NODE_HEIGHT;
      const blockHeight = Math.max(DECISION_NODE_HEIGHT, actionStackHeight);
      const decisionY = cursorY + Math.max(0, (blockHeight - DECISION_NODE_HEIGHT) / 2);

      nextNodes.push({
        id: `decision:${decision.decisionId}`,
        type: "relation",
        position: { x: DECISION_X, y: decisionY },
        data: {
          kind: "decision",
          decision,
          linkedActionCount,
          supporterActionCount,
        },
      });

      ownerActions.forEach((action, actionIndex) => {
        const ownerDecision = decisionById.get(action.decisionId) ?? null;
        const supportDecision = action.supportsDecisionId
          ? (decisionById.get(action.supportsDecisionId) ?? null)
          : null;

        nextNodes.push({
          id: `action:${action.actionId}`,
          type: "relation",
          position: {
            x: ACTION_X,
            y: cursorY + actionIndex * (ACTION_NODE_HEIGHT + ACTION_VERTICAL_GAP),
          },
          data: { kind: "action", action, ownerDecision, supportDecision },
        });

        nextEdges.push({
          id: `edge:own:${action.actionId}`,
          source: `decision:${action.decisionId}`,
          sourceHandle: `out-own-${actionIndex}`,
          target: `action:${action.actionId}`,
          targetHandle: "in-own",
          type: "step",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
          style: { stroke: "#64748b", strokeWidth: 1.5 },
        });

        if (action.supportsDecisionId && action.supportsDecisionId !== action.decisionId) {
          nextEdges.push({
            id: `edge:support:${action.actionId}:${action.supportsDecisionId}`,
            source: `action:${action.actionId}`,
            sourceHandle: "out-support",
            target: `decision:${action.supportsDecisionId}`,
            targetHandle: "in-support",
            type: "step",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#0891b2" },
            style: { stroke: "#0891b2", strokeWidth: 1.7, strokeDasharray: "6 4" },
          });
        }
      });

      cursorY += blockHeight + BLOCK_GAP;
    });

    const orphanActions = actions.filter((action) => !decisionById.has(action.decisionId));
    if (orphanActions.length > 0) {
      orphanActions.forEach((action, actionIndex) => {
        nextNodes.push({
          id: `action:${action.actionId}`,
          type: "relation",
          position: {
            x: ACTION_X,
            y: cursorY + actionIndex * (ACTION_NODE_HEIGHT + ACTION_VERTICAL_GAP),
          },
          data: {
            kind: "action",
            action,
            ownerDecision: null,
            supportDecision: action.supportsDecisionId
              ? (decisionById.get(action.supportsDecisionId) ?? null)
              : null,
          },
        });
      });
      cursorY +=
        orphanActions.length * ACTION_NODE_HEIGHT +
        Math.max(0, orphanActions.length - 1) * ACTION_VERTICAL_GAP;
    }

    return { nodes: nextNodes, edges: nextEdges };
  }, [actions, decisions]);

  const activeSelectedNodeId = useMemo(() => {
    if (selectedNodeId && nodes.some((node) => node.id === selectedNodeId)) {
      return selectedNodeId;
    }
    return nodes[0]?.id ?? null;
  }, [nodes, selectedNodeId]);

  const selectedData = useMemo(() => {
    if (!activeSelectedNodeId) return null;
    const selectedNode = nodes.find((node) => node.id === activeSelectedNodeId);
    return selectedNode?.data ?? null;
  }, [activeSelectedNodeId, nodes]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-8 p-0">
        <div className="border-b border-neutral-200 px-4 py-3">
          <CardTitle>決裁・アクション連鎖マップ</CardTitle>
          <CardDescription className="mt-1">
            実線は「決裁に紐づくアクション」、点線は「別決裁を支援するアクション」です。
          </CardDescription>
        </div>
        <div style={{ height: FLOW_CANVAS_HEIGHT }} className="h-[720px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: -20, y: 20, zoom: 0.72 }}
            minZoom={0.45}
            maxZoom={1.2}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          >
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) =>
                node.id.startsWith("decision:") ? "#bfdbfe" : "#a5f3fc"
              }
            />
            <Controls />
            <Background gap={16} color="#e5e7eb" />
          </ReactFlow>
        </div>
      </Card>

      <Card className="col-span-4 space-y-3">
        <CardTitle>詳細サイドパネル</CardTitle>
        {!selectedData ? (
          <p className="text-sm text-neutral-600">ノードを選択すると詳細が表示されます。</p>
        ) : selectedData.kind === "decision" ? (
          <>
            <p className="text-xs text-neutral-500">Decision</p>
            <p className="text-sm font-semibold text-neutral-900">{selectedData.decision.title}</p>
            <StatusChip status={selectedData.decision.status} />
            <p className="text-xs text-neutral-600">{selectedData.decision.summary}</p>
            <div className="rounded-[10px] border border-neutral-200 p-2 text-xs text-neutral-700">
              <p>決裁者: {selectedData.decision.owner || "未設定"}</p>
              <p>期限: {selectedData.decision.dueAt?.slice(0, 10) || "未設定"}</p>
              <p>紐づくAction: {selectedData.linkedActionCount}</p>
              <p>他決裁からの支援Action: {selectedData.supporterActionCount}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-white hover:text-white" asChild>
                <Link
                  className="text-white hover:text-white"
                  href={ROUTES.decisionDetail(projectId, selectedData.decision.decisionId)}
                >
                  決裁詳細へ
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={ROUTES.chat(projectId, selectedData.decision.decisionId)}>
                  不足質問
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-neutral-500">Action</p>
            <p className="text-sm font-semibold text-neutral-900">{selectedData.action.title}</p>
            <div className="flex flex-wrap gap-1">
              <Badge>{selectedData.action.type}</Badge>
              <Badge className={actionStatusTone(selectedData.action.status)}>
                {selectedData.action.status}
              </Badge>
            </div>
            <div className="rounded-[10px] border border-neutral-200 p-2 text-xs text-neutral-700">
              <p>担当: {selectedData.action.assignee || "未設定"}</p>
              <p>期限: {selectedData.action.dueAt?.slice(0, 10) || "未設定"}</p>
              <p>紐づく決裁: {selectedData.ownerDecision?.title || selectedData.action.decisionId}</p>
              <p>
                支援先決裁:{" "}
                {selectedData.supportDecision?.title ||
                  (selectedData.action.supportsDecisionId ? selectedData.action.supportsDecisionId : "なし")}
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href={ROUTES.decisionDetail(projectId, selectedData.action.decisionId)}>
                親決裁を開く
              </Link>
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
