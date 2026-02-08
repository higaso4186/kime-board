import { jsonError, jsonOk, toApiError } from "../../../../../../../../src/lib/http";
import { enqueueJsonTask } from "../../../../../../../../src/lib/tasks";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    await enqueueJsonTask("draft_actions_skill", { projectId, decisionId }, `${decisionId}_draft_actions`);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
