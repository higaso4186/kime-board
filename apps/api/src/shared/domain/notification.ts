import { z } from "zod";
import { NotificationEventType } from "../constants/status";

export const Notification = z.object({
  notificationId: z.string().min(1),
  projectId: z.string().min(1),
  eventType: NotificationEventType,
  target: z
    .object({
      userId: z.string().optional(),
      role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).optional(),
    })
    .optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  link: z.object({ route: z.string().min(1) }),
  readBy: z.record(z.string(), z.string().datetime()).optional(),
  delivery: z
    .object({
      channel: z.enum(["IN_APP"]),
      status: z.enum(["DELIVERED", "FAILED"]).optional(),
    })
    .optional(),
  createdBy: z.enum(["SYSTEM", "AGENT", "USER"]).optional(),
  createdAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
});
export type Notification = z.infer<typeof Notification>;
