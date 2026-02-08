import { db, COL, nowIso } from "../lib/firestore";
import { Meeting } from "@kimeboard/shared";
import { newMeetingId } from "../lib/id";

export const createMeeting = async (params: {
  projectId: string;
  title: string;
  heldAt?: string;
  participants?: string[];
  sourceType: "PASTE" | "NOTION" | "TLDV" | "WEBHOOK" | "API";
  rawText: string;
}) => {
  const meetingId = newMeetingId();
  const doc = {
    meetingId,
    projectId: params.projectId,
    title: params.title,
    heldAt: params.heldAt,
    participants: params.participants,
    source: { type: params.sourceType },
    raw: { storage: "FIRESTORE", text: params.rawText, checksum: undefined },
    status: "ANALYZING",
    extracted: { decisionIds: [] },
    agent: { idempotencyKey: meetingId },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  Meeting.parse(doc);
  await db.collection(COL.meetings).doc(meetingId).set(doc);
  return { meetingId, status: "ANALYZING" as const };
};

export const getMeeting = async (meetingId: string) => {
  const snap = await db.collection(COL.meetings).doc(meetingId).get();
  if (!snap.exists) return null;
  return Meeting.parse(snap.data());
};

export const patchMeeting = async (meetingId: string, patch: Record<string, any>) => {
  await db.collection(COL.meetings).doc(meetingId).set({ ...patch, updatedAt: nowIso() }, { merge: true });
  return getMeeting(meetingId);
};
