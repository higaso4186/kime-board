import { db, COL, nowIso } from "../lib/firestore";
import { Project } from "@kimeboard/shared";
import { newProjectId } from "../lib/id";

export const createProject = async (input: { name: string; description?: string }) => {
  const projectId = newProjectId();
  const doc = {
    projectId,
    name: input.name,
    description: input.description,
    status: "ACTIVE",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  Project.parse(doc);
  await db.collection(COL.projects).doc(projectId).set(doc);
  return { projectId };
};

export const getProject = async (projectId: string) => {
  const snap = await db.collection(COL.projects).doc(projectId).get();
  if (!snap.exists) return null;
  return Project.parse(snap.data());
};
