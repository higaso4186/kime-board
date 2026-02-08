import { z } from "zod";
import { parseJson, validate } from "@/lib/zod";
import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { linkMeetingToDecision } from "@/repo/decisions";

export const runtime = "nodejs";

const Body = z.object({ meetingId: z.string().min(1) });

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(Body, body);
    const d = await linkMeetingToDecision(projectId, decisionId, input.meetingId);
    if (!d) return jsonError({ code: "NOT_FOUND", message: "Decision not found", status: 404 });
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
