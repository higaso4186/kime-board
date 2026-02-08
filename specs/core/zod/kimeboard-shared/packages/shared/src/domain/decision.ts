import { z } from "zod";
import { DecisionStatus } from "../constants/status";

export const DecisionPriority = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type DecisionPriority = z.infer<typeof DecisionPriority>;

export const DecisionOwner = z
  .object({
    userId: z.string().optional(),
    displayName: z.string().optional(),
    source: z.enum(["MANUAL", "AGENT_SUGGESTION"]).optional(),
  })
  .partial();

export const DecisionOption = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  recommended: z.boolean().optional(),
});

export const DecisionRationale = z.object({
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
});

export const DecisionCompleteness = z.object({
  score: z.number().min(0).max(100).default(0),
  missingFields: z.array(z.string()).default([]),
  lastEvaluatedAt: z.string().datetime().optional(),
});

export const DecisionLinkage = z.object({
  linkedMeetingIds: z.array(z.string()).default([]),
  lastMentionedAt: z.string().datetime().optional(),
});

export const DecisionMergeCandidate = z.object({
  candidateDecisionId: z.string().min(1),
  score: z.number().min(0).max(1),
  reason: z.string().optional(),
});

export const DecisionMerge = z.object({
  mergeStatus: z.enum(["NONE", "CANDIDATE", "MERGED"]).default("NONE"),
  requiresHumanApproval: z.boolean().default(true),
  mergeCandidates: z.array(DecisionMergeCandidate).default([]),
});

export const Decision = z.object({
  decisionId: z.string().min(1),
  projectId: z.string().min(1),

  title: z.string().min(1),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),

  status: DecisionStatus.default("NEEDS_INFO"),
  owner: DecisionOwner.optional(),
  dueAt: z.string().datetime().optional(),
  priority: DecisionPriority.default("MEDIUM"),

  options: z.array(DecisionOption).default([]),
  criteria: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).default([]),
  reopenTriggers: z.array(z.string()).default([]),
  rationale: DecisionRationale.default({ pros: [], cons: [], conditions: [] }),

  completeness: DecisionCompleteness.default({ score: 0, missingFields: [] }),
  linkage: DecisionLinkage.default({ linkedMeetingIds: [] }),
  merge: DecisionMerge.default({ mergeStatus: "NONE", requiresHumanApproval: true, mergeCandidates: [] }),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Decision = z.infer<typeof Decision>;
