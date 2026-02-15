import uiConfig from "@/data/ui-config.json";

export type DecisionStatus = "NEEDS_INFO" | "READY_TO_DECIDE" | "DECIDED" | "REOPEN";
export type MeetingStatus = "ANALYZING" | "DONE" | "FAILED";
export type ActionStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";

export type Project = {
  projectId: string;
  name: string;
  description: string;
  undecided: number;
  ready: number;
  overdue: number;
  missingOwner: number;
  nextMeetingAt: string;
};

export type Decision = {
  decisionId: string;
  projectId: string;
  title: string;
  summary: string;
  tag: string;
  status: DecisionStatus;
  owner?: string;
  dueAt?: string;
  meetingTitle?: string;
  options?: DecisionOption[];
  priority: "高" | "中" | "低";
  readiness: number;
};

export type Meeting = {
  meetingId: string;
  projectId: string;
  title: string;
  heldAt: string;
  participants: string[];
  status: MeetingStatus;
  extractedDecisionIds: string[];
};

export type Action = {
  actionId: string;
  decisionId: string;
  projectId: string;
  title: string;
  type: "Prep" | "Exec";
  supportsDecisionId?: string;
  assignee?: string;
  dueAt?: string;
  status: ActionStatus;
  note?: string;
};

export type MissingFieldKey =
  | "owner"
  | "dueAt"
  | "criteria"
  | "options"
  | "assignee"
  | "definitionOfDone"
  | "blockedReason";

export type QuestionSource = "agent" | "user";
export type QuestionTargetType = "DECISION" | "ACTION";
export type QuestionStatus = "OPEN" | "ANSWERED";

export type InsufficientQuestion = {
  questionId: string;
  projectId: string;
  decisionId: string;
  actionId?: string;
  targetType: QuestionTargetType;
  source: QuestionSource;
  title: string;
  prompt: string;
  missingFields: MissingFieldKey[];
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: QuestionStatus;
  createdAt: string;
  resolvedAt?: string;
};

export type ChatMessage = {
  messageId: string;
  threadId: string;
  projectId: string;
  decisionId: string;
  actionId?: string;
  questionId?: string;
  sender: QuestionSource;
  kind: "QUESTION" | "ANSWER" | "NOTE";
  text: string;
  createdAt: string;
};

export type SearchResult = {
  id: string;
  type: "decision" | "meeting" | "action";
  title: string;
  subtitle: string;
  href: string;
};

export type DecisionOption = {
  id: string;
  label: string;
  merit: string;
  demerit: string;
  note: string;
};

export type DecisionDetailDefaults = {
  options: DecisionOption[];
  selectedOptionIds: string[];
  conclusion: string;
  prosCons: string;
  assumptions: string;
  reopenTrigger: string;
  newOptionLabel: string;
};

export type MembersDefault = {
  name: string;
  role: string;
  status: string;
};

export const missingFieldLabels = uiConfig.missingFieldLabels as Record<
  MissingFieldKey,
  string
>;

export const decisionStatusLabels = uiConfig.decisionStatusLabels as Record<
  DecisionStatus,
  string
>;

export const meetingStatusLabels = uiConfig.meetingStatusLabels as Record<
  MeetingStatus,
  string
>;

export const actionStatusLabels = uiConfig.actionStatusLabels as Record<
  ActionStatus,
  string
>;

export const decisionStatusOrder = uiConfig.decisionStatusOrder as DecisionStatus[];
export const actionStatusOrder = uiConfig.actionStatusOrder as ActionStatus[];

export const projectCreationDefaults = uiConfig.projectCreationDefaults as {
  description: string;
  nextMeetingAt: string;
};

export const meetingFormDefaults = uiConfig.meetingFormDefaults as {
  participants: string;
};

export const membersDefaults = uiConfig.membersDefaults as MembersDefault[];

export const decisionDetailDefaults = uiConfig.decisionDetailDefaults as DecisionDetailDefaults;

export const execDefaults = uiConfig.execDefaults as {
  overdueReferenceAt: string;
};

export function getMissingFieldLabel(field: MissingFieldKey) {
  return missingFieldLabels[field];
}

export function getQuestionTargetPath(
  question: InsufficientQuestion,
  decisions: Decision[],
  actions: Action[],
) {
  const decision = decisions.find((item) => item.decisionId === question.decisionId);
  if (question.targetType === "DECISION") {
    return `決裁: ${decision?.title ?? question.decisionId}`;
  }

  const action = actions.find((item) => item.actionId === question.actionId);
  return `決裁: ${decision?.title ?? question.decisionId} > アクション: ${action?.title ?? question.actionId}`;
}

export function searchProjectItems(
  projectId: string,
  query: string,
  decisions: Decision[],
  meetings: Meeting[],
  actions: Action[],
): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const decisionItems = decisions
    .filter((item) => item.title.includes(q) || item.summary.includes(q))
    .map((item) => ({
      id: item.decisionId,
      type: "decision" as const,
      title: item.title,
      subtitle: `${decisionStatusLabels[item.status]} / ${item.owner || "決裁者未設定"}`,
      href: `/p/${projectId}/decisions/${item.decisionId}`,
    }));

  const meetingItems = meetings
    .filter((item) => item.title.includes(q))
    .map((item) => ({
      id: item.meetingId,
      type: "meeting" as const,
      title: item.title,
      subtitle: `${meetingStatusLabels[item.status]} / ${item.heldAt.slice(0, 10)}`,
      href: `/p/${projectId}/meetings/${item.meetingId}`,
    }));

  const actionItems = actions
    .filter((item) => item.title.includes(q))
    .map((item) => ({
      id: item.actionId,
      type: "action" as const,
      title: item.title,
      subtitle: `${actionStatusLabels[item.status]} / ${item.assignee || "担当未設定"}`,
      href: `/p/${projectId}/decisions/${item.decisionId}`,
    }));

  return [...decisionItems, ...meetingItems, ...actionItems].slice(0, 8);
}
