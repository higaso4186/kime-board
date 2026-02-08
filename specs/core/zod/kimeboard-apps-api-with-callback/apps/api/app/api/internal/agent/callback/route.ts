import { parseJson, validate } from "../../../../src/lib/zod";
import { jsonError, jsonOk, toApiError } from "../../../../src/lib/http";
import { requireAgentToken } from "../../../../src/lib/auth";
import { AgentCallbackUnion } from "./_schemas";
import { patchMeeting } from "../../../../src/repo/meetings";
import { upsertDecisionsFromAgent } from "../../../../src/repo/decisions_agent";
import { ensureDecisionThread, postQuestionSet } from "../../../../src/repo/questions_agent";
import { patchDecision } from "../../../../src/repo/decisions";
import { bulkCreateActions } from "../../../../src/repo/actions";
import { createNotification } from "../../../../src/repo/notifications";

export const runtime = "nodejs";

/**
 * Single callback endpoint for Agent -> API.
 * POST /api/internal/agent/callback
 *
 * Security:
 * - Requires header `X-Agent-Token` matching env `AGENT_CALLBACK_TOKEN`.
 *
 * Idempotency:
 * - Agent can resend same callback. We follow "upsert" strategy.
 */
export async function POST(req: Request) {
  try {
    requireAgentToken(req);

    const body = await parseJson(req);
    const input = validate(AgentCallbackUnion, body);

    if (input.status === "FAILED") {
      // minimal failure visibility as notification (best-effort)
      await createNotification(input.projectId, {
        eventType: "AGENT_RUN_FAILED",
        title: "エージェント処理が失敗しました",
        body: typeof input.error === "string" ? input.error : "詳細はログを確認してください",
        link: { route: "/projects" },
      }).catch(() => {});
      return jsonOk({ ok: true, status: "FAILED_RECEIVED" });
    }

    // SUCCEEDED paths
    if (input.kind === "meeting_structurer") {
      // 1) upsert decisions
      const decisionIds = await upsertDecisionsFromAgent(input.projectId, input.meetingId, input.extracted.decisions);

      // 2) link meeting -> extracted decisionIds & mark meeting DONE
      await patchMeeting(input.meetingId, {
        status: "DONE",
        extracted: { decisionIds },
        agent: { lastRunStatus: "SUCCEEDED" },
      });

      // 3) question sets -> create threads + question messages
      for (const qs of input.extracted.questionSets) {
        // find decisionId: prefer explicit id, else match by title
        let decisionId = qs.decisionRef.decisionId;
        if (!decisionId && qs.decisionRef.title) {
          const matched = input.extracted.decisions.find(d => d.title === qs.decisionRef.title);
          decisionId = matched?.decisionId;
          // if agent did not supply decisionId, we can try to find by title in created ids:
          if (!decisionId) {
            // fallback: no-op
          }
        }
        if (!decisionId) continue;

        const { threadId } = await ensureDecisionThread(input.projectId, decisionId);
        await postQuestionSet(threadId, {
          projectId: input.projectId,
          decisionId,
          questions: qs.questions,
          hint: qs.hint,
        });
      }

      await createNotification(input.projectId, {
        eventType: "DECISION_NEEDS_INFO",
        title: "決裁候補を抽出しました",
        body: `会議から${decisionIds.length}件の決裁候補を抽出しました。`,
        link: { route: `/p/${input.projectId}/decisions` },
      }).catch(() => {});

      return jsonOk({ ok: true, applied: { meetingId: input.meetingId, decisionIds } });
    }

    if (input.kind === "reply_integrator") {
      // convert agent patch to Decision patch format
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

      const updated = await patchDecision(input.decisionId, patch);
      if (!updated) return jsonError({ code: "NOT_FOUND", message: "Decision not found", status: 404 });

      await createNotification(input.projectId, {
        eventType: "DECISION_READY_TO_DECIDE",
        title: "回答を反映しました",
        body: "不足情報の回答を反映し、決裁の状態を更新しました。",
        link: { route: `/p/${input.projectId}/decisions/${input.decisionId}` },
      }).catch(() => {});

      return jsonOk({ ok: true, applied: { decisionId: input.decisionId } });
    }

    if (input.kind === "draft_actions_skill") {
      // convert drafts to Action create payloads
      const actions = input.draftActions.map(a => ({
        type: a.type,
        title: a.title,
        description: a.description,
        dueAt: a.dueAt,
        assignee: a.assigneeDisplayName ? { displayName: a.assigneeDisplayName } : undefined,
      }));

      // Need projectId for action docs; in MVP the agent provides projectId (base)
      // decision->projectId is known from storage, but for simplicity use input.projectId.
      const out = await bulkCreateActions(input.projectId, input.decisionId, actions);

      await createNotification(input.projectId, {
        eventType: "DRAFT_ACTIONS_CREATED",
        title: "アクション素案を作成しました",
        body: `${out.created}件のアクション素案を追加しました。`,
        link: { route: `/p/${input.projectId}/decisions/${input.decisionId}` },
      }).catch(() => {});

      return jsonOk({ ok: true, applied: { decisionId: input.decisionId, created: out.created } });
    }

    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
