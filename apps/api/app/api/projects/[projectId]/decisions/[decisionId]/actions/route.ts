import { CreateActionRequest, CreateActionResponse } from "@/shared";
import { parseJson, validate } from "@/lib/zod";
import { jsonCreated, jsonError, toApiError } from "@/lib/http";
import { createAction } from "@/repo/actions";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    const input = validate(CreateActionRequest, await parseJson(req));
    const out = await createAction(projectId, decisionId, input);
    return jsonCreated(CreateActionResponse.parse({ actionId: out.actionId }));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
