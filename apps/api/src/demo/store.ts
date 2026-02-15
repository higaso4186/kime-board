/**
 * デモ用インメモリストア。
 * デモデータを処理するときは JSON ファイルを DB 代わりに初期ロードし、
 * 書込はメモリ上で保持する（プロセス終了でリセット）。
 * 本番モードではないため、永続化は行わない。
 */
import {
  loadDemoStore,
  type DemoAction,
  type DemoChatMessage,
  type DemoDecision,
  type DemoInsufficientQuestion,
  type DemoMeeting,
  type DemoProject,
  type DemoProjectSnapshot,
} from "./data";

let store: Awaited<ReturnType<typeof loadDemoStore>> | null = null;

async function ensureStore() {
  if (!store) {
    store = await loadDemoStore();
  }
  return store;
}

export async function getDemoStore() {
  return ensureStore();
}

function nextProjectId(projects: DemoProject[]): string {
  const nums = projects
    .map((p) => parseInt(p.projectId.replace(/^prj_0*/, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `prj_${String(next).padStart(2, "0")}`;
}

function nextDecisionId(decisions: DemoDecision[]): string {
  const nums = decisions
    .map((d) => parseInt(d.decisionId.replace(/^dcs_0*/, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `dcs_${String(next).padStart(2, "0")}`;
}

function nextMeetingId(meetings: DemoMeeting[]): string {
  const nums = meetings
    .map((m) => parseInt(m.meetingId.replace(/^mtg_0*/, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `mtg_${String(next).padStart(2, "0")}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export type CreateDecisionInput = {
  title: string;
  summary?: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type CreateMeetingInput = {
  title: string;
  heldAt?: string;
  participants?: string[];
  rawText: string;
};

export type PatchDecisionInput = {
  title?: string;
  status?: DemoDecision["status"];
  owner?: string;
  dueAt?: string | null;
};

export type PatchProjectInput = {
  name?: string;
  description?: string;
};

export async function createDemoDecision(
  projectId: string,
  input: CreateDecisionInput,
): Promise<DemoDecision> {
  const s = await ensureStore();
  const project = s.projects.find((p) => p.projectId === projectId);
  if (!project) throw new Error("Project not found");

  const decisionId = nextDecisionId(s.decisions);
  const decision: DemoDecision = {
    decisionId,
    projectId,
    title: input.title,
    summary: input.summary ?? "",
    tag: "",
    status: "NEEDS_INFO",
    priority: "中",
    readiness: 0,
  };
  s.decisions.unshift(decision);
  return decision;
}

export async function createDemoProject(input: CreateProjectInput): Promise<DemoProject> {
  const s = await ensureStore();
  const projectId = nextProjectId(s.projects);
  const project: DemoProject = {
    projectId,
    name: input.name,
    description: input.description ?? "",
    undecided: 0,
    ready: 0,
    overdue: 0,
    missingOwner: 0,
    nextMeetingAt: "1970-01-01T00:00:00.000Z",
  };
  s.projects.unshift(project);
  return project;
}

export async function createDemoMeeting(
  projectId: string,
  input: CreateMeetingInput,
): Promise<DemoMeeting> {
  const s = await ensureStore();
  const project = s.projects.find((p) => p.projectId === projectId);
  if (!project) throw new Error("Project not found");

  const meetingId = nextMeetingId(s.meetings);
  const heldAt = input.heldAt ?? nowIso();
  const meeting: DemoMeeting = {
    meetingId,
    projectId,
    title: input.title,
    heldAt: heldAt.includes("T") ? heldAt : `${heldAt}T00:00:00.000Z`,
    participants: input.participants ?? [],
    status: "DONE",
    extractedDecisionIds: [],
  };

  // 決裁管理プロダクトでは「決裁のない会議」を作らない前提。
  // デモでは会議作成時に最低1件の決裁を自動生成して必ず紐づける。
  const decisionId = nextDecisionId(s.decisions);
  const decision: DemoDecision = {
    decisionId,
    projectId,
    title: `${input.title} で決める事項`,
    summary: input.rawText.trim().slice(0, 80) || "会議メモから抽出した決裁候補です。",
    tag: "会議",
    status: "NEEDS_INFO",
    owner: "",
    dueAt: meeting.heldAt,
    meetingTitle: input.title,
    options: [
      {
        id: "opt_01",
        label: "案A（会議メモから抽出）",
        merit: "",
        demerit: "",
        note: "",
      },
      {
        id: "opt_02",
        label: "案B（会議メモから抽出）",
        merit: "",
        demerit: "",
        note: "",
      },
    ],
    priority: "中",
    readiness: 45,
  };
  s.decisions.unshift(decision);
  meeting.extractedDecisionIds = [decisionId];

  s.meetings.unshift(meeting);
  return meeting;
}

export async function patchDemoDecision(
  projectId: string,
  decisionId: string,
  input: PatchDecisionInput,
): Promise<DemoDecision | null> {
  const s = await ensureStore();
  const decision = s.decisions.find(
    (d) => d.projectId === projectId && d.decisionId === decisionId,
  );
  if (!decision) return null;

  if (input.title !== undefined) decision.title = input.title;
  if (input.status !== undefined) decision.status = input.status;
  if (input.owner !== undefined) decision.owner = input.owner;
  if (input.dueAt !== undefined) decision.dueAt = input.dueAt ?? undefined;
  return decision;
}

export async function patchDemoProject(
  projectId: string,
  input: PatchProjectInput,
): Promise<DemoProject | null> {
  const s = await ensureStore();
  const project = s.projects.find((p) => p.projectId === projectId);
  if (!project) return null;

  if (input.name !== undefined) project.name = input.name;
  if (input.description !== undefined) project.description = input.description;
  return project;
}

export async function listDemoProjectsFromStore(): Promise<DemoProject[]> {
  const s = await ensureStore();
  return [...s.projects];
}

export async function getDemoProjectSnapshotFromStore(
  projectId: string,
): Promise<DemoProjectSnapshot | null> {
  const s = await ensureStore();
  const project = s.projects.find((p) => p.projectId === projectId);
  if (!project) return null;

  return {
    project,
    decisions: s.decisions.filter((d) => d.projectId === projectId),
    meetings: s.meetings.filter((m) => m.projectId === projectId),
    actions: s.actions.filter((a) => a.projectId === projectId),
    insufficientQuestions: s.insufficientQuestions.filter((q) => q.projectId === projectId),
    chatMessages: s.chatMessages.filter((c) => c.projectId === projectId),
    agentLogs: s.agentLogs,
  };
}

// --- Chat ---

function nextActionId(actions: DemoAction[]): string {
  const nums = actions
    .map((a) => parseInt(a.actionId.replace(/^act_0*/, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `act_${String(next).padStart(2, "0")}`;
}

function nextMessageId(messages: DemoChatMessage[]): string {
  const nums = messages
    .map((m) => parseInt(m.messageId.replace(/^msg_0*/, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `msg_${String(next).padStart(2, "0")}`;
}

export type CreateDemoThreadInput = { channel?: string };
export type PostDemoMessageInput = {
  senderType: "USER" | "AGENT" | "SYSTEM";
  format: string;
  content: string;
  relatesTo?: { projectId: string; decisionId?: string; actionId?: string };
  metadata?: { questionId?: string; answers?: { qid?: string; questionId?: string }[] };
};

export function getDemoThreadId(projectId: string, decisionId: string): string {
  return `thr_${projectId}_${decisionId}`;
}

export async function ensureDemoThread(
  projectId: string,
  decisionId: string,
): Promise<string> {
  await ensureStore();
  return getDemoThreadId(projectId, decisionId);
}

export async function postDemoMessage(
  threadId: string,
  input: PostDemoMessageInput,
): Promise<DemoChatMessage> {
  const s = await ensureStore();
  const parsed = threadId.match(/^thr_(.+?)_(.+)$/);
  const projectId = parsed?.[1] ?? "";
  const decisionId = parsed?.[2] ?? "";
  const actionId = input.relatesTo?.actionId;

  const meta = input.metadata || {};
  const questionId = meta.questionId || meta.answers?.[0]?.questionId;
  const message: DemoChatMessage = {
    messageId: nextMessageId(s.chatMessages),
    threadId,
    projectId,
    decisionId,
    actionId,
    questionId,
    sender: input.senderType.toLowerCase() as "agent" | "user",
    kind: input.format === "ANSWER_SET" ? "ANSWER" : "NOTE",
    text: input.content,
    createdAt: new Date().toISOString(),
  };
  s.chatMessages.push(message);

  if (input.format === "ANSWER_SET" && questionId) {
    if (questionId) {
      const q = s.insufficientQuestions.find(
        (x) =>
          x.decisionId === decisionId &&
          (x.questionId === questionId || x.questionId === String(questionId)),
      );
      if (q) {
        q.status = "ANSWERED";
        q.resolvedAt = new Date().toISOString();
      }
    }
  }

  return message;
}

export async function createDemoDraftActions(
  projectId: string,
  decisionId: string,
): Promise<DemoAction[]> {
  const s = await ensureStore();
  const decision = s.decisions.find(
    (d) => d.projectId === projectId && d.decisionId === decisionId,
  );
  if (!decision) throw new Error("Decision not found");

  const prepAction: DemoAction = {
    actionId: nextActionId(s.actions),
    decisionId,
    projectId,
    title: `${decision.title} の準備タスク`,
    type: "Prep",
    status: "TODO",
  };
  s.actions.push(prepAction);
  const execAction: DemoAction = {
    actionId: nextActionId(s.actions),
    decisionId,
    projectId,
    title: `${decision.title} の実行タスク`,
    type: "Exec",
    status: "TODO",
  };
  s.actions.push(execAction);
  return [prepAction, execAction];
}

export async function listDemoMessagesByThread(
  threadId: string,
): Promise<DemoChatMessage[]> {
  const s = await ensureStore();
  return s.chatMessages.filter((m) => m.threadId === threadId);
}
