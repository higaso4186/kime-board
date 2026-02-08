import { PatchDecisionRequest, PatchDecisionResponse } from "@kimeboard/shared";
import { parseJson, validate } from "../../../../../../src/lib/zod";
import { jsonError, jsonOk, toApiError } from "../../../../../../src/lib/http";
import { getDecision, patchDecision } from "../../../../../../src/repo/decisions";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ decisionId: string }> }) {
  try {
    const { decisionId } = await ctx.params;
    const d = await getDecision(decisionId);
    if (!d) return jsonError({ code: "NOT_FOUND", message: "Decision not found", status: 404 });
    return jsonOk({ decision: d });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ decisionId: string }> }) {
  try {
    const { decisionId } = await ctx.params;
    const body = await parseJson(req);
    const patch = validate(PatchDecisionRequest, body);
    const d = await patchDecision(decisionId, patch);
    if (!d) return jsonError({ code: "NOT_FOUND", message: "Decision not found", status: 404 });
    return jsonOk(PatchDecisionResponse.parse({ decision: d }));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
