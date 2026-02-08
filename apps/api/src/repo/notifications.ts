import { Notification } from "@/shared";
import { nowIso, refs } from "../lib/firestore";
import { newNotificationId } from "../lib/id";

export const createNotification = async (projectId: string, input: any) => {
  const notificationId = newNotificationId();
  const doc = Notification.parse({
    notificationId,
    projectId,
    eventType: input.eventType,
    target: input.target,
    title: input.title,
    body: input.body,
    link: input.link,
    readBy: {},
    createdBy: input.createdBy ?? "SYSTEM",
    delivery: { channel: "IN_APP", status: "DELIVERED" },
    createdAt: nowIso(),
  });
  await refs.notification(projectId, notificationId).set(doc);
  return { notificationId };
};

export const listNotifications = async (projectId: string, limit = 50) => {
  const snap = await refs.notifications(projectId).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => Notification.parse(d.data()));
};
