import type { GetIdTokenFn } from "@/lib/api/demo";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  getToken?: GetIdTokenFn;
};

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {};
  if (options.getToken) {
    const token = await options.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`/api/backend${path}`, {
    method: options.method ?? "GET",
    headers: Object.keys(headers).length ? headers : undefined,
    cache: "no-store",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function createProject(
  payload: { name: string; description?: string },
  getToken?: GetIdTokenFn,
) {
  return requestJson<{ projectId: string }>("/projects", {
    method: "POST",
    body: payload,
    getToken,
  });
}

export async function createMeeting(
  projectId: string,
  payload: {
    title: string;
    heldAt?: string;
    participants?: string[];
    sourceType?: "PASTE" | "NOTION" | "TLDV" | "WEBHOOK" | "API";
    rawText: string;
  },
  getToken?: GetIdTokenFn,
) {
  return requestJson<{ meetingId: string; status: "ANALYZING" }>(`/projects/${projectId}/meetings`, {
    method: "POST",
    body: payload,
    getToken,
  });
}

export async function createDecision(
  projectId: string,
  payload: { title: string; summary?: string; tags?: string[] },
  getToken?: GetIdTokenFn,
) {
  return requestJson<{ decisionId: string }>(`/projects/${projectId}/decisions`, {
    method: "POST",
    body: payload,
    getToken,
  });
}

export async function patchDecision(
  projectId: string,
  decisionId: string,
  payload: Record<string, unknown>,
  getToken?: GetIdTokenFn,
) {
  return requestJson<{ decision: unknown }>(`/projects/${projectId}/decisions/${decisionId}`, {
    method: "PATCH",
    body: payload,
    getToken,
  });
}

export async function createDecisionThread(
  projectId: string,
  decisionId: string,
  getToken?: GetIdTokenFn,
) {
  return requestJson<{ threadId: string }>(`/projects/${projectId}/decisions/${decisionId}/chat/thread`, {
    method: "POST",
    body: { channel: "IN_APP" },
    getToken,
  });
}

export async function postThreadMessage(
  threadId: string,
  payload: {
    senderType: "AGENT" | "USER" | "SYSTEM";
    format: "TEXT" | "QUESTION_SET" | "ANSWER_SET";
    content: string;
    metadata?: unknown;
    relatesTo?: {
      projectId: string;
      decisionId?: string;
      actionId?: string;
      meetingId?: string;
    };
  },
  getToken?: GetIdTokenFn,
) {
  return requestJson<{ messageId: string }>(`/chat/threads/${threadId}/messages`, {
    method: "POST",
    body: payload,
    getToken,
  });
}

export async function triggerDraftActions(
  projectId: string,
  decisionId: string,
  getToken?: GetIdTokenFn,
) {
  return requestJson<{ ok: boolean }>(
    `/projects/${projectId}/decisions/${decisionId}/skills/draft_actions`,
    {
      method: "POST",
      body: {},
      getToken,
    },
  );
}

export async function postMeetingLog(
  projectId: string,
  meetingId: string,
  line: string,
  getToken?: GetIdTokenFn,
) {
  return requestJson<{ runId: string }>(`/projects/${projectId}/meetings/${meetingId}/logs`, {
    method: "POST",
    body: { line },
    getToken,
  });
}
