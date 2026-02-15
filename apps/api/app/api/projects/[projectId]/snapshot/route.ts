import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { refs } from "@/lib/firestore";
import { listActionsByProject } from "@/repo/actions";
import { listDecisionsByProject } from "@/repo/decisions";
import { listMeetingsByProject } from "@/repo/meetings";
import { getProject } from "@/repo/projects";
import { Message } from "@/shared";

export const runtime = "nodejs";

type SnapshotMissingField =
  | "owner"
  | "dueAt"
  | "criteria"
  | "options"
  | "assignee"
  | "definitionOfDone"
  | "blockedReason";

type SnapshotQuestion = {
  questionId: string;
  projectId: string;
  decisionId: string;
  actionId?: string;
  targetType: "DECISION" | "ACTION";
  source: "agent" | "user";
  title: string;
  prompt: string;
  missingFields: SnapshotMissingField[];
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "ANSWERED";
  createdAt: string;
  resolvedAt?: string;
};

type SnapshotChatMessage = {
  messageId: string;
  threadId: string;
  projectId: string;
  decisionId: string;
  actionId?: string;
  questionId?: string;
  sender: "agent" | "user";
  kind: "QUESTION" | "ANSWER" | "NOTE";
  text: string;
  createdAt: string;
};

type ProjectMessage = {
  decisionId: string;
  message: ReturnType<typeof Message.parse>;
};

const PRIORITY_TO_UI: Record<string, "高" | "中" | "低"> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

function toUiPriority(priority: string | undefined): "高" | "中" | "低" {
  return PRIORITY_TO_UI[priority ?? "MEDIUM"] ?? "中";
}

function toUiMeetingStatus(status: string): "ANALYZING" | "DONE" | "FAILED" {
  if (status === "DONE") return "DONE";
  if (status === "FAILED") return "FAILED";
  return "ANALYZING";
}

function toMissingField(field: string): SnapshotMissingField {
  const known: SnapshotMissingField[] = [
    "owner",
    "dueAt",
    "criteria",
    "options",
    "assignee",
    "definitionOfDone",
    "blockedReason",
  ];
  if (known.includes(field as SnapshotMissingField)) {
    return field as SnapshotMissingField;
  }
  return "criteria";
}

function decisionOwnerMissing(decision: {
  ownerMissing?: boolean;
  owner?: { userId?: string; displayName?: string };
}): boolean {
  if (typeof decision.ownerMissing === "boolean") return decision.ownerMissing;
  return !(decision.owner?.displayName || decision.owner?.userId);
}

async function collectProjectMessages(projectId: string, decisionIds: string[]): Promise<ProjectMessage[]> {
  const out: ProjectMessage[] = [];
  for (const decisionId of decisionIds) {
    const threads = await refs.threads(projectId, decisionId).get();
    for (const threadDoc of threads.docs) {
      const threadData = threadDoc.data() as { threadId?: string };
      const threadId = threadData.threadId ?? threadDoc.id;
      const messages = await refs.messages(projectId, decisionId, threadId).orderBy("createdAt", "asc").get();
      for (const messageDoc of messages.docs) {
        const parsed = Message.parse(messageDoc.data());
        out.push({ decisionId, message: parsed });
      }
    }
  }
  return out;
}

async function collectAgentLogs(projectId: string, meetingIds: string[]): Promise<string[]> {
  const lines: string[] = [];
  for (const meetingId of meetingIds) {
    const runs = await refs
      .meetingAgentRuns(projectId, meetingId)
      .orderBy("startedAt", "desc")
      .limit(3)
      .get();
    for (const runDoc of runs.docs) {
      const run = runDoc.data() as { logLines?: string[]; runId?: string };
      for (const line of run.logLines ?? []) {
        lines.push(`[${meetingId}${run.runId ? `/${run.runId}` : ""}] ${line}`);
      }
    }
  }
  return lines.slice(-100);
}

function buildQuestionsFromMessages(projectId: string, messages: ProjectMessage[]): SnapshotQuestion[] {
  const answeredAt = new Map<string, string>();
  for (const item of messages) {
    const message = item.message;
    if (message.format !== "ANSWER_SET") continue;
    for (const answer of message.metadata?.answers ?? []) {
      const key = `${message.threadId}:${answer.qid}`;
      if (!answeredAt.has(key)) {
        answeredAt.set(key, message.createdAt ?? new Date().toISOString());
      }
    }
  }

  const questions: SnapshotQuestion[] = [];
  for (const item of messages) {
    const message = item.message;
    if (message.format !== "QUESTION_SET") continue;
    for (const question of message.metadata?.questions ?? []) {
      const key = `${message.threadId}:${question.qid}`;
      const resolvedAt = answeredAt.get(key);
      questions.push({
        questionId: key,
        projectId,
        decisionId: item.decisionId,
        actionId: question.maps_to.targetType === "ACTION" ? message.relatesTo?.actionId : undefined,
        targetType: question.maps_to.targetType,
        source: message.senderType === "AGENT" ? "agent" : "user",
        title: question.text,
        prompt: question.text,
        missingFields: [toMissingField(question.maps_to.field)],
        priority: question.required ? "HIGH" : "MEDIUM",
        status: resolvedAt ? "ANSWERED" : "OPEN",
        createdAt: message.createdAt ?? new Date().toISOString(),
        resolvedAt,
      });
    }
  }
  return questions;
}

function buildChatMessages(projectId: string, messages: ProjectMessage[]): SnapshotChatMessage[] {
  return messages.map((item) => {
    const message = item.message;
    const firstQuestionQid = message.metadata?.questions?.[0]?.qid;
    const firstAnswerQid = message.metadata?.answers?.[0]?.qid;
    return {
      messageId: message.messageId,
      threadId: message.threadId,
      projectId,
      decisionId: item.decisionId,
      actionId: message.relatesTo?.actionId,
      questionId:
        message.format === "QUESTION_SET"
          ? `${message.threadId}:${firstQuestionQid ?? ""}`
          : message.format === "ANSWER_SET"
            ? `${message.threadId}:${firstAnswerQid ?? ""}`
            : undefined,
      sender: message.senderType === "AGENT" ? "agent" : "user",
      kind:
        message.format === "QUESTION_SET"
          ? "QUESTION"
          : message.format === "ANSWER_SET"
            ? "ANSWER"
            : "NOTE",
      text: message.content,
      createdAt: message.createdAt ?? new Date().toISOString(),
    };
  });
}

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const project = await getProject(projectId);
    if (!project) {
      return jsonError({ code: "NOT_FOUND", message: "Project not found", status: 404 });
    }

    const [decisionsRaw, meetingsRaw, actionsRaw] = await Promise.all([
      listDecisionsByProject(projectId, { limit: 200 }),
      listMeetingsByProject(projectId, 200),
      listActionsByProject(projectId),
    ]);

    const decisions = decisionsRaw.filter((decision) => decision.status !== "ARCHIVED");
    const meetings = meetingsRaw.filter((meeting) => !meeting.softDelete?.isDeleted);
    const actions = actionsRaw.filter((action) => !action.softDelete?.isDeleted);

    const decisionIds = decisions.map((decision) => decision.decisionId);
    const messages = await collectProjectMessages(projectId, decisionIds);
    const questions = buildQuestionsFromMessages(projectId, messages).sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
    const chatMessages = buildChatMessages(projectId, messages).sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
    const agentLogs = await collectAgentLogs(
      projectId,
      meetings.map((meeting) => meeting.meetingId),
    );

    const meetingTitleById = new Map(meetings.map((meeting) => [meeting.meetingId, meeting.title]));
    const now = Date.now();
    const upcomingMeetingDates = meetings
      .map((meeting) => meeting.heldAt ?? "")
      .filter((heldAt) => Date.parse(heldAt) >= now)
      .sort((a, b) => Date.parse(a) - Date.parse(b));

    return jsonOk({
      project: {
        projectId: project.projectId,
        name: project.name,
        description: project.description ?? "",
        undecided: decisions.filter((decision) => decision.status !== "DECIDED").length,
        ready: decisions.filter((decision) => decision.status === "READY_TO_DECIDE").length,
        overdue: actions.filter((action) => !!action.dueAt && action.status !== "DONE" && Date.parse(action.dueAt) < now).length,
        missingOwner: decisions.filter((decision) => decisionOwnerMissing(decision)).length,
        nextMeetingAt:
          upcomingMeetingDates[0] ??
          meetings.find((meeting) => !!meeting.heldAt)?.heldAt ??
          project.lastMeetingAt ??
          new Date().toISOString(),
      },
      decisions: decisions.map((decision) => ({
        decisionId: decision.decisionId,
        projectId: decision.projectId,
        title: decision.title,
        summary: decision.summary ?? "",
        tag: decision.tags?.[0] ?? "",
        status: decision.status,
        owner: decision.owner?.displayName ?? decision.owner?.userId ?? "",
        dueAt: decision.dueAt,
        meetingTitle: meetingTitleById.get(decision.linkage?.linkedMeetingIds?.[0] ?? ""),
        priority: toUiPriority(decision.priority),
        readiness: decision.completeness?.score ?? 0,
      })),
      meetings: meetings.map((meeting) => ({
        meetingId: meeting.meetingId,
        projectId: meeting.projectId,
        title: meeting.title,
        heldAt: meeting.heldAt ?? meeting.updatedAt ?? new Date().toISOString(),
        participants: meeting.participants ?? [],
        status: toUiMeetingStatus(meeting.status),
        extractedDecisionIds: meeting.extracted?.decisionIds ?? [],
      })),
      actions: actions.map((action) => ({
        actionId: action.actionId,
        decisionId: action.decisionId,
        projectId: action.projectId,
        title: action.title,
        type: action.type === "PREP" ? "Prep" : "Exec",
        assignee: action.assignee?.displayName ?? action.assignee?.userId ?? "",
        dueAt: action.dueAt,
        status: action.status,
      })),
      insufficientQuestions: questions,
      chatMessages,
      agentLogs,
    });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
