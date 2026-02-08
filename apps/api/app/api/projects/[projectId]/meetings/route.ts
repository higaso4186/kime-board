import { CreateMeetingRequest, CreateMeetingResponse } from "@/shared";
import { parseJson, validate } from "@/lib/zod";
import { jsonCreated, jsonError, toApiError } from "@/lib/http";
import { createMeeting } from "@/repo/meetings";
import { enqueueJsonTask } from "@/lib/tasks";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(CreateMeetingRequest, body);

    const out = await createMeeting({
      projectId,
      title: input.title,
      heldAt: input.heldAt,
      participants: input.participants,
      sourceType: input.sourceType ?? input.source ?? "PASTE",
      rawText: input.rawText,
    });

    // Kick agent via Cloud Tasks (idempotencyKey defaults to meetingId)
    await enqueueJsonTask("meeting_structurer", { projectId, meetingId: out.meetingId }, out.meetingId);

    return jsonCreated(CreateMeetingResponse.parse(out));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
