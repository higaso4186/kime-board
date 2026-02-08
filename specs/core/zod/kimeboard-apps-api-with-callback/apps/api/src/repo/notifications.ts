import { db, COL, nowIso } from "../lib/firestore";
import { Notification } from "@kimeboard/shared";
import { newNotificationId } from "../lib/id";

export const createNotification = async (projectId: string, input: any) => {
  const notificationId = newNotificationId();
  const doc = Notification.parse({
    notificationId,
    projectId,
    eventType: input.eventType,
    title: input.title,
    body: input.body,
    link: input.link,
    createdAt: nowIso(),
  });
  await db.collection(COL.notifications).doc(notificationId).set(doc);
  return { notificationId };
};

export const listNotifications = async (projectId: string, limit = 50) => {
  const snaps = await db.collection(COL.notifications).where("projectId", "==", projectId).orderBy("createdAt", "desc").limit(limit).get();
  return snaps.docs.map(d => Notification.parse(d.data()));
};
