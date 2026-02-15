import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";
import { createDemoDraftActions } from "@/demo/store";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string; decisionId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { projectId, decisionId } = await ctx.params;
    const actions = await createDemoDraftActions(projectId, decisionId);
    return jsonOk({ ok: true, actions: actions.length });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
