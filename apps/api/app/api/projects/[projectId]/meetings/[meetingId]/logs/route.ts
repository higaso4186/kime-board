import { z } from "zod";
import { parseJson, validate } from "@/lib/zod";
import { jsonCreated, jsonError, toApiError } from "@/lib/http";
import { appendMeetingLog } from "@/repo/meetings";

export const runtime = "nodejs";

const Body = z.object({
  line: z.string().min(1),
});

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; meetingId: string }> }) {
  try {
    const { projectId, meetingId } = await ctx.params;
    const input = validate(Body, await parseJson(req));
    const out = await appendMeetingLog(projectId, meetingId, input.line);
    return jsonCreated(out);
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
