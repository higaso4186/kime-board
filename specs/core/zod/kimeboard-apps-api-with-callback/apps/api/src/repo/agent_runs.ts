import { db, COL, nowIso } from "../lib/firestore";
import { newRunId } from "../lib/id";

export type AgentRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export const startRun = async (input: {
  projectId: string;
  kind: string;
  ref: { meetingId?: string; decisionId?: string; threadId?: string };
  idempotencyKey?: string;
}) => {
  const runId = newRunId();
  const doc = {
    runId,
    projectId: input.projectId,
    kind: input.kind,
    ref: input.ref,
    status: "RUNNING" as AgentRunStatus,
    idempotencyKey: input.idempotencyKey,
    startedAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.collection(COL.agentRuns).doc(runId).set(doc);
  return { runId };
};

export const finishRun = async (runId: string, status: AgentRunStatus, result?: any, error?: any) => {
  await db
    .collection(COL.agentRuns)
    .doc(runId)
    .set(
      {
        status,
        result: result ?? null,
        error: error ?? null,
        finishedAt: nowIso(),
        updatedAt: nowIso(),
      },
      { merge: true }
    );
};

export const upsertRunByIdempotency = async (idempotencyKey: string, patch: any) => {
  const q = await db.collection(COL.agentRuns).where("idempotencyKey", "==", idempotencyKey).limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0];
  await doc.ref.set({ ...patch, updatedAt: nowIso() }, { merge: true });
  return doc.id;
};
