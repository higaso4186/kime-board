import { z } from "zod";

export const ProjectCounters = z
  .object({
    decisions_total: z.number().int().nonnegative().optional(),
    decisions_open: z.number().int().nonnegative().optional(),
    decisions_needs_info: z.number().int().nonnegative().optional(),
    decisions_ready: z.number().int().nonnegative().optional(),
    decisions_reopen: z.number().int().nonnegative().optional(),
    decisions_owner_missing: z.number().int().nonnegative().optional(),
    actions_overdue: z.number().int().nonnegative().optional(),
    meetings_total: z.number().int().nonnegative().optional(),
    meetings_analyzing: z.number().int().nonnegative().optional(),
  })
  .partial();

export const Project = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  tags: z.array(z.string()).optional(),
  counters: ProjectCounters.optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  lastActivityAt: z.string().datetime().optional(),
  lastMeetingAt: z.string().datetime().optional(),
  lastDecisionUpdatedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Project = z.infer<typeof Project>;
