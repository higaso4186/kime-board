import { db, COL, nowIso } from "../lib/firestore";
import { Action } from "@kimeboard/shared";
import { newActionId } from "../lib/id";

export const bulkCreateActions = async (projectId: string, decisionId: string, actions: Array<any>) => {
  const batch = db.batch();
  const createdIds: string[] = [];

  for (const a of actions) {
    const actionId = newActionId();
    const doc = Action.parse({
      actionId,
      projectId,
      decisionId,
      type: a.type,
      title: a.title,
      description: a.description,
      assignee: a.assignee,
      dueAt: a.dueAt,
      status: "TODO",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    batch.set(db.collection(COL.actions).doc(actionId), doc);
    createdIds.push(actionId);
  }

  await batch.commit();
  return { created: createdIds.length, actionIds: createdIds };
};
