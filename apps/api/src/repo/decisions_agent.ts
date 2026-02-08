import { Decision, computeDecisionReadiness } from "@/shared";
import { nowIso, refs } from "../lib/firestore";
import { newDecisionId } from "../lib/id";
import { recomputeProjectCounters } from "./projects";

export type AgentDecisionPayload = {
  decisionId?: string;
  title: string;
  summary?: string;
  tags?: string[];
  ownerDisplayName?: string;
  dueAt?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  options?: Array<{ label: string; description?: string; recommended?: boolean }>;
  criteria?: string[];
  assumptions?: string[];
  reopenTriggers?: string[];
  rationale?: { pros?: string[]; cons?: string[]; conditions?: string[] };
};

export const upsertDecisionsFromAgent = async (projectId: string, meetingId: string, items: AgentDecisionPayload[]) => {
  const createdOrUpdated: string[] = [];

  for (const item of items) {
    const decisionId = item.decisionId || newDecisionId();
    const existingSnap = await refs.decision(projectId, decisionId).get();
    const existing = existingSnap.exists ? (existingSnap.data() as any) : null;

    const merged: any = {
      ...(existing ?? {}),
      decisionId,
      projectId,
      title: item.title,
      summary: item.summary ?? existing?.summary,
      tags: item.tags ?? existing?.tags,
      owner: item.ownerDisplayName
        ? { ...(existing?.owner ?? {}), displayName: item.ownerDisplayName }
        : existing?.owner,
      dueAt: item.dueAt ?? existing?.dueAt,
      priority: item.priority ?? existing?.priority ?? "MEDIUM",
      options: (item.options ?? existing?.options ?? []).map((o: any, idx: number) => ({
        id: o.id ?? `opt_${idx + 1}`,
        label: o.label,
        description: o.description,
        recommended: o.recommended,
      })),
      criteria: item.criteria ?? existing?.criteria,
      assumptions: item.assumptions ?? existing?.assumptions ?? [],
      reopenTriggers: item.reopenTriggers ?? existing?.reopenTriggers ?? [],
      rationale: {
        pros: item.rationale?.pros ?? existing?.rationale?.pros ?? [],
        cons: item.rationale?.cons ?? existing?.rationale?.cons ?? [],
        conditions: item.rationale?.conditions ?? existing?.rationale?.conditions ?? [],
      },
      linkage: {
        ...(existing?.linkage ?? { linkedMeetingIds: [] }),
        linkedMeetingIds: Array.from(new Set([...(existing?.linkage?.linkedMeetingIds ?? []), meetingId])),
        lastMentionedAt: nowIso(),
      },
      updatedAt: nowIso(),
      createdAt: existing?.createdAt ?? nowIso(),
    };

    const readiness = computeDecisionReadiness(merged);
    merged.completeness = {
      ...(merged.completeness ?? {}),
      score: readiness.completenessScore,
      missingFields: readiness.missingFields,
      lastEvaluatedAt: nowIso(),
    };
    merged.ownerMissing = readiness.derivedFlags.ownerMissing;
    merged.dueMissing = readiness.derivedFlags.dueMissing;
    merged.criteriaMissing = readiness.derivedFlags.criteriaMissing;
    merged.optionsCount = merged.options?.length ?? 0;
    merged.linkedMeetingCount = merged.linkage?.linkedMeetingIds?.length ?? 0;

    if (!merged.status) merged.status = "NEEDS_INFO";
    if (merged.status === "NEEDS_INFO" && readiness.completenessScore >= 80) {
      merged.status = "READY_TO_DECIDE";
    }

    const parsed = Decision.parse(merged);
    await refs.decision(projectId, decisionId).set(parsed);
    createdOrUpdated.push(decisionId);
  }

  await recomputeProjectCounters(projectId);
  return createdOrUpdated;
};
