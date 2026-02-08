import { PatchDecisionRequest, PatchDecisionResponse } from "@/shared";
import { parseJson, validate } from "@/lib/zod";
import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { getDecision, patchDecision } from "@/repo/decisions";
import { listActionsByDecision } from "@/repo/actions";
import { refs } from "@/lib/firestore";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    const d = await getDecision(projectId, decisionId);
    if (!d) return jsonError({ code: "NOT_FOUND", message: "Decision not found", status: 404 });
    const actions = await listActionsByDecision(projectId, decisionId);
    const threadSnap = await refs.threads(projectId, decisionId).limit(1).get();
    const threadId = threadSnap.empty ? undefined : (threadSnap.docs[0].data() as any).threadId;
    return jsonOk({ decision: d, actions, threadId });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    const body = await parseJson(req);
    const patchInput = validate(PatchDecisionRequest, body);
    const patch = { ...patchInput } as Record<string, unknown>;
    if (patchInput.ownerUserId) {
      patch.owner = { ...(patchInput.owner ?? {}), userId: patchInput.ownerUserId };
      delete patch.ownerUserId;
    }
    if (patchInput.reopenTrigger) {
      patch.reopenTriggers = patchInput.reopenTrigger;
      delete patch.reopenTrigger;
    }
    const d = await patchDecision(projectId, decisionId, patch);
    if (!d) return jsonError({ code: "NOT_FOUND", message: "Decision not found", status: 404 });
    return jsonOk(PatchDecisionResponse.parse({ decision: d }));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
