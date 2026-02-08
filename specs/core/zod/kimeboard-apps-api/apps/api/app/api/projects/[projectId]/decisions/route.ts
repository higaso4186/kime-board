import { jsonError, jsonOk, toApiError } from "../../../../../src/lib/http";
import { listDecisionsByProject } from "../../../../../src/repo/decisions";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const limitStr = url.searchParams.get("limit") ?? undefined;
    const limit = limitStr ? Math.min(100, Math.max(1, Number(limitStr))) : 20;

    const decisions = await listDecisionsByProject(projectId, { status: status ?? undefined, limit });
    return jsonOk({ decisions });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
