import { db, COL, nowIso } from "../lib/firestore";
import { newThreadId, newMessageId } from "../lib/id";
import { Thread, Message } from "@kimeboard/shared";

/**
 * Create (or reuse) an IN_APP thread for a decision and post QUESTION_SET message.
 * MVP: threads are stored in top-level `threads` and messages under `threads/{threadId}/messages`.
 */
export const ensureDecisionThread = async (projectId: string, decisionId: string) => {
  // naive lookup by projectId + decisionId
  const q = await db
    .collection(COL.threads)
    .where("projectId", "==", projectId)
    .where("decisionId", "==", decisionId)
    .limit(1)
    .get();

  if (!q.empty) {
    const thread = Thread.parse(q.docs[0].data());
    return { threadId: thread.threadId, created: false };
  }

  const threadId = newThreadId();
  const doc = Thread.parse({
    threadId,
    projectId,
    decisionId,
    channel: "IN_APP",
    lastMessageAt: nowIso(),
  });

  await db.collection(COL.threads).doc(threadId).set({ ...doc, createdAt: nowIso(), updatedAt: nowIso() });
  return { threadId, created: true };
};

export const postQuestionSet = async (threadId: string, payload: {
  projectId: string;
  decisionId: string;
  questions: Array<{
    qid: string;
    type: "single_select" | "multi_select" | "date" | "text";
    text: string;
    options?: string[];
    required?: boolean;
    maps_to: { decision_field: "owner"|"dueAt"|"criteria"|"options"|"assumptions"|"rationale"|"reopenTriggers" };
  }>;
  hint?: string;
}) => {
  const messageId = newMessageId();
  const content = payload.hint ?? "不足している情報があります。回答してください。";

  const doc = Message.parse({
    messageId,
    threadId,
    senderType: "AGENT",
    format: "QUESTION_SET",
    content,
    metadata: {
      questions: payload.questions,
      // for MVP, stash decisionId/projectId so API can enqueue integrator on answer post
      decisionId: payload.decisionId as any,
      projectId: payload.projectId as any,
    } as any,
    createdAt: nowIso(),
  });

  await db.collection(COL.threads).doc(threadId).collection(COL.messages).doc(messageId).set(doc);
  await db.collection(COL.threads).doc(threadId).set({ lastMessageAt: nowIso(), updatedAt: nowIso() }, { merge: true });
  return { messageId };
};
