import { readFile } from "node:fs/promises";
import path from "node:path";

type DemoPriority = "HIGH" | "MEDIUM" | "LOW";

export type DemoProject = {
  projectId: string;
  name: string;
  description: string;
  undecided: number;
  ready: number;
  overdue: number;
  missingOwner: number;
  nextMeetingAt: string;
};

export type DemoDecisionStatus = "NEEDS_INFO" | "READY_TO_DECIDE" | "DECIDED" | "REOPEN";
export type DemoMeetingStatus = "ANALYZING" | "DONE" | "FAILED";
export type DemoActionStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";
export type DemoQuestionTargetType = "DECISION" | "ACTION";
export type DemoQuestionSource = "agent" | "user";
export type DemoQuestionStatus = "OPEN" | "ANSWERED";
export type DemoMissingFieldKey =
  | "owner"
  | "dueAt"
  | "criteria"
  | "options"
  | "assignee"
  | "definitionOfDone"
  | "blockedReason";

export type DemoDecision = {
  decisionId: string;
  projectId: string;
  title: string;
  summary: string;
  tag: string;
  status: DemoDecisionStatus;
  owner?: string;
  dueAt?: string;
  meetingTitle?: string;
  options?: Array<{
    id: string;
    label: string;
    merit?: string;
    demerit?: string;
    note?: string;
  }>;
  priority: "高" | "中" | "低";
  readiness: number;
};

export type DemoMeeting = {
  meetingId: string;
  projectId: string;
  title: string;
  heldAt: string;
  participants: string[];
  status: DemoMeetingStatus;
  extractedDecisionIds: string[];
};

export type DemoAction = {
  actionId: string;
  decisionId: string;
  projectId: string;
  title: string;
  type: "Prep" | "Exec";
  supportsDecisionId?: string;
  assignee?: string;
  dueAt?: string;
  status: DemoActionStatus;
  note?: string;
};

export type DemoInsufficientQuestion = {
  questionId: string;
  projectId: string;
  decisionId: string;
  actionId?: string;
  targetType: DemoQuestionTargetType;
  source: DemoQuestionSource;
  title: string;
  prompt: string;
  missingFields: DemoMissingFieldKey[];
  priority: DemoPriority;
  status: DemoQuestionStatus;
  createdAt: string;
  resolvedAt?: string;
};

export type DemoChatMessage = {
  messageId: string;
  threadId: string;
  projectId: string;
  decisionId: string;
  actionId?: string;
  questionId?: string;
  sender: DemoQuestionSource;
  kind: "QUESTION" | "ANSWER" | "NOTE";
  text: string;
  createdAt: string;
};

export type DemoProjectSnapshot = {
  project: DemoProject;
  decisions: DemoDecision[];
  meetings: DemoMeeting[];
  actions: DemoAction[];
  insufficientQuestions: DemoInsufficientQuestion[];
  chatMessages: DemoChatMessage[];
  agentLogs: string[];
};

const DATA_DIR = path.join(process.cwd(), "src", "data", "demo");

async function readJsonFile<T>(fileName: string): Promise<T> {
  const fullPath = path.join(DATA_DIR, fileName);
  const source = await readFile(fullPath, "utf-8");
  // Support UTF-8 BOM files created on Windows editors/PowerShell.
  const normalized = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  return JSON.parse(normalized) as T;
}

type DemoDataStore = {
  projects: DemoProject[];
  decisions: DemoDecision[];
  meetings: DemoMeeting[];
  actions: DemoAction[];
  insufficientQuestions: DemoInsufficientQuestion[];
  chatMessages: DemoChatMessage[];
  agentLogs: string[];
};

export async function loadDemoStore(): Promise<DemoDataStore> {
  const [projects, decisions, meetings, actions, insufficientQuestions, chatMessages, agentLogs] =
    await Promise.all([
      readJsonFile<DemoProject[]>("projects.json"),
      readJsonFile<DemoDecision[]>("decisions.json"),
      readJsonFile<DemoMeeting[]>("meetings.json"),
      readJsonFile<DemoAction[]>("actions.json"),
      readJsonFile<DemoInsufficientQuestion[]>("insufficient-questions.json"),
      readJsonFile<DemoChatMessage[]>("chat-messages.json"),
      readJsonFile<string[]>("agent-logs.json"),
    ]);

  return {
    projects,
    decisions,
    meetings,
    actions,
    insufficientQuestions,
    chatMessages,
    agentLogs,
  };
}

export async function listDemoProjects(): Promise<DemoProject[]> {
  const { listDemoProjectsFromStore } = await import("./store");
  return listDemoProjectsFromStore();
}

export async function getDemoProjectSnapshot(
  projectId: string,
): Promise<DemoProjectSnapshot | null> {
  const { getDemoProjectSnapshotFromStore } = await import("./store");
  return getDemoProjectSnapshotFromStore(projectId);
}
