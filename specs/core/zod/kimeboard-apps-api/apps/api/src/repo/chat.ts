import { db, COL, nowIso } from "../lib/firestore";
import { Thread, Message } from "@kimeboard/shared";
import { newThreadId, newMessageId } from "../lib/id";

export const createThread = async (input: { projectId: string; decisionId?: string; channel: any }) => {
  const threadId = newThreadId();
  const doc = Thread.parse({
    threadId,
    projectId: input.projectId,
    decisionId: input.decisionId,
    channel: input.channel,
    lastMessageAt: nowIso(),
  });
  await db.collection(COL.threads).doc(threadId).set({ ...doc, createdAt: nowIso(), updatedAt: nowIso() });
  return { threadId };
};

export const postMessage = async (threadId: string, msg: any) => {
  const messageId = newMessageId();
  const doc = Message.parse({
    messageId,
    threadId,
    senderType: msg.senderType,
    format: msg.format,
    content: msg.content,
    metadata: msg.metadata,
    createdAt: nowIso(),
  });
  await db.collection(COL.threads).doc(threadId).collection(COL.messages).doc(messageId).set(doc);
  await db.collection(COL.threads).doc(threadId).set({ lastMessageAt: nowIso(), updatedAt: nowIso() }, { merge: true });
  return { messageId };
};

export const getMessage = async (threadId: string, messageId: string) => {
  const snap = await db.collection(COL.threads).doc(threadId).collection(COL.messages).doc(messageId).get();
  if (!snap.exists) return null;
  return Message.parse(snap.data());
};

export const listMessages = async (threadId: string, limit = 50) => {
  const snaps = await db.collection(COL.threads).doc(threadId).collection(COL.messages).orderBy("createdAt", "desc").limit(limit).get();
  return snaps.docs.map(d => Message.parse(d.data())).reverse();
};
