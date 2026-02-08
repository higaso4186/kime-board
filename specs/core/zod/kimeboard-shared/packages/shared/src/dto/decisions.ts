import { z } from "zod";
import { DecisionStatus } from "../constants/status";
import { Decision, DecisionOption, DecisionOwner, DecisionRationale } from "../domain/decision";

export const DecisionSummary = z.object({
  decisionId: z.string().min(1),
  title: z.string().min(1),
  status: DecisionStatus,
  ownerDisplayName: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  completenessScore: z.number().min(0).max(100).optional(),
  ownerMissing: z.boolean().optional(),
});
export type DecisionSummary = z.infer<typeof DecisionSummary>;

export const PatchDecisionRequest = z
  .object({
    title: z.string().min(1).optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: DecisionStatus.optional(),
    owner: DecisionOwner.optional(),
    dueAt: z.string().datetime().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    options: z.array(DecisionOption).optional(),
    criteria: z.array(z.string()).optional(),
    assumptions: z.array(z.string()).optional(),
    reopenTriggers: z.array(z.string()).optional(),
    rationale: DecisionRationale.optional(),
  })
  .strict();
export type PatchDecisionRequest = z.infer<typeof PatchDecisionRequest>;

export const PatchDecisionResponse = z.object({
  decision: Decision,
});
export type PatchDecisionResponse = z.infer<typeof PatchDecisionResponse>;
