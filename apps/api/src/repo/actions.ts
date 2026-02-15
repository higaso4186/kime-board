import { Action } from "@/shared";
import { db, nowIso, refs } from "../lib/firestore";
import { newActionId } from "../lib/id";
import { recomputeProjectCounters } from "./projects";

const makeAction = (projectId: string, decisionId: string, payload: any) =>
  Action.parse({
    actionId: newActionId(),
    projectId,
    decisionId,
    type: payload.type,
    title: payload.title,
    description: payload.description,
    note: payload.note,
    assignee: payload.assignee,
    dueAt: payload.dueAt,
    status: payload.status ?? "TODO",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

export const createAction = async (projectId: string, decisionId: string, input: any) => {
  const doc = makeAction(projectId, decisionId, input);
  await refs.action(projectId, decisionId, doc.actionId).set(doc);
  await recomputeProjectCounters(projectId);
  return { actionId: doc.actionId, action: doc };
};

export const bulkCreateActions = async (projectId: string, decisionId: string, actions: Array<any>) => {
  const batch = db.batch();
  const actionIds: string[] = [];
  for (const a of actions) {
    const doc = makeAction(projectId, decisionId, a);
    batch.set(refs.action(projectId, decisionId, doc.actionId), doc);
    actionIds.push(doc.actionId);
  }
  await batch.commit();
  await recomputeProjectCounters(projectId);
  return { created: actionIds.length, actionIds };
};

export const listActionsByDecision = async (projectId: string, decisionId: string) => {
  const snap = await refs.actions(projectId, decisionId).orderBy("createdAt", "asc").get();
  return snap.docs.map((d) => Action.parse(d.data()));
};

export const listActionsByProject = async (projectId: string) => {
  const snap = await refs.actionGroup().where("projectId", "==", projectId).get();
  const actions = snap.docs.map((d) => Action.parse(d.data()));
  actions.sort((a, b) => Date.parse(a.createdAt ?? "") - Date.parse(b.createdAt ?? ""));
  return actions;
};
