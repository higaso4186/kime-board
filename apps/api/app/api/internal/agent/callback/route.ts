import { parseJson, validate } from "@/lib/zod";
import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { requireAgentToken } from "@/lib/auth";
import { patchMeeting } from "@/repo/meetings";
import { upsertDecisionsFromAgent } from "@/repo/decisions_agent";
import { ensureDecisionThread, postQuestionSet } from "@/repo/questions_agent";
import { patchDecision } from "@/repo/decisions";
import { bulkCreateActions } from "@/repo/actions";
import { createNotification } from "@/repo/notifications";
import { AgentCallbackUnion } from "./_schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    requireAgentToken(req);
    const input = validate(AgentCallbackUnion, await parseJson(req));

    if (input.status === "FAILED") {
      await createNotification(input.projectId, {
        eventType: "AGENT_RUN_FAILED",
        title: "Agent run failed",
        body: typeof input.error === "string" ? input.error : "See agent logs for details",
        link: { route: "/projects" },
        createdBy: "AGENT",
      }).catch(() => {});
      return jsonOk({ ok: true, status: "FAILED_RECEIVED" });
    }

    if (input.kind === "meeting_structurer") {
      const decisionIds = await upsertDecisionsFromAgent(input.projectId, input.meetingId, input.extracted.decisions);

      await patchMeeting(input.projectId, input.meetingId, {
        status: "DONE",
        extracted: { decisionIds },
        agent: { lastRunStatus: "SUCCEEDED", lastRunAt: new Date().toISOString() },
      });

      for (const qs of input.extracted.questionSets) {
        let decisionId = qs.decisionRef.decisionId;
        if (!decisionId && qs.decisionRef.title) {
          const matched = input.extracted.decisions.find((d) => d.title === qs.decisionRef.title);
          decisionId = matched?.decisionId;
        }
        if (!decisionId) continue;

        const { threadId } = await ensureDecisionThread(input.projectId, decisionId, {
          actionId: qs.decisionRef.actionId,
        });

        const missingFields = Array.from(new Set(qs.questions.map((q) => `${q.maps_to.targetType}.${q.maps_to.field}`)));
        await postQuestionSet(threadId, {
          projectId: input.projectId,
          decisionId,
          actionId: qs.decisionRef.actionId,
          questions: qs.questions,
          missingFields,
          hint: qs.hint,
        });
      }

      await createNotification(input.projectId, {
        eventType: "DECISION_NEEDS_INFO",
        title: "Meeting analysis completed",
        body: `Upserted ${decisionIds.length} decision candidates`,
        link: { route: `/p/${input.projectId}/decisions` },
        createdBy: "AGENT",
      }).catch(() => {});

      return jsonOk({ ok: true, applied: { meetingId: input.meetingId, decisionIds } });
    }

    if (input.kind === "reply_integrator") {
      const patch: any = {};
      if (input.appliedPatch.ownerDisplayName) patch.owner = { displayName: input.appliedPatch.ownerDisplayName };
      if (input.appliedPatch.dueAt) patch.dueAt = input.appliedPatch.dueAt;
      if (input.appliedPatch.criteria) patch.criteria = input.appliedPatch.criteria;
      if (input.appliedPatch.assumptions) patch.assumptions = input.appliedPatch.assumptions;
      if (input.appliedPatch.reopenTriggers) patch.reopenTriggers = input.appliedPatch.reopenTriggers;
      if (input.appliedPatch.rationale) {
        patch.rationale = {
          pros: input.appliedPatch.rationale.pros ?? [],
          cons: input.appliedPatch.rationale.cons ?? [],
          conditions: input.appliedPatch.rationale.conditions ?? [],
        };
      }
      if (input.appliedPatch.options) {
        patch.options = input.appliedPatch.options.map((o, idx) => ({
          id: `opt_${idx + 1}`,
          label: o.label,
          description: o.description,
          recommended: o.recommended,
        }));
      }

      const updated = await patchDecision(input.projectId, input.decisionId, patch);
      if (!updated) return jsonError({ code: "NOT_FOUND", message: "Decision not found", status: 404 });

      await createNotification(input.projectId, {
        eventType: "DECISION_READY_TO_DECIDE",
        title: "Reply integrated",
        body: "Decision fields were updated from answer set",
        link: { route: `/p/${input.projectId}/decisions/${input.decisionId}` },
        createdBy: "AGENT",
      }).catch(() => {});

      return jsonOk({ ok: true, applied: { decisionId: input.decisionId } });
    }

    if (input.kind === "draft_actions_skill") {
      const actions = input.draftActions.map((a) => ({
        type: a.type,
        title: a.title,
        description: a.description,
        dueAt: a.dueAt,
        assignee: a.assigneeDisplayName ? { displayName: a.assigneeDisplayName } : undefined,
      }));

      const out = await bulkCreateActions(input.projectId, input.decisionId, actions);

      await createNotification(input.projectId, {
        eventType: "DRAFT_ACTIONS_CREATED",
        title: "Action drafts created",
        body: `Created ${out.created} actions`,
        link: { route: `/p/${input.projectId}/decisions/${input.decisionId}` },
        createdBy: "AGENT",
      }).catch(() => {});

      return jsonOk({ ok: true, applied: { decisionId: input.decisionId, created: out.created } });
    }

    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
