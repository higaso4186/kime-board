import { Message, Thread } from "@/shared";
import { nowIso, refs } from "../lib/firestore";
import { newMessageId, newThreadId } from "../lib/id";

export const ensureDecisionThread = async (
  projectId: string,
  decisionId: string,
  opts?: { actionId?: string; title?: string }
) => {
  let q = refs.threads(projectId, decisionId).where("channel", "==", "IN_APP");
  if (opts?.actionId) {
    q = q.where("scopeType", "==", "ACTION").where("actionId", "==", opts.actionId);
  } else {
    q = q.where("scopeType", "==", "DECISION");
  }

  const snap = await q.limit(1).get();
  if (!snap.empty) {
    const thread = Thread.parse(snap.docs[0].data());
    return { threadId: thread.threadId, created: false };
  }

  const threadId = newThreadId();
  const now = nowIso();
  const doc = Thread.parse({
    threadId,
    projectId,
    decisionId,
    actionId: opts?.actionId,
    scopeType: opts?.actionId ? "ACTION" : "DECISION",
    scopeId: opts?.actionId ?? decisionId,
    channel: "IN_APP",
    title: opts?.title,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  });

  await refs.thread(projectId, decisionId, threadId).set(doc);
  return { threadId, created: true };
};

export const postQuestionSet = async (
  threadId: string,
  payload: {
    projectId: string;
    decisionId: string;
    actionId?: string;
    questions: Array<{
      qid: string;
      type: "single_select" | "multi_select" | "date" | "text";
      text: string;
      options?: string[];
      required?: boolean;
      maps_to: { targetType: "DECISION" | "ACTION"; field: string };
    }>;
    missingFields?: string[];
    hint?: string;
  }
) => {
  const messageId = newMessageId();
  const content = payload.hint ?? "不足情報の確認です。回答をお願いします。";

  const doc = Message.parse({
    messageId,
    threadId,
    senderType: "AGENT",
    format: "QUESTION_SET",
    content,
    metadata: {
      questions: payload.questions,
      missingFields: payload.missingFields,
      contextLabel: payload.actionId ? "action" : "decision",
    },
    relatesTo: {
      projectId: payload.projectId,
      decisionId: payload.decisionId,
      actionId: payload.actionId,
    },
    createdAt: nowIso(),
  });

  await refs.message(payload.projectId, payload.decisionId, threadId, messageId).set(doc);
  await refs.thread(payload.projectId, payload.decisionId, threadId).set(
    {
      updatedAt: nowIso(),
      lastMessageAt: nowIso(),
    },
    { merge: true }
  );

  return { messageId };
};
