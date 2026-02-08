import { BulkCreateActionsRequest } from "@/shared";
import { parseJson, validate } from "@/lib/zod";
import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { bulkCreateActions } from "@/repo/actions";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(BulkCreateActionsRequest, body);
    const out = await bulkCreateActions(projectId, decisionId, input.actions);
    return jsonOk({ created: out.created, actionIds: out.actionIds });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
