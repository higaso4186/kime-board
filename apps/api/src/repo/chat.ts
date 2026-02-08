import { Message, Thread } from "@/shared";
import { nowIso, refs } from "../lib/firestore";
import { newMessageId, newThreadId } from "../lib/id";

export type ThreadLocator = {
  projectId: string;
  decisionId: string;
  threadId: string;
};

export const locateThread = async (threadId: string): Promise<ThreadLocator | null> => {
  const q = await refs.threadGroup().where("threadId", "==", threadId).limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0].data() as any;
  if (!doc.projectId || !doc.decisionId) return null;
  return { projectId: doc.projectId, decisionId: doc.decisionId, threadId };
};

export const getThread = async (threadId: string) => {
  const loc = await locateThread(threadId);
  if (!loc) return null;
  const snap = await refs.thread(loc.projectId, loc.decisionId, loc.threadId).get();
  if (!snap.exists) return null;
  return Thread.parse(snap.data());
};

export const createThread = async (input: {
  projectId: string;
  decisionId: string;
  channel: any;
  scopeType?: "PROJECT" | "DECISION" | "ACTION";
  scopeId?: string;
  actionId?: string;
  title?: string;
}) => {
  const threadId = newThreadId();
  const now = nowIso();
  const scopeType = input.scopeType ?? (input.actionId ? "ACTION" : "DECISION");
  const scopeId = input.scopeId ?? input.actionId ?? input.decisionId;

  const doc = Thread.parse({
    threadId,
    projectId: input.projectId,
    decisionId: input.decisionId,
    actionId: input.actionId,
    channel: input.channel,
    scopeType,
    scopeId,
    title: input.title,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  });

  await refs.thread(input.projectId, input.decisionId, threadId).set(doc);
  return { threadId };
};

export const postMessage = async (threadId: string, msg: any) => {
  const loc = await locateThread(threadId);
  if (!loc) return null;

  const messageId = newMessageId();
  const doc = Message.parse({
    messageId,
    threadId,
    senderType: msg.senderType,
    format: msg.format,
    content: msg.content,
    metadata: msg.metadata,
    relatesTo: msg.relatesTo ?? {
      projectId: loc.projectId,
      decisionId: loc.decisionId,
      actionId: msg.metadata?.actionId,
    },
    createdAt: nowIso(),
  });

  await refs.message(loc.projectId, loc.decisionId, threadId, messageId).set(doc);
  await refs.thread(loc.projectId, loc.decisionId, threadId).set(
    {
      updatedAt: nowIso(),
      lastMessageAt: nowIso(),
    },
    { merge: true }
  );

  return { messageId, locator: loc };
};

export const getMessage = async (threadId: string, messageId: string) => {
  const loc = await locateThread(threadId);
  if (!loc) return null;
  const snap = await refs.message(loc.projectId, loc.decisionId, threadId, messageId).get();
  if (!snap.exists) return null;
  return Message.parse(snap.data());
};

export const listMessages = async (threadId: string, limit = 50) => {
  const loc = await locateThread(threadId);
  if (!loc) return [];
  const snap = await refs
    .messages(loc.projectId, loc.decisionId, threadId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => Message.parse(d.data())).reverse();
};
