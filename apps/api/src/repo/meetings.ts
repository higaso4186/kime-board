import { Meeting } from "@/shared";
import { nowIso, refs } from "../lib/firestore";
import { newMeetingId, newRunId } from "../lib/id";
import { recomputeProjectCounters } from "./projects";

const checksum = (text: string) => Buffer.from(text).toString("base64url").slice(0, 16);

export const createMeeting = async (params: {
  projectId: string;
  title: string;
  heldAt?: string;
  participants?: string[];
  sourceType: "PASTE" | "NOTION" | "TLDV" | "WEBHOOK" | "API";
  rawText: string;
}) => {
  const meetingId = newMeetingId();
  const now = nowIso();
  const doc = Meeting.parse({
    meetingId,
    projectId: params.projectId,
    title: params.title,
    heldAt: params.heldAt,
    participants: params.participants,
    source: { type: params.sourceType },
    raw: { storage: "FIRESTORE", text: params.rawText, checksum: checksum(params.rawText) },
    status: "ANALYZING",
    extracted: { decisionIds: [] },
    agent: { idempotencyKey: `${meetingId}:${checksum(params.rawText)}` },
    createdAt: now,
    updatedAt: now,
  });

  await refs.meeting(params.projectId, meetingId).set(doc);
  await recomputeProjectCounters(params.projectId);
  return { meetingId, status: "ANALYZING" as const };
};

export const getMeeting = async (projectId: string, meetingId: string) => {
  const snap = await refs.meeting(projectId, meetingId).get();
  if (!snap.exists) return null;
  return Meeting.parse(snap.data());
};

export const patchMeeting = async (projectId: string, meetingId: string, patch: Record<string, unknown>) => {
  await refs.meeting(projectId, meetingId).set({ ...patch, updatedAt: nowIso() }, { merge: true });
  await recomputeProjectCounters(projectId);
  return getMeeting(projectId, meetingId);
};

export const appendMeetingLog = async (projectId: string, meetingId: string, line: string) => {
  const runId = newRunId();
  await refs
    .meetingAgentRuns(projectId, meetingId)
    .doc(runId)
    .set({
      runId,
      projectId,
      meetingId,
      status: "RUNNING",
      startedAt: nowIso(),
      endedAt: undefined,
      logLines: [line],
    });
  return { runId };
};
