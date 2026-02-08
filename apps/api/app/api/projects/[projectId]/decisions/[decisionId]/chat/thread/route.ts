import { CreateThreadRequest, CreateThreadResponse } from "@/shared";
import { parseJson, validate } from "@/lib/zod";
import { jsonCreated, jsonError, toApiError } from "@/lib/http";
import { createThread } from "@/repo/chat";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; decisionId: string }> }) {
  try {
    const { projectId, decisionId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(CreateThreadRequest, body);
    const out = await createThread({
      projectId,
      decisionId,
      channel: input.channel,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      actionId: input.scopeType === "ACTION" ? input.scopeId : undefined,
      title: input.title,
    });
    return jsonCreated(CreateThreadResponse.parse(out));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
