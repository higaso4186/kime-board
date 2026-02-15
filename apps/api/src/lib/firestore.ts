import { Firestore } from "@google-cloud/firestore";
import runtimeDefaults from "@/data/config/runtime-defaults.json";

const projectId =
  process.env.FIRESTORE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  runtimeDefaults.projectId;

export const db = new Firestore({
  projectId,
  ignoreUndefinedProperties: true,
});

export const COL = {
  projects: "projects",
  members: "members",
  meetings: "meetings",
  decisions: "decisions",
  actions: "actions",
  threads: "threads",
  messages: "messages",
  notifications: "notifications",
  agentRuns: "agent_runs",
  agendas: "agendas",
} as const;

export const nowIso = (): string => new Date().toISOString();

export const refs = {
  projects: () => db.collection(COL.projects),
  project: (projectId: string) => db.collection(COL.projects).doc(projectId),
  members: (projectId: string) => refs.project(projectId).collection(COL.members),
  meetings: (projectId: string) => refs.project(projectId).collection(COL.meetings),
  meeting: (projectId: string, meetingId: string) => refs.meetings(projectId).doc(meetingId),
  meetingAgentRuns: (projectId: string, meetingId: string) =>
    refs.meeting(projectId, meetingId).collection(COL.agentRuns),
  decisions: (projectId: string) => refs.project(projectId).collection(COL.decisions),
  decision: (projectId: string, decisionId: string) => refs.decisions(projectId).doc(decisionId),
  actions: (projectId: string, decisionId: string) => refs.decision(projectId, decisionId).collection(COL.actions),
  action: (projectId: string, decisionId: string, actionId: string) =>
    refs.actions(projectId, decisionId).doc(actionId),
  threads: (projectId: string, decisionId: string) => refs.decision(projectId, decisionId).collection(COL.threads),
  thread: (projectId: string, decisionId: string, threadId: string) =>
    refs.threads(projectId, decisionId).doc(threadId),
  messages: (projectId: string, decisionId: string, threadId: string) =>
    refs.thread(projectId, decisionId, threadId).collection(COL.messages),
  message: (projectId: string, decisionId: string, threadId: string, messageId: string) =>
    refs.messages(projectId, decisionId, threadId).doc(messageId),
  notifications: (projectId: string) => refs.project(projectId).collection(COL.notifications),
  notification: (projectId: string, notificationId: string) => refs.notifications(projectId).doc(notificationId),
  agendas: (projectId: string) => refs.project(projectId).collection(COL.agendas),
  threadGroup: () => db.collectionGroup(COL.threads),
  messageGroup: () => db.collectionGroup(COL.messages),
  actionGroup: () => db.collectionGroup(COL.actions),
};
