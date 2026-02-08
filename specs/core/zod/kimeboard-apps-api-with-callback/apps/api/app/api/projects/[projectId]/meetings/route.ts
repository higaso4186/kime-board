import { CreateMeetingRequest, CreateMeetingResponse } from "@kimeboard/shared";
import { parseJson, validate } from "../../../../../src/lib/zod";
import { jsonCreated, jsonError, toApiError } from "../../../../../src/lib/http";
import { createMeeting } from "../../../../../src/repo/meetings";
import { enqueueJsonTask } from "../../../../../src/lib/tasks";

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
      sourceType: input.sourceType,
      rawText: input.rawText,
    });

    // Kick agent via Cloud Tasks (idempotencyKey defaults to meetingId)
    await enqueueJsonTask("meeting_structurer", { projectId, meetingId: out.meetingId }, out.meetingId);

    return jsonCreated(CreateMeetingResponse.parse(out));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
