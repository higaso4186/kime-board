import { jsonCreated, jsonError, toApiError } from "@/lib/http";
import { parseJson, validate } from "@/lib/zod";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";
import { createDemoMeeting } from "@/demo/store";
import { z } from "zod";

export const runtime = "nodejs";

const CreateMeetingBody = z.object({
  title: z.string().min(1),
  heldAt: z.string().optional(),
  participants: z.array(z.string()).optional(),
  rawText: z.string().min(1),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { projectId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(CreateMeetingBody, body);
    const meeting = await createDemoMeeting(projectId, {
      title: input.title,
      heldAt: input.heldAt,
      participants: input.participants,
      rawText: input.rawText,
    });
    return jsonCreated({
      meetingId: meeting.meetingId,
      status: meeting.status,
      meeting,
    });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
