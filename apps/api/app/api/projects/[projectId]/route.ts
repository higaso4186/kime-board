import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { getProject } from "@/repo/projects";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const p = await getProject(projectId);
    if (!p) return jsonError({ code: "NOT_FOUND", message: "Project not found", status: 404 });
    return jsonOk({ project: p });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
