import { z } from "zod";
import { parseJson, validate } from "../../../../../../../src/lib/zod";
import { jsonError, jsonOk, toApiError } from "../../../../../../../src/lib/http";
import { linkMeetingToDecision } from "../../../../../../../src/repo/decisions";

export const runtime = "nodejs";

const Body = z.object({ meetingId: z.string().min(1) });

export async function POST(req: Request, ctx: { params: Promise<{ decisionId: string }> }) {
  try {
    const { decisionId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(Body, body);
    const d = await linkMeetingToDecision(decisionId, input.meetingId);
    if (!d) return jsonError({ code: "NOT_FOUND", message: "Decision not found", status: 404 });
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
