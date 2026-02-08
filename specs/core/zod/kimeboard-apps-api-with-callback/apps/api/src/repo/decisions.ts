import { db, COL, nowIso } from "../lib/firestore";
import { Decision, DecisionStatus, computeDecisionReadiness } from "@kimeboard/shared";
import { newDecisionId } from "../lib/id";

export const createDecision = async (projectId: string, input: { title: string; summary?: string; tags?: string[] }) => {
  const decisionId = newDecisionId();
  const doc = Decision.parse({
    decisionId,
    projectId,
    title: input.title,
    summary: input.summary,
    tags: input.tags,
    status: "NEEDS_INFO",
    priority: "MEDIUM",
    options: [],
    assumptions: [],
    reopenTriggers: [],
    rationale: { pros: [], cons: [], conditions: [] },
    completeness: { score: 0, missingFields: [] },
    linkage: { linkedMeetingIds: [] },
    merge: { mergeStatus: "NONE", requiresHumanApproval: true, mergeCandidates: [] },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  const readiness = computeDecisionReadiness(doc);
  doc.completeness.score = readiness.completenessScore;
  doc.completeness.missingFields = readiness.missingFields;
  doc.completeness.lastEvaluatedAt = nowIso();

  await db.collection(COL.decisions).doc(decisionId).set(doc);
  return { decisionId, decision: doc };
};

export const getDecision = async (decisionId: string) => {
  const snap = await db.collection(COL.decisions).doc(decisionId).get();
  if (!snap.exists) return null;
  return Decision.parse(snap.data());
};

export const listDecisionsByProject = async (projectId: string, opts: { status?: string; limit?: number } = {}) => {
  let q = db.collection(COL.decisions).where("projectId", "==", projectId);
  if (opts.status) q = q.where("status", "==", opts.status);
  q = q.orderBy("updatedAt", "desc").limit(opts.limit ?? 20);
  const snaps = await q.get();
  return snaps.docs.map(d => Decision.parse(d.data()));
};

export const patchDecision = async (decisionId: string, patch: Record<string, any>) => {
  // merge patch and recompute readiness
  const cur = await getDecision(decisionId);
  if (!cur) return null;
  const merged = Decision.parse({ ...cur, ...patch, updatedAt: nowIso() });
  const readiness = computeDecisionReadiness(merged);
  merged.completeness.score = readiness.completenessScore;
  merged.completeness.missingFields = readiness.missingFields;
  merged.completeness.lastEvaluatedAt = nowIso();

  await db.collection(COL.decisions).doc(decisionId).set(merged, { merge: false });
  return merged;
};

export const linkMeetingToDecision = async (decisionId: string, meetingId: string) => {
  const cur = await getDecision(decisionId);
  if (!cur) return null;
  const linked = new Set(cur.linkage.linkedMeetingIds ?? []);
  linked.add(meetingId);
  return patchDecision(decisionId, { linkage: { ...cur.linkage, linkedMeetingIds: Array.from(linked), lastMentionedAt: nowIso() } });
};
