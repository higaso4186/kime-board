import { Decision, computeDecisionReadiness } from "@kimeboard/shared";
import { db, COL, nowIso } from "../lib/firestore";
import { newDecisionId } from "../lib/id";

/**
 * Agent extracted decision payload (MVP):
 * - If decisionId exists, patch that decision
 * - Else create new decision with generated id
 */
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
    const existingSnap = await db.collection(COL.decisions).doc(decisionId).get();
    const existing = existingSnap.exists ? (existingSnap.data() as any) : null;

    const merged = Decision.parse({
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
    });

    const readiness = computeDecisionReadiness(merged);
    merged.completeness.score = readiness.completenessScore;
    merged.completeness.missingFields = readiness.missingFields;
    merged.completeness.lastEvaluatedAt = nowIso();

    // update status automatically if becomes ready
    if (merged.status === "NEEDS_INFO" && readiness.completenessScore >= 80) {
      // keep REOPEN/DECIDED/ARCHIVED as-is
      merged.status = "READY_TO_DECIDE";
    }

    await db.collection(COL.decisions).doc(decisionId).set(merged, { merge: false });
    createdOrUpdated.push(decisionId);
  }

  return createdOrUpdated;
};
