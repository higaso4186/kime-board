import { z } from "zod";
import { Notification } from "../domain/notification";
import { NotificationEventType } from "../constants/status";
import { ProjectRole } from "../constants/roles";

export const CreateNotificationRequest = z.object({
  eventType: NotificationEventType,
  target: z
    .object({
      userId: z.string().optional(),
      role: ProjectRole.optional(),
    })
    .optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  link: z.object({ route: z.string().min(1) }),
});

export const CreateNotificationResponse = z.object({
  notificationId: z.string().min(1),
});

export const ListNotificationsResponse = z.object({
  notifications: z.array(Notification),
});
