import { z } from "zod";

export const DecisionStatus = z.enum([
  "NEEDS_INFO",
  "READY_TO_DECIDE",
  "DECIDED",
  "REOPEN",
  "ARCHIVED",
]);
export type DecisionStatus = z.infer<typeof DecisionStatus>;

export const MeetingStatus = z.enum(["DRAFT", "ANALYZING", "DONE", "FAILED"]);
export type MeetingStatus = z.infer<typeof MeetingStatus>;

export const ActionStatus = z.enum(["TODO", "DOING", "DONE", "BLOCKED"]);
export type ActionStatus = z.infer<typeof ActionStatus>;

export const ActionType = z.enum(["PREP", "EXEC"]);
export type ActionType = z.infer<typeof ActionType>;

export const ChatFormat = z.enum(["TEXT", "QUESTION_SET", "ANSWER_SET"]);
export type ChatFormat = z.infer<typeof ChatFormat>;

export const NotificationEventType = z.enum([
  "DECISION_NEEDS_INFO",
  "DECISION_READY_TO_DECIDE",
  "DECISION_DECIDED",
  "AGENT_RUN_FAILED",
  "DRAFT_ACTIONS_CREATED",
]);
export type NotificationEventType = z.infer<typeof NotificationEventType>;
