import { Decision, computeDecisionReadiness } from "@/shared";
import { nowIso, refs } from "../lib/firestore";
import { newDecisionId } from "../lib/id";
import { recomputeProjectCounters } from "./projects";

const enrichDerived = (d: any) => {
  const readiness = computeDecisionReadiness(d);
  d.completeness = {
    ...(d.completeness ?? {}),
    score: readiness.completenessScore,
    missingFields: readiness.missingFields,
    lastEvaluatedAt: nowIso(),
  };
  d.ownerMissing = readiness.derivedFlags.ownerMissing;
  d.dueMissing = readiness.derivedFlags.dueMissing;
  d.criteriaMissing = readiness.derivedFlags.criteriaMissing;
  d.optionsCount = d.options?.length ?? 0;
  d.linkedMeetingCount = d.linkage?.linkedMeetingIds?.length ?? 0;
  return d;
};

export const createDecision = async (projectId: string, input: { title: string; summary?: string; tags?: string[] }) => {
  const decisionId = newDecisionId();
  const now = nowIso();

  let doc: any = {
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
    audit: { version: 1, lastChangedFields: ["title"], lastChangeSummary: "created" },
    createdAt: now,
    updatedAt: now,
  };

  doc = enrichDerived(doc);
  doc = Decision.parse(doc);
  await refs.decision(projectId, decisionId).set(doc);
  await recomputeProjectCounters(projectId);
  return { decisionId, decision: doc };
};

export const getDecision = async (projectId: string, decisionId: string) => {
  const snap = await refs.decision(projectId, decisionId).get();
  if (!snap.exists) return null;
  return Decision.parse(snap.data());
};

export const listDecisionsByProject = async (
  projectId: string,
  opts: { status?: string; owner?: string; dueBefore?: string; limit?: number } = {}
) => {
  const snap = await refs.decisions(projectId).get();
  let decisions = snap.docs.map((d) => Decision.parse(d.data()));

  if (opts.status) {
    decisions = decisions.filter((d) => d.status === opts.status);
  }
  if (opts.owner) {
    decisions = decisions.filter((d) => d.owner?.userId === opts.owner || d.owner?.displayName === opts.owner);
  }
  if (opts.dueBefore) {
    const ts = Date.parse(opts.dueBefore);
    decisions = decisions.filter((d) => !!d.dueAt && Date.parse(d.dueAt) <= ts);
  }

  decisions.sort((a, b) => Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? ""));
  return decisions.slice(0, opts.limit ?? 20);
};

export const patchDecision = async (projectId: string, decisionId: string, patch: Record<string, any>) => {
  const cur = await getDecision(projectId, decisionId);
  if (!cur) return null;
  const now = nowIso();

  const nextAuditVersion = (cur as any).audit?.version ? (cur as any).audit.version + 1 : 2;
  let merged: any = {
    ...cur,
    ...patch,
    updatedAt: now,
    audit: {
      version: nextAuditVersion,
      lastChangedFields: Object.keys(patch),
      lastChangeSummary: "patched via api",
    },
  };

  merged = enrichDerived(merged);
  merged = Decision.parse(merged);
  await refs.decision(projectId, decisionId).set(merged);
  await recomputeProjectCounters(projectId);
  return merged;
};

export const linkMeetingToDecision = async (projectId: string, decisionId: string, meetingId: string) => {
  const cur = await getDecision(projectId, decisionId);
  if (!cur) return null;
  const linked = new Set(cur.linkage.linkedMeetingIds ?? []);
  linked.add(meetingId);
  return patchDecision(projectId, decisionId, {
    linkage: {
      ...cur.linkage,
      linkedMeetingIds: Array.from(linked),
      lastMentionedAt: nowIso(),
    },
  });
};
