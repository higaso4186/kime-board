import { z } from "zod";
import { Action, ActionAssignee } from "../domain/action";
import { ActionType } from "../constants/status";

export const CreateActionRequest = z.object({
  type: ActionType,
  title: z.string().min(1),
  description: z.string().optional(),
  assignee: ActionAssignee.optional(),
  dueAt: z.string().datetime().optional(),
});
export type CreateActionRequest = z.infer<typeof CreateActionRequest>;

export const CreateActionResponse = z.object({
  actionId: z.string().min(1),
});

export const BulkCreateActionsRequest = z.object({
  actions: z.array(CreateActionRequest).min(1),
});
export const BulkCreateActionsResponse = z.object({
  created: z.number().int().nonnegative(),
  actions: z.array(Action).optional(),
});
