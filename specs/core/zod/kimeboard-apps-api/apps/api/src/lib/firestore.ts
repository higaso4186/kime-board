import { Firestore } from "@google-cloud/firestore";

const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

export const db = new Firestore({
  projectId,
});

export const COL = {
  projects: "projects",
  meetings: "meetings",
  decisions: "decisions",
  actions: "actions",
  threads: "threads",
  messages: "messages",
  notifications: "notifications",
  agentRuns: "agent_runs",
} as const;

export const nowIso = (): string => new Date().toISOString();
