import { CreateThreadRequest, CreateThreadResponse } from "@kimeboard/shared";
import { parseJson, validate } from "../../../../../../../../src/lib/zod";
import { jsonCreated, jsonError, toApiError } from "../../../../../../../../src/lib/http";
import { createThread } from "../../../../../../../../src/repo/chat";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(CreateThreadRequest, body);
    const out = await createThread({ projectId, decisionId, channel: input.channel });
    return jsonCreated(CreateThreadResponse.parse(out));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
