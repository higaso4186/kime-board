"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  BaseEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Gavel, Wrench } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { StatusChip } from "@/components/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import {
  actionStatusLabels,
  type Action,
  type ActionStatus,
  type Decision,
} from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

type DecisionNodeData = {
  kind: "decision";
  decision: Decision;
  prepCount: number;
  execCount: number;
  supporterActionCount: number;
};

type ActionNodeData = {
  kind: "action";
  action: Action;
  ownerDecision: Decision | null;
  supportDecision: Decision | null;
};

type RelationNodeData = DecisionNodeData | ActionNodeData;
type RelationEdgeData = {
  kind: "flow" | "support";
  lane: number;
};

const NODE_WIDTH = 280;
const NODE_HEIGHT = 140;
const PREP_COLUMN_X = 0;
const DECISION_COLUMN_X = 340;
const EXEC_COLUMN_X = 680;
const SAME_LEVEL_BLOCK_GAP = 72;
const VERTICAL_LEVEL_GAP = 120;
const VERTICAL_NODE_GAP = 20;
const SUPPORT_SOURCE_HANDLE_PERCENTS = [72, 78, 84, 90, 96];

function distributedPercents(count: number) {
  if (count <= 1) return [50];
  return Array.from({ length: count }, (_, i) => 18 + (64 * i) / (count - 1));
}

function supportInboundPercents(count: number) {
  if (count <= 1) return [86];
  return Array.from({ length: count }, (_, i) => 70 + (20 * i) / (count - 1));
}

function prepInboundPercents(count: number) {
  if (count <= 1) return [52];
  return Array.from({ length: count }, (_, i) => 40 + (24 * i) / (count - 1));
}

function actionStatusTone(status: ActionStatus) {
  if (status === "DONE") return "border-green-300 bg-green-50 text-green-700";
  if (status === "DOING") return "border-blue-300 bg-blue-50 text-blue-700";
  if (status === "BLOCKED") return "border-rose-300 bg-rose-50 text-rose-700";
  return "border-amber-300 bg-amber-50 text-amber-700";
}

function buildPolylinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";

  const uniquePoints = points.filter((point, idx) => {
    if (idx === 0) return true;
    const prev = points[idx - 1];
    return Math.abs(prev.x - point.x) > 0.5 || Math.abs(prev.y - point.y) > 0.5;
  });

  return uniquePoints.reduce((acc, point, idx) => {
    if (idx === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, "");
}

function OrthogonalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const edgeData = (data ?? { kind: "flow", lane: 0 }) as RelationEdgeData;
  const lane = Math.max(0, edgeData.lane ?? 0);
  const isSupport = edgeData.kind === "support";
  const isBackward = sourceX > targetX;
  const targetApproachX = targetX - 20;

  if (isSupport) {
    const bypassOffsetY = 42 + lane * 16;
    const bypassY =
      targetY < sourceY
        ? Math.min(sourceY, targetY) - bypassOffsetY
        : Math.max(sourceY, targetY) + bypassOffsetY;

    if (isBackward) {
      const corridorBaseX = targetX + NODE_WIDTH + 28;
      const corridorX = Math.min(sourceX - 18, corridorBaseX + lane * 16);
      const path = buildPolylinePath([
        { x: sourceX, y: sourceY },
        { x: corridorX, y: sourceY },
        { x: corridorX, y: bypassY },
        { x: targetApproachX, y: bypassY },
        { x: targetApproachX, y: targetY },
        { x: targetX, y: targetY },
      ]);
      return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
    }

    const corridorBaseX = targetX - 28;
    const corridorX = Math.min(
      Math.max(sourceX + 18, corridorBaseX - lane * 14),
      targetApproachX - 6,
    );
    const path = buildPolylinePath([
      { x: sourceX, y: sourceY },
      { x: corridorX, y: sourceY },
      { x: corridorX, y: bypassY },
      { x: targetApproachX, y: bypassY },
      { x: targetApproachX, y: targetY },
      { x: targetX, y: targetY },
    ]);
    return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
  }

  let anchorX = sourceX + Math.max(24, Math.abs(targetX - sourceX) / 2) + lane * 8;
  if (isBackward) {
    anchorX = Math.min(sourceX - 18, targetX - 48 - lane * 10);
  } else {
    anchorX = Math.min(anchorX, targetX - 24);
  }
  const path = buildPolylinePath([
    { x: sourceX, y: sourceY },
    { x: anchorX, y: sourceY },
    { x: anchorX, y: targetY },
    { x: targetX, y: targetY },
  ]);
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
}

function RelationNode({ data, selected }: NodeProps) {
  const relationData = data as RelationNodeData;

  if (relationData.kind === "decision") {
    const prepCount = Math.max(1, relationData.prepCount);
    const execCount = Math.max(1, relationData.execCount);
    const prepInHandlePercents = prepInboundPercents(prepCount);
    const outHandlePercents = distributedPercents(execCount);
    const supportInHandlePercents = supportInboundPercents(
      Math.max(1, relationData.supporterActionCount),
    );

    return (
      <div
        className={
          selected
            ? "w-[280px] h-[140px] rounded-xl border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-white px-3 py-2 shadow-md"
            : "w-[280px] h-[140px] rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white px-3 py-2 shadow-sm"
        }
      >
        {prepInHandlePercents.map((topPercent, idx) => (
          <Handle
            key={`in-prep-${idx}`}
            id={`in-prep-${idx}`}
            type="target"
            position={Position.Left}
            className="!size-2 !bg-blue-500"
            style={{ top: `${topPercent}%` }}
          />
        ))}
        {supportInHandlePercents.map((topPercent, idx) => (
          <Handle
            key={`in-support-${idx}`}
            id={`in-support-${idx}`}
            type="target"
            position={Position.Left}
            className="!size-2 !bg-cyan-500"
            style={{ top: `${topPercent}%` }}
          />
        ))}
        <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-blue-300 bg-white px-2 py-0.5">
          <Gavel className="size-3 text-blue-700" />
          <p className="text-[10px] font-semibold tracking-wide text-blue-700">DECISION</p>
        </div>
        <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
          {relationData.decision.title}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <StatusChip status={relationData.decision.status} />
          <Badge>{relationData.decision.owner || "未設定"}</Badge>
        </div>
        <p className="mt-1 text-[11px] text-neutral-600">
          紐づくExec: {relationData.execCount} / 支援: {relationData.supporterActionCount}
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
          ? "w-[280px] h-[140px] border-2 border-cyan-600 bg-gradient-to-br from-cyan-50 to-white px-3 py-2 shadow-md"
          : "w-[280px] h-[140px] border-2 border-cyan-400 bg-gradient-to-br from-cyan-50 to-white px-3 py-2 shadow-sm"
      }
      style={{
        borderStyle: "dashed",
        clipPath: "polygon(0 0, 92% 0, 100% 12%, 100% 100%, 0 100%)",
      }}
    >
      <Handle
        id="in-own"
        type="target"
        position={Position.Left}
        className="!size-2 !bg-cyan-500"
        style={{ top: "52%" }}
      />
      <Handle
        id="out-own-link"
        type="source"
        position={Position.Right}
        className="!size-2 !bg-blue-500"
        style={{ top: "52%" }}
      />
      <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-cyan-300 bg-white px-2 py-0.5">
        <Wrench className="size-3 text-cyan-700" />
        <p className="text-[10px] font-semibold tracking-wide text-cyan-700">
          ACTION / {relationData.action.type}
        </p>
      </div>
      <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
        {relationData.action.title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge className={actionStatusTone(relationData.action.status)}>
          {actionStatusLabels[relationData.action.status]}
        </Badge>
        <Badge>{relationData.action.assignee || "未設定"}</Badge>
      </div>
      <p className="mt-1 line-clamp-1 text-[11px] text-neutral-600">
        紐づく決裁: {relationData.ownerDecision?.title || relationData.action.decisionId}
      </p>
      {relationData.supportDecision &&
      relationData.supportDecision.decisionId !== relationData.action.decisionId ? (
        <p className="line-clamp-1 text-[11px] text-cyan-700">
          支援対象: {relationData.supportDecision.title}
        </p>
      ) : null}
      {SUPPORT_SOURCE_HANDLE_PERCENTS.map((topPercent, idx) => (
        <Handle
          key={`out-support-${idx}`}
          id={`out-support-${idx}`}
          type="source"
          position={Position.Right}
          className="!size-2 !bg-cyan-500"
          style={{ top: `${topPercent}%` }}
        />
      ))}
      {SUPPORT_SOURCE_HANDLE_PERCENTS.map((topPercent, idx) => (
        <Handle
          key={`out-support-left-${idx}`}
          id={`out-support-left-${idx}`}
          type="source"
          position={Position.Left}
          className="!size-2 !bg-cyan-500"
          style={{ top: `${topPercent}%` }}
        />
      ))}
    </div>
  );
}

const nodeTypes = { relation: RelationNode };
const edgeTypes = { orthogonal: OrthogonalEdge };

type DecisionLevel = {
  level: number;
  decisions: Decision[];
};

function findStronglyConnectedComponents(
  decisions: Decision[],
  dependsOn: Map<string, Set<string>>,
): Set<string>[] {
  const graph = new Map<string, string[]>();
  const reverseGraph = new Map<string, string[]>();
  
  decisions.forEach(d => {
    graph.set(d.decisionId, Array.from(dependsOn.get(d.decisionId) || []));
    reverseGraph.set(d.decisionId, []);
  });
  
  decisions.forEach(d => {
    const deps = dependsOn.get(d.decisionId) || new Set();
    deps.forEach(dep => {
      reverseGraph.get(dep)?.push(d.decisionId);
    });
  });

  const visited = new Set<string>();
  const finishOrder: string[] = [];

  function dfs1(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const neighbors = graph.get(nodeId) || [];
    neighbors.forEach(neighbor => dfs1(neighbor));
    finishOrder.push(nodeId);
  }

  decisions.forEach(d => dfs1(d.decisionId));

  const componentMap = new Map<string, number>();
  let componentId = 0;

  function dfs2(nodeId: string, compId: number) {
    if (componentMap.has(nodeId)) return;
    componentMap.set(nodeId, compId);
    const neighbors = reverseGraph.get(nodeId) || [];
    neighbors.forEach(neighbor => dfs2(neighbor, compId));
  }

  for (let i = finishOrder.length - 1; i >= 0; i--) {
    const nodeId = finishOrder[i];
    if (!componentMap.has(nodeId)) {
      dfs2(nodeId, componentId++);
    }
  }

  const components: Map<number, Set<string>> = new Map();
  componentMap.forEach((compId, nodeId) => {
    if (!components.has(compId)) {
      components.set(compId, new Set());
    }
    components.get(compId)!.add(nodeId);
  });

  return Array.from(components.values());
}

function computeDecisionLevels(decisions: Decision[], actions: Action[]): DecisionLevel[] {
  const decisionById = new Map(decisions.map((d) => [d.decisionId, d]));
  const decisionIndex = new Map(decisions.map((d, index) => [d.decisionId, index]));

  function decisionDueAtMs(decision: Decision) {
    if (!decision.dueAt) return Number.POSITIVE_INFINITY;
    const timestamp = Date.parse(decision.dueAt);
    return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
  }

  function compareDecisions(a: Decision, b: Decision) {
    const dueDiff = decisionDueAtMs(a) - decisionDueAtMs(b);
    if (dueDiff !== 0) return dueDiff;

    const indexDiff =
      (decisionIndex.get(a.decisionId) ?? Number.MAX_SAFE_INTEGER) -
      (decisionIndex.get(b.decisionId) ?? Number.MAX_SAFE_INTEGER);
    if (indexDiff !== 0) return indexDiff;

    return a.decisionId.localeCompare(b.decisionId);
  }

  const dependsOn = new Map<string, Set<string>>();
  decisions.forEach((d) => dependsOn.set(d.decisionId, new Set()));
  
  actions.forEach((action) => {
    if (action.supportsDecisionId && action.supportsDecisionId !== action.decisionId) {
      const sourceDecision = action.decisionId;
      const targetDecision = action.supportsDecisionId;
      if (decisionById.has(targetDecision)) {
        dependsOn.get(targetDecision)?.add(sourceDecision);
      }
    }
  });

  const sccs = findStronglyConnectedComponents(decisions, dependsOn);
  
  const sccMap = new Map<string, Set<string>>();
  sccs.forEach(scc => {
    scc.forEach(nodeId => sccMap.set(nodeId, scc));
  });

  const sccDeps = new Map<Set<string>, Set<Set<string>>>();
  const sccNext = new Map<Set<string>, Set<Set<string>>>();
  sccs.forEach(scc => {
    sccDeps.set(scc, new Set());
    sccNext.set(scc, new Set());
  });

  sccs.forEach(scc => {
    scc.forEach(nodeId => {
      const deps = dependsOn.get(nodeId) || new Set();
      deps.forEach(dep => {
        const depScc = sccMap.get(dep);
        if (depScc && depScc !== scc) {
          sccDeps.get(scc)!.add(depScc);
          sccNext.get(depScc)!.add(scc);
        }
      });
    });
  });

  const sccMeta = new Map<
    Set<string>,
    { size: number; minDueAt: number; minIndex: number; downstreamCount: number; decisions: Decision[] }
  >();
  sccs.forEach((scc) => {
    const decisionsInScc = Array.from(scc)
      .map((id) => decisionById.get(id))
      .filter((item): item is Decision => item !== undefined)
      .sort(compareDecisions);

    const minDueAt = Math.min(...decisionsInScc.map((decision) => decisionDueAtMs(decision)));
    const minIndex = Math.min(
      ...decisionsInScc.map((decision) => decisionIndex.get(decision.decisionId) ?? Number.MAX_SAFE_INTEGER),
    );

    sccMeta.set(scc, {
      size: scc.size,
      minDueAt,
      minIndex,
      downstreamCount: sccNext.get(scc)?.size ?? 0,
      decisions: decisionsInScc,
    });
  });

  function compareSccOrder(a: Set<string>, b: Set<string>) {
    const aMeta = sccMeta.get(a);
    const bMeta = sccMeta.get(b);
    if (!aMeta || !bMeta) return 0;

    const sizeDiff = bMeta.size - aMeta.size;
    if (sizeDiff !== 0) return sizeDiff;

    const downstreamDiff = bMeta.downstreamCount - aMeta.downstreamCount;
    if (downstreamDiff !== 0) return downstreamDiff;

    const dueDiff = aMeta.minDueAt - bMeta.minDueAt;
    if (dueDiff !== 0) return dueDiff;

    return aMeta.minIndex - bMeta.minIndex;
  }

  const levels: DecisionLevel[] = [];
  const processed = new Set<Set<string>>();

  while (processed.size < sccs.length) {
    const currentLevelSccs: Set<string>[] = [];
    
    for (const scc of sccs) {
      if (processed.has(scc)) continue;
      
      const deps = sccDeps.get(scc) || new Set();
      const unprocessedDeps = Array.from(deps).filter(dep => !processed.has(dep));
      
      if (unprocessedDeps.length === 0) {
        currentLevelSccs.push(scc);
      }
    }

    if (currentLevelSccs.length === 0) break;

    currentLevelSccs.sort(compareSccOrder);
    currentLevelSccs.forEach(scc => processed.add(scc));
    
    const currentLevelDecisions = currentLevelSccs
      .flatMap((scc) => sccMeta.get(scc)?.decisions ?? []);

    levels.push({
      level: levels.length,
      decisions: currentLevelDecisions,
    });
  }

  return levels;
}

function buildCustomLayout(decisions: Decision[], actions: Action[]) {
  const nodes: Array<Node<RelationNodeData>> = [];
  const edges: Array<Edge<RelationEdgeData>> = [];
  const decisionById = new Map(decisions.map((d) => [d.decisionId, d]));
  const supportLaneByActionId = new Map<string, number>();
  const supportCountByDecisionId = new Map<string, number>();

  actions.forEach((action) => {
    if (
      action.supportsDecisionId &&
      action.supportsDecisionId !== action.decisionId &&
      decisionById.has(action.supportsDecisionId)
    ) {
      const currentCount = supportCountByDecisionId.get(action.supportsDecisionId) ?? 0;
      supportLaneByActionId.set(action.actionId, currentCount);
      supportCountByDecisionId.set(action.supportsDecisionId, currentCount + 1);
    }
  });

  const levels = computeDecisionLevels(decisions, actions);

  let currentLevelY = 0;

  levels.forEach((levelInfo) => {
    const blocksInLevel = levelInfo.decisions.map((decision) => {
      const prepActions = actions.filter(
        (a) => a.decisionId === decision.decisionId && a.type === "Prep",
      );
      const execActions = actions.filter(
        (a) => a.decisionId === decision.decisionId && a.type === "Exec",
      );
      const maxActions = Math.max(prepActions.length, execActions.length, 1);
      const blockHeight = maxActions * NODE_HEIGHT + (maxActions - 1) * VERTICAL_NODE_GAP;

      return { decision, prepActions, execActions, blockHeight };
    });

    let levelCursorY = currentLevelY;

    blocksInLevel.forEach((block) => {
      const blockX = 0;
      const blockY = levelCursorY;
      const rowOffset = 0;

      const supporterCount = supportCountByDecisionId.get(block.decision.decisionId) ?? 0;

      const decisionY = blockY + rowOffset;

      nodes.push({
        id: `decision:${block.decision.decisionId}`,
        type: "relation",
        position: { x: blockX + DECISION_COLUMN_X, y: decisionY },
        data: {
          kind: "decision",
          decision: block.decision,
          prepCount: block.prepActions.length,
          execCount: block.execActions.length,
          supporterActionCount: supporterCount,
        },
      });

      block.prepActions.forEach((action, idx) => {
        const y = blockY + rowOffset + idx * (NODE_HEIGHT + VERTICAL_NODE_GAP);
        const ownerDecision = decisionById.get(action.decisionId) ?? null;
        const supportDecision = action.supportsDecisionId
          ? (decisionById.get(action.supportsDecisionId) ?? null)
          : null;

        nodes.push({
          id: `action:${action.actionId}`,
          type: "relation",
          position: { x: blockX + PREP_COLUMN_X, y },
          data: { kind: "action", action, ownerDecision, supportDecision },
        });

        edges.push({
          id: `edge:prep-to-decision:${action.actionId}`,
          source: `action:${action.actionId}`,
          sourceHandle: "out-own-link",
          target: `decision:${block.decision.decisionId}`,
          targetHandle: `in-prep-${Math.min(idx, Math.max(0, block.prepActions.length - 1))}`,
          type: "orthogonal",
          data: { kind: "flow", lane: idx },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        });

        if (
          action.supportsDecisionId &&
          action.supportsDecisionId !== action.decisionId &&
          decisionById.has(action.supportsDecisionId)
        ) {
          const supportLane = supportLaneByActionId.get(action.actionId) ?? 0;
          const handleLane = Math.min(supportLane, SUPPORT_SOURCE_HANDLE_PERCENTS.length - 1);
          edges.push({
            id: `edge:prep-support:${action.actionId}`,
            source: `action:${action.actionId}`,
            sourceHandle: `out-support-${handleLane}`,
            target: `decision:${action.supportsDecisionId}`,
            targetHandle: `in-support-${supportLane}`,
            type: "orthogonal",
            data: { kind: "support", lane: supportLane },
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#0891b2" },
            style: { stroke: "#0891b2", strokeWidth: 2.5, strokeDasharray: "8 4" },
          });
        }
      });

      block.execActions.forEach((action, idx) => {
        const y = blockY + rowOffset + idx * (NODE_HEIGHT + VERTICAL_NODE_GAP);
        const ownerDecision = decisionById.get(action.decisionId) ?? null;
        const supportDecision = action.supportsDecisionId
          ? (decisionById.get(action.supportsDecisionId) ?? null)
          : null;

        nodes.push({
          id: `action:${action.actionId}`,
          type: "relation",
          position: { x: blockX + EXEC_COLUMN_X, y },
          data: { kind: "action", action, ownerDecision, supportDecision },
        });

        edges.push({
          id: `edge:decision-to-exec:${action.actionId}`,
          source: `decision:${block.decision.decisionId}`,
          sourceHandle: `out-own-${idx}`,
          target: `action:${action.actionId}`,
          targetHandle: "in-own",
          type: "orthogonal",
          data: { kind: "flow", lane: idx },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
          style: { stroke: "#64748b", strokeWidth: 2 },
        });

        if (
          action.supportsDecisionId &&
          action.supportsDecisionId !== action.decisionId &&
          decisionById.has(action.supportsDecisionId)
        ) {
          const supportLane = supportLaneByActionId.get(action.actionId) ?? 0;
          const handleLane = Math.min(supportLane, SUPPORT_SOURCE_HANDLE_PERCENTS.length - 1);
          edges.push({
            id: `edge:exec-support:${action.actionId}`,
            source: `action:${action.actionId}`,
            sourceHandle: `out-support-left-${handleLane}`,
            target: `decision:${action.supportsDecisionId}`,
            targetHandle: `in-support-${supportLane}`,
            type: "orthogonal",
            data: { kind: "support", lane: supportLane },
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#0891b2" },
            style: { stroke: "#0891b2", strokeWidth: 2.5, strokeDasharray: "8 4" },
          });
        }
      });

      if (block !== blocksInLevel[blocksInLevel.length - 1]) {
        levelCursorY += block.blockHeight + SAME_LEVEL_BLOCK_GAP;
      } else {
        levelCursorY += block.blockHeight;
      }
    });

    currentLevelY = levelCursorY + VERTICAL_LEVEL_GAP;
  });

  return { nodes, edges };
}

export function DecisionRelationFlow({ projectId }: { projectId: string }) {
  const { snapshot, loading, error } = useDemoProjectSnapshot(projectId);
  const decisions = useMemo(() => snapshot?.decisions ?? [], [snapshot?.decisions]);
  const actions = useMemo(() => snapshot?.actions ?? [], [snapshot?.actions]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    decisions[0] ? `decision:${decisions[0].decisionId}` : null,
  );

  const { nodes, edges } = useMemo(() => {
    if (decisions.length === 0) return { nodes: [], edges: [] };
    return buildCustomLayout(decisions, actions);
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

  const { highlightedNodes, highlightedEdges } = useMemo(() => {
    if (!activeSelectedNodeId) {
      return { highlightedNodes: nodes, highlightedEdges: edges };
    }

    const emphasizedNodeIds = new Set<string>([activeSelectedNodeId]);
    const emphasizedEdgeIds = new Set<string>();

    edges.forEach((edge) => {
      if (edge.source === activeSelectedNodeId || edge.target === activeSelectedNodeId) {
        emphasizedEdgeIds.add(edge.id);
        emphasizedNodeIds.add(edge.source);
        emphasizedNodeIds.add(edge.target);
      }
    });

    const nextNodes = nodes.map((node) => {
      const isPrimary = node.id === activeSelectedNodeId;
      const isEmphasized = emphasizedNodeIds.has(node.id);
      const opacity = isEmphasized ? 1 : 0.16;
      const grayscale = isEmphasized ? "grayscale(0)" : "grayscale(0.28)";
      const nodeStyle: CSSProperties = {
        ...(node.style ?? {}),
        opacity,
        filter: grayscale,
        zIndex: isPrimary ? 30 : isEmphasized ? 20 : 1,
      };

      return {
        ...node,
        selected: isPrimary,
        style: nodeStyle,
      };
    });

    const nextEdges = edges.map((edge) => {
      const isEmphasized = emphasizedEdgeIds.has(edge.id);
      const baseStyle = edge.style ?? {};
      const baseStrokeWidth =
        typeof baseStyle.strokeWidth === "number" ? baseStyle.strokeWidth : 2;
      const edgeStyle: CSSProperties = {
        ...baseStyle,
        opacity: isEmphasized ? 1 : 0.14,
        strokeWidth: isEmphasized ? baseStrokeWidth + 0.8 : 1.2,
      };

      return {
        ...edge,
        animated: isEmphasized ? edge.animated : false,
        style: edgeStyle,
        zIndex: isEmphasized ? 20 : 1,
      };
    });

    return { highlightedNodes: nextNodes, highlightedEdges: nextEdges };
  }, [activeSelectedNodeId, edges, nodes]);

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
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-8 p-0">
        <div className="border-b border-neutral-200 px-4 py-3">
          <CardTitle>決裁とアクションの関連図</CardTitle>
          <CardDescription className="mt-1">
            時系列レベルごとに縦配置。各決裁ブロックは「準備→決裁→実行」の順。支援関係は点線で表示。
          </CardDescription>
        </div>
        <div style={{ height: 720 }} className="h-[720px]">
          <ReactFlow
            nodes={highlightedNodes}
            edges={highlightedEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.16, minZoom: 0.5, maxZoom: 1.2, duration: 300 }}
            minZoom={0.35}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          >
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => (node.id.startsWith("decision:") ? "#3b82f6" : "#06b6d4")}
              nodeStrokeColor="#cbd5e1"
              nodeBorderRadius={6}
              nodeStrokeWidth={3}
              maskColor="rgba(100, 116, 139, 0.2)"
              style={{ 
                backgroundColor: "#f1f5f9",
                border: "2px solid #cbd5e1",
              }}
            />
            <Controls />
            <Background gap={16} color="#e5e7eb" />
          </ReactFlow>
        </div>
      </Card>

      <Card className="col-span-4 space-y-3">
        <CardTitle>詳細サイドパネル</CardTitle>
        {!selectedData ? (
          <p className="text-sm text-neutral-600">ノードを選択すると詳細を表示します。</p>
        ) : selectedData.kind === "decision" ? (
          <>
            <p className="text-xs text-neutral-500">Decision</p>
            <p className="text-sm font-semibold text-neutral-900">{selectedData.decision.title}</p>
            <StatusChip status={selectedData.decision.status} />
            <p className="text-xs text-neutral-600">{selectedData.decision.summary}</p>
            <div className="rounded-[10px] border border-neutral-200 p-2 text-xs text-neutral-700">
              <p>決裁者: {selectedData.decision.owner || "未設定"}</p>
              <p>期限: {selectedData.decision.dueAt?.slice(0, 10) || "未設定"}</p>
              <p>紐づくExec: {selectedData.execCount}</p>
              <p>支援Action: {selectedData.supporterActionCount}</p>
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
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-neutral-500">Action</p>
            <p className="text-sm font-semibold text-neutral-900">{selectedData.action.title}</p>
            <div className="flex flex-wrap gap-1">
              <Badge>{selectedData.action.type}</Badge>
              <Badge className={actionStatusTone(selectedData.action.status)}>
                {actionStatusLabels[selectedData.action.status]}
              </Badge>
            </div>
            <div className="rounded-[10px] border border-neutral-200 p-2 text-xs text-neutral-700">
              <p>担当: {selectedData.action.assignee || "未設定"}</p>
              <p>期限: {selectedData.action.dueAt?.slice(0, 10) || "未設定"}</p>
              <p>紐づく決裁: {selectedData.ownerDecision?.title || selectedData.action.decisionId}</p>
              <p>
                支援対象:{" "}
                {selectedData.supportDecision?.title ||
                  (selectedData.action.supportsDecisionId
                    ? selectedData.action.supportsDecisionId
                    : "なし")}
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
