import { z } from "zod";
import { MeetingStatus } from "../constants/status";

export const MeetingSource = z.object({
  type: z.enum(["PASTE", "NOTION", "TLDV", "WEBHOOK", "API"]),
  connectorId: z.string().optional(),
});

export const MeetingRaw = z.object({
  storage: z.enum(["FIRESTORE", "GCS"]).default("FIRESTORE"),
  text: z.string().optional(),
  gcsUri: z.string().optional(),
  checksum: z.string().optional(),
});

export const MeetingAgent = z
  .object({
    lastRunId: z.string().optional(),
    lastRunStatus: z.enum(["RUNNING", "SUCCEEDED", "FAILED"]).optional(),
    idempotencyKey: z.string().optional(),
  })
  .partial();

export const MeetingExtracted = z
  .object({
    decisionIds: z.array(z.string()).optional(),
    mergeCandidates: z.array(z.any()).optional(),
  })
  .partial();

export const Meeting = z.object({
  meetingId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  heldAt: z.string().datetime().optional(),
  participants: z.array(z.string()).optional(),
  source: MeetingSource,
  raw: MeetingRaw,
  status: MeetingStatus.default("DRAFT"),
  extracted: MeetingExtracted.optional(),
  agent: MeetingAgent.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Meeting = z.infer<typeof Meeting>;
