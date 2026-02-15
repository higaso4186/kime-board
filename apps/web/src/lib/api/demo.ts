import type {
  Action,
  ChatMessage,
  Decision,
  DecisionStatus,
  InsufficientQuestion,
  Meeting,
  Project,
} from "@/lib/mock/data";
import { decisionStatusLabels } from "@/lib/mock/data";
import runtimeDefaults from "@/data/runtime-defaults.json";

export type ProjectSnapshot = {
  project: Project;
  decisions: Decision[];
  meetings: Meeting[];
  actions: Action[];
  insufficientQuestions: InsufficientQuestion[];
  chatMessages: ChatMessage[];
  agentLogs: string[];
};

export type GetIdTokenFn = () => Promise<string | null>;

type ApiDataMode = "demo" | "production";
type ApiProject = {
  projectId: string;
  name: string;
  description?: string;
  counters?: {
    decisions_open?: number;
    decisions_ready?: number;
    actions_overdue?: number;
    decisions_owner_missing?: number;
  };
  lastMeetingAt?: string;
};

export function getApiDataMode(): ApiDataMode {
  const raw = process.env.NEXT_PUBLIC_API_DATA_MODE?.toLowerCase();
  if (raw === "production") return "production";
  if (raw === "demo") return "demo";
  return runtimeDefaults.apiDataMode === "production" ? "production" : "demo";
}

export function isProductionDataMode() {
  return getApiDataMode() === "production";
}

function mapProjectFromApi(project: ApiProject): Project {
  return {
    projectId: project.projectId,
    name: project.name,
    description: project.description ?? "",
    undecided: project.counters?.decisions_open ?? 0,
    ready: project.counters?.decisions_ready ?? 0,
    overdue: project.counters?.actions_overdue ?? 0,
    missingOwner: project.counters?.decisions_owner_missing ?? 0,
    nextMeetingAt: project.lastMeetingAt ?? runtimeDefaults.fallbackNextMeetingAt,
  };
}

function mapDecisionFromApi(projectId: string, decision: unknown): Decision {
  const data = typeof decision === "object" && decision !== null ? (decision as Record<string, unknown>) : {};
  const ownerObj =
    typeof data.owner === "object" && data.owner !== null ? (data.owner as Record<string, unknown>) : {};
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const completeness =
    typeof data.completeness === "object" && data.completeness !== null
      ? (data.completeness as Record<string, unknown>)
      : {};

  const owner =
    (typeof ownerObj.displayName === "string" ? ownerObj.displayName : undefined) ??
    (typeof ownerObj.userId === "string" ? ownerObj.userId : undefined) ??
    "";
  const dueAt: string | undefined = typeof data.dueAt === "string" ? data.dueAt : undefined;
  const status: DecisionStatus =
    typeof data.status === "string" && data.status in decisionStatusLabels
      ? (data.status as DecisionStatus)
      : "NEEDS_INFO";
  const priority = data.priority === "HIGH" ? "高" : data.priority === "LOW" ? "低" : "中";
  const readiness = typeof completeness.score === "number" ? completeness.score : 0;
  const optionsRaw = Array.isArray(data.options) ? data.options : [];
  const options = optionsRaw
    .map((item, index) => {
      const option = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
      const label = typeof option.label === "string" ? option.label : "";
      if (!label) return null;
      return {
        id: typeof option.id === "string" ? option.id : `opt_${String(index + 1).padStart(2, "0")}`,
        label,
        merit: typeof option.merit === "string" ? option.merit : "",
        demerit: typeof option.demerit === "string" ? option.demerit : "",
        note: typeof option.note === "string" ? option.note : "",
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    decisionId: typeof data.decisionId === "string" ? data.decisionId : "",
    projectId,
    title: typeof data.title === "string" ? data.title : "",
    summary: typeof data.summary === "string" ? data.summary : "",
    tag: typeof tags[0] === "string" ? tags[0] : "",
    status,
    owner,
    dueAt,
    meetingTitle: undefined,
    options,
    priority,
    readiness,
  };
}

function toIsoIfNeeded(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

async function fetchJson<T>(
  path: string,
  getToken?: GetIdTokenFn,
): Promise<T> {
  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`/api/backend${path}`, {
    cache: "no-store",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T;
}

export async function fetchDemoProjects(
  getToken?: GetIdTokenFn,
): Promise<Project[]> {
  const mode = getApiDataMode();
  if (mode === "demo") {
    const payload = await fetchJson<{ projects: Project[] }>("/demo/projects", getToken);
    return payload.projects;
  }

  const payload = await fetchJson<{ projects: ApiProject[] }>("/projects", getToken);
  return payload.projects.map(mapProjectFromApi);
}

export async function fetchDemoProjectSnapshot(
  projectId: string,
  getToken?: GetIdTokenFn,
): Promise<ProjectSnapshot> {
  const mode = getApiDataMode();
  const path =
    mode === "demo"
      ? `/demo/projects/${projectId}/snapshot`
      : `/projects/${projectId}/snapshot`;
  return fetchJson<ProjectSnapshot>(path, getToken);
}

async function fetchWithBody<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
  getToken?: GetIdTokenFn,
): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/backend${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T;
}

export async function createDemoProject(
  input: { name: string; description?: string },
  getToken?: GetIdTokenFn,
): Promise<{ projectId: string; project: Project }> {
  const mode = getApiDataMode();
  if (mode === "demo") {
    const payload = await fetchWithBody<{ projectId: string; project: Project }>(
      "/demo/projects",
      "POST",
      input,
      getToken,
    );
    return payload;
  }

  const payload = await fetchWithBody<{ projectId: string }>(
    "/projects",
    "POST",
    input,
    getToken,
  );
  return {
    projectId: payload.projectId,
    project: {
      projectId: payload.projectId,
      name: input.name,
      description: input.description ?? "",
      undecided: 0,
      ready: 0,
      overdue: 0,
      missingOwner: 0,
      nextMeetingAt: runtimeDefaults.fallbackNextMeetingAt,
    },
  };
}

export async function patchDemoProject(
  projectId: string,
  input: { name?: string; description?: string },
  getToken?: GetIdTokenFn,
): Promise<Project> {
  const mode = getApiDataMode();
  if (mode !== "demo") {
    throw new Error("patchDemoProject is for demo mode only");
  }
  const payload = await fetchWithBody<{ project: Project }>(
    `/demo/projects/${projectId}`,
    "PATCH",
    input,
    getToken,
  );
  return payload.project;
}

export async function createDemoMeeting(
  projectId: string,
  input: { title: string; heldAt?: string; participants?: string[]; rawText: string },
  getToken?: GetIdTokenFn,
): Promise<{ meetingId: string; status: string }> {
  const mode = getApiDataMode();
  if (mode === "demo") {
    const payload = await fetchWithBody<{ meetingId: string; status: string; meeting: Meeting }>(
      `/demo/projects/${projectId}/meetings`,
      "POST",
      input,
      getToken,
    );
    return { meetingId: payload.meetingId, status: payload.status };
  }

  const payload = await fetchWithBody<{ meetingId: string; status: string }>(
    `/projects/${projectId}/meetings`,
    "POST",
    {
      title: input.title,
      heldAt: toIsoIfNeeded(input.heldAt),
      participants: input.participants,
      sourceType: "PASTE",
      rawText: input.rawText,
    },
    getToken,
  );
  return payload;
}

export async function patchDemoDecision(
  projectId: string,
  decisionId: string,
  input: { title?: string; status?: string; owner?: string; dueAt?: string | null },
  getToken?: GetIdTokenFn,
): Promise<Decision> {
  const mode = getApiDataMode();
  if (mode === "demo") {
    const payload = await fetchWithBody<{ decision: Decision }>(
      `/demo/projects/${projectId}/decisions/${decisionId}`,
      "PATCH",
      input,
      getToken,
    );
    return payload.decision;
  }

  const body: Record<string, unknown> = {};
  if (typeof input.title === "string") body.title = input.title;
  if (typeof input.status === "string") body.status = input.status;
  if (typeof input.owner === "string") body.owner = { displayName: input.owner };
  if (typeof input.dueAt === "string") {
    body.dueAt = toIsoIfNeeded(input.dueAt);
  }

  const payload = await fetchWithBody<{ decision: unknown }>(
    `/projects/${projectId}/decisions/${decisionId}`,
    "PATCH",
    body,
    getToken,
  );
  return mapDecisionFromApi(projectId, payload.decision);
}

export async function createDecision(
  projectId: string,
  input: { title: string; summary?: string; tags?: string[] },
  getToken?: GetIdTokenFn,
): Promise<{ decisionId: string }> {
  const mode = getApiDataMode();
  const path =
    mode === "demo"
      ? `/demo/projects/${projectId}/decisions`
      : `/projects/${projectId}/decisions`;
  const body =
    mode === "demo"
      ? { title: input.title, summary: input.summary }
      : input;
  const payload = await fetchWithBody<{ decisionId: string }>(
    path,
    "POST",
    body,
    getToken,
  );
  return payload;
}

export async function patchDecisionStatus(
  projectId: string,
  decisionId: string,
  status: DecisionStatus,
  getToken?: GetIdTokenFn,
) {
  if (getApiDataMode() === "demo") {
    return patchDemoDecision(projectId, decisionId, { status }, getToken);
  }
  const payload = await fetchWithBody<{ decision: unknown }>(
    `/projects/${projectId}/decisions/${decisionId}`,
    "PATCH",
    { status },
    getToken,
  );
  return mapDecisionFromApi(projectId, payload.decision);
}

export async function createDecisionThread(
  projectId: string,
  decisionId: string,
  getToken?: GetIdTokenFn,
) {
  const mode = getApiDataMode();
  const path =
    mode === "demo"
      ? `/demo/projects/${projectId}/decisions/${decisionId}/chat/thread`
      : `/projects/${projectId}/decisions/${decisionId}/chat/thread`;
  const body = mode === "demo" ? {} : { channel: "IN_APP" };
  return fetchWithBody<{ threadId: string }>(path, "POST", body, getToken);
}

export async function postThreadMessage(
  threadId: string,
  input: {
    senderType: "AGENT" | "USER" | "SYSTEM";
    format: "TEXT" | "QUESTION_SET" | "ANSWER_SET";
    content: string;
    metadata?: { questionId?: string; answers?: { qid?: string; questionId?: string }[] };
    relatesTo?: {
      projectId: string;
      decisionId?: string;
      actionId?: string;
      meetingId?: string;
    };
  },
  getToken?: GetIdTokenFn,
) {
  const mode = getApiDataMode();
  const path =
    mode === "demo"
      ? `/demo/chat/threads/${threadId}/messages`
      : `/chat/threads/${threadId}/messages`;
  return fetchWithBody<{ messageId: string }>(path, "POST", input, getToken);
}

export async function triggerDraftActions(
  projectId: string,
  decisionId: string,
  getToken?: GetIdTokenFn,
) {
  const mode = getApiDataMode();
  const path =
    mode === "demo"
      ? `/demo/projects/${projectId}/decisions/${decisionId}/skills/draft_actions`
      : `/projects/${projectId}/decisions/${decisionId}/skills/draft_actions`;
  return fetchWithBody<{ ok: boolean }>(path, "POST", {}, getToken);
}
