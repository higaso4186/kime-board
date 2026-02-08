import { Project } from "@/shared";
import { db, nowIso, refs, COL } from "../lib/firestore";
import { newProjectId } from "../lib/id";

const toMillis = (iso?: string) => (iso ? Date.parse(iso) || 0 : 0);

export const createProject = async (input: { name: string; description?: string }) => {
  const projectId = newProjectId();
  const now = nowIso();
  const doc = Project.parse({
    projectId,
    name: input.name,
    description: input.description,
    status: "ACTIVE",
    counters: {
      decisions_total: 0,
      decisions_open: 0,
      decisions_needs_info: 0,
      decisions_ready: 0,
      decisions_reopen: 0,
      decisions_owner_missing: 0,
      actions_overdue: 0,
      meetings_total: 0,
      meetings_analyzing: 0,
    },
    createdAt: now,
    updatedAt: now,
  });
  await refs.project(projectId).set(doc);
  return { projectId };
};

export const getProject = async (projectId: string) => {
  const snap = await refs.project(projectId).get();
  if (!snap.exists) return null;
  return Project.parse(snap.data());
};

export const listProjects = async () => {
  const snap = await refs.projects().orderBy("updatedAt", "desc").limit(200).get();
  return snap.docs.map((d) => Project.parse(d.data()));
};

export const recomputeProjectCounters = async (projectId: string) => {
  const [decisionSnap, meetingSnap, actionSnap] = await Promise.all([
    refs.decisions(projectId).get(),
    refs.meetings(projectId).get(),
    db.collectionGroup(COL.actions).where("projectId", "==", projectId).get(),
  ]);

  let decisionsTotal = 0;
  let decisionsNeedsInfo = 0;
  let decisionsReady = 0;
  let decisionsReopen = 0;
  let decisionsOwnerMissing = 0;
  let lastDecisionUpdated = 0;

  for (const d of decisionSnap.docs.map((x) => x.data() as any)) {
    if (d.softDelete?.isDeleted) continue;
    decisionsTotal += 1;
    if (d.status === "NEEDS_INFO") decisionsNeedsInfo += 1;
    if (d.status === "READY_TO_DECIDE") decisionsReady += 1;
    if (d.status === "REOPEN") decisionsReopen += 1;
    const ownerMissing = d.ownerMissing ?? !(d.owner && (d.owner.userId || d.owner.displayName));
    if (ownerMissing) decisionsOwnerMissing += 1;
    lastDecisionUpdated = Math.max(lastDecisionUpdated, toMillis(d.updatedAt));
  }

  let meetingsTotal = 0;
  let meetingsAnalyzing = 0;
  let lastMeetingAt = 0;

  for (const m of meetingSnap.docs.map((x) => x.data() as any)) {
    if (m.softDelete?.isDeleted) continue;
    meetingsTotal += 1;
    if (m.status === "ANALYZING") meetingsAnalyzing += 1;
    lastMeetingAt = Math.max(lastMeetingAt, toMillis(m.heldAt) || toMillis(m.updatedAt));
  }

  const nowMs = Date.now();
  let overdueActions = 0;
  for (const a of actionSnap.docs.map((x) => x.data() as any)) {
    if (a.softDelete?.isDeleted) continue;
    if (!a.dueAt || a.status === "DONE") continue;
    if (Date.parse(a.dueAt) < nowMs) overdueActions += 1;
  }

  const counters = {
    decisions_total: decisionsTotal,
    decisions_open: decisionsNeedsInfo + decisionsReady + decisionsReopen,
    decisions_needs_info: decisionsNeedsInfo,
    decisions_ready: decisionsReady,
    decisions_reopen: decisionsReopen,
    decisions_owner_missing: decisionsOwnerMissing,
    actions_overdue: overdueActions,
    meetings_total: meetingsTotal,
    meetings_analyzing: meetingsAnalyzing,
  };

  await refs.project(projectId).set(
    {
      counters,
      lastActivityAt: nowIso(),
      lastMeetingAt: lastMeetingAt ? new Date(lastMeetingAt).toISOString() : undefined,
      lastDecisionUpdatedAt: lastDecisionUpdated ? new Date(lastDecisionUpdated).toISOString() : undefined,
      updatedAt: nowIso(),
    },
    { merge: true }
  );
};
