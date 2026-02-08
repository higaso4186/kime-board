import { z } from "zod";
import { NotificationEventType } from "../constants/status";

export const Notification = z.object({
  notificationId: z.string().min(1),
  projectId: z.string().min(1),
  eventType: NotificationEventType,
  title: z.string().min(1),
  body: z.string().min(1),
  link: z.object({ route: z.string().min(1) }),
  createdAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
});
export type Notification = z.infer<typeof Notification>;
