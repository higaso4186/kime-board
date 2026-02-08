import { z } from "zod";
import { ChatFormat } from "../constants/status";

export const ChatChannel = z.enum(["IN_APP", "WEBHOOK", "EMAIL", "SLACK", "TEAMS"]);
export type ChatChannel = z.infer<typeof ChatChannel>;

export const ThreadScopeType = z.enum(["PROJECT", "DECISION", "ACTION"]);
export type ThreadScopeType = z.infer<typeof ThreadScopeType>;

export const Thread = z.object({
  threadId: z.string().min(1),
  projectId: z.string().min(1),
  scopeType: ThreadScopeType.default("DECISION"),
  scopeId: z.string().min(1),
  decisionId: z.string().optional(),
  actionId: z.string().optional(),
  channel: ChatChannel.default("IN_APP"),
  title: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  lastMessageAt: z.string().datetime().optional(),
});

export const SenderType = z.enum(["AGENT", "USER", "SYSTEM"]);
export type SenderType = z.infer<typeof SenderType>;

export const Question = z.object({
  qid: z.string().min(1),
  type: z.enum(["single_select", "multi_select", "date", "text"]),
  text: z.string().min(1),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  maps_to: z.object({
    targetType: z.enum(["DECISION", "ACTION"]),
    field: z.string().min(1),
  }),
});

export const Answer = z.object({
  qid: z.string().min(1),
  value: z.union([z.string(), z.array(z.string()), z.string().datetime()]),
});

export const MessageMetadata = z
  .object({
    questions: z.array(Question).optional(),
    answers: z.array(Answer).optional(),
    missingFields: z.array(z.string()).optional(),
    contextLabel: z.string().optional(),
  })
  .partial();

export const MessageRelatesTo = z.object({
  projectId: z.string().min(1),
  decisionId: z.string().optional(),
  actionId: z.string().optional(),
  meetingId: z.string().optional(),
});

export const Message = z.object({
  messageId: z.string().min(1),
  threadId: z.string().min(1),
  senderType: SenderType,
  format: ChatFormat,
  content: z.string(),
  metadata: MessageMetadata.optional(),
  relatesTo: MessageRelatesTo.optional(),
  createdAt: z.string().datetime().optional(),
  createdBy: z.string().optional(),
});
export type Thread = z.infer<typeof Thread>;
export type Message = z.infer<typeof Message>;
