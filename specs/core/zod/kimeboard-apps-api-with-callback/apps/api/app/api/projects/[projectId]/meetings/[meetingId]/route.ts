import { jsonError, jsonOk, toApiError } from "../../../../../../src/lib/http";
import { getMeeting } from "../../../../../../src/repo/meetings";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ meetingId: string }> }) {
  try {
    const { meetingId } = await ctx.params;
    const m = await getMeeting(meetingId);
    if (!m) return jsonError({ code: "NOT_FOUND", message: "Meeting not found", status: 404 });
    return jsonOk(m);
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
