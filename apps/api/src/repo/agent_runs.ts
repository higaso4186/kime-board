import { nowIso, refs } from "../lib/firestore";
import { newRunId } from "../lib/id";

export type AgentRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export const startRun = async (input: {
  projectId: string;
  meetingId: string;
  kind: string;
  idempotencyKey?: string;
}) => {
  const runId = newRunId();
  await refs.meetingAgentRuns(input.projectId, input.meetingId).doc(runId).set({
    runId,
    projectId: input.projectId,
    meetingId: input.meetingId,
    kind: input.kind,
    status: "RUNNING" as AgentRunStatus,
    idempotencyKey: input.idempotencyKey,
    startedAt: nowIso(),
    endedAt: undefined,
    logLines: [],
  });
  return { runId };
};

export const finishRun = async (
  projectId: string,
  meetingId: string,
  runId: string,
  status: AgentRunStatus,
  result?: unknown,
  error?: unknown
) => {
  await refs
    .meetingAgentRuns(projectId, meetingId)
    .doc(runId)
    .set(
      {
        status,
        result: result ?? null,
        error: error ?? null,
        endedAt: nowIso(),
      },
      { merge: true }
    );
};
