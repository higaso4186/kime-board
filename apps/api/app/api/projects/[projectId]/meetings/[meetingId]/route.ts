import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { getMeeting } from "@/repo/meetings";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string; meetingId: string }> }) {
  try {
    const { projectId, meetingId } = await ctx.params;
    const m = await getMeeting(projectId, meetingId);
    if (!m) return jsonError({ code: "NOT_FOUND", message: "Meeting not found", status: 404 });
    return jsonOk({ meeting: m, extractedDecisionIds: m.extracted?.decisionIds ?? [] });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
