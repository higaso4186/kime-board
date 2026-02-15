import { jsonCreated, jsonError, jsonOk, toApiError } from "@/lib/http";
import { parseJson, validate } from "@/lib/zod";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";
import { postDemoMessage, listDemoMessagesByThread } from "@/demo/store";
import { z } from "zod";

export const runtime = "nodejs";

const PostMessageBody = z.object({
  senderType: z.enum(["USER", "AGENT", "SYSTEM"]),
  format: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  relatesTo: z
    .object({
      projectId: z.string(),
      decisionId: z.string().optional(),
      actionId: z.string().optional(),
    })
    .optional(),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ threadId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { threadId } = await ctx.params;
    const messages = await listDemoMessagesByThread(threadId);
    return jsonOk({ messages });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ threadId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { threadId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(PostMessageBody, body);
    const message = await postDemoMessage(threadId, {
      senderType: input.senderType,
      format: input.format,
      content: input.content,
      relatesTo: input.relatesTo,
      metadata: input.metadata,
    });
    return jsonCreated({ messageId: message.messageId });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
