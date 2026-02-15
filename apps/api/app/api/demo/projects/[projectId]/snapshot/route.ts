import { getDemoProjectSnapshot } from "@/demo/data";
import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { projectId } = await ctx.params;
    const snapshot = await getDemoProjectSnapshot(projectId);
    if (!snapshot) {
      return jsonError({
        code: "NOT_FOUND",
        message: "Project not found",
        status: 404,
      });
    }
    return jsonOk(snapshot);
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
