import { z } from "zod";

export const AgentCallbackBase = z.object({
  projectId: z.string().min(1),
  runId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1).optional(),
  kind: z.enum(["meeting_structurer", "reply_integrator", "draft_actions_skill"]),
  status: z.enum(["SUCCEEDED", "FAILED"]),
  error: z.any().optional(),
  meta: z.any().optional(),
});

export const AgentMeetingStructurerCallback = AgentCallbackBase.extend({
  kind: z.literal("meeting_structurer"),
  meetingId: z.string().min(1),
  extracted: z.object({
    decisions: z
      .array(
        z.object({
          decisionId: z.string().optional(),
          title: z.string().min(1),
          summary: z.string().optional(),
          tags: z.array(z.string()).optional(),
          ownerDisplayName: z.string().optional(),
          dueAt: z.string().datetime().optional(),
          priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
          options: z
            .array(
              z.object({
                label: z.string().min(1),
                description: z.string().optional(),
                recommended: z.boolean().optional(),
              })
            )
            .optional(),
          criteria: z.array(z.string()).optional(),
          assumptions: z.array(z.string()).optional(),
          reopenTriggers: z.array(z.string()).optional(),
          rationale: z
            .object({
              pros: z.array(z.string()).optional(),
              cons: z.array(z.string()).optional(),
              conditions: z.array(z.string()).optional(),
            })
            .optional(),
        })
      )
      .default([]),
    questionSets: z
      .array(
        z.object({
          decisionRef: z.object({
            decisionId: z.string().optional(),
            title: z.string().optional(),
            actionId: z.string().optional(),
          }),
          hint: z.string().optional(),
          questions: z
            .array(
              z.object({
                qid: z.string().min(1),
                type: z.enum(["single_select", "multi_select", "date", "text"]),
                text: z.string().min(1),
                options: z.array(z.string()).optional(),
                required: z.boolean().optional(),
                maps_to: z.object({
                  targetType: z.enum(["DECISION", "ACTION"]),
                  field: z.string().min(1),
                }),
              })
            )
            .min(1),
        })
      )
      .default([]),
  }),
});

export const AgentReplyIntegratorCallback = AgentCallbackBase.extend({
  kind: z.literal("reply_integrator"),
  decisionId: z.string().min(1),
  threadId: z.string().min(1),
  appliedPatch: z
    .object({
      ownerDisplayName: z.string().optional(),
      dueAt: z.string().datetime().optional(),
      criteria: z.array(z.string()).optional(),
      options: z
        .array(
          z.object({
            label: z.string().min(1),
            description: z.string().optional(),
            recommended: z.boolean().optional(),
          })
        )
        .optional(),
      assumptions: z.array(z.string()).optional(),
      reopenTriggers: z.array(z.string()).optional(),
      rationale: z
        .object({
          pros: z.array(z.string()).optional(),
          cons: z.array(z.string()).optional(),
          conditions: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .default({}),
});

export const AgentDraftActionsCallback = AgentCallbackBase.extend({
  kind: z.literal("draft_actions_skill"),
  decisionId: z.string().min(1),
  draftActions: z
    .array(
      z.object({
        type: z.enum(["PREP", "EXEC"]),
        title: z.string().min(1),
        description: z.string().optional(),
        dueAt: z.string().datetime().optional(),
        assigneeDisplayName: z.string().optional(),
      })
    )
    .default([]),
});

export const AgentCallbackUnion = z.union([
  AgentMeetingStructurerCallback,
  AgentReplyIntegratorCallback,
  AgentDraftActionsCallback,
]);
