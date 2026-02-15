import { jsonCreated, jsonError, toApiError } from "@/lib/http";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";
import { ensureDemoThread, getDemoThreadId } from "@/demo/store";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string; decisionId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { projectId, decisionId } = await ctx.params;
    const threadId = await ensureDemoThread(projectId, decisionId);
    return jsonCreated({ threadId });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
