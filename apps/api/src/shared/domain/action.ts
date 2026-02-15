import { z } from "zod";
import { ActionStatus, ActionType } from "../constants/status";

export const ActionAssignee = z
  .object({
    userId: z.string().optional(),
    displayName: z.string().optional(),
  })
  .partial();

export const Action = z.object({
  actionId: z.string().min(1),
  projectId: z.string().min(1),
  decisionId: z.string().min(1),
  type: ActionType,
  title: z.string().min(1),
  description: z.string().optional(),
  assignee: ActionAssignee.optional(),
  dueAt: z.string().datetime().optional(),
  status: ActionStatus.default("TODO"),
  note: z.string().optional(),
  blockedReason: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  softDelete: z
    .object({
      isDeleted: z.boolean().optional(),
      deletedAt: z.string().datetime().optional(),
      deletedBy: z.string().optional(),
    })
    .optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Action = z.infer<typeof Action>;
