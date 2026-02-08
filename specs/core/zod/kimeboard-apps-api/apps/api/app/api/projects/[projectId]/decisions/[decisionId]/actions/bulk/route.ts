import { BulkCreateActionsRequest } from "@kimeboard/shared";
import { parseJson, validate } from "../../../../../../../../src/lib/zod";
import { jsonError, jsonOk, toApiError } from "../../../../../../../../src/lib/http";
import { bulkCreateActions } from "../../../../../../../../src/repo/actions";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(BulkCreateActionsRequest, body);
    const out = await bulkCreateActions(projectId, decisionId, input.actions);
    return jsonOk({ created: out.created });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
