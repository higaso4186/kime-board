import { PostMessageRequest, PostMessageResponse } from "@/shared";
import { parseJson, validate } from "@/lib/zod";
import { jsonCreated, jsonError, jsonOk, toApiError } from "@/lib/http";
import { getThread, listMessages, postMessage } from "@/repo/chat";
import { enqueueJsonTask } from "@/lib/tasks";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await ctx.params;
    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
    const messages = await listMessages(threadId, limit);
    return jsonOk({ messages });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(PostMessageRequest, body);
    const out = await postMessage(threadId, input);
    if (!out) return jsonError({ code: "NOT_FOUND", message: "Thread not found", status: 404 });

    if (input.format === "ANSWER_SET") {
      const thread = await getThread(threadId);
      const decisionId =
        (input as any)?.relatesTo?.decisionId ??
        (input.metadata as any)?.decisionId ??
        thread?.decisionId;
      const projectId =
        (input as any)?.relatesTo?.projectId ??
        (input.metadata as any)?.projectId ??
        thread?.projectId;
      if (decisionId && projectId) {
        await enqueueJsonTask(
          "reply_integrator",
          { projectId, decisionId, threadId, messageId: out.messageId },
          out.messageId
        );
      }
    }

    return jsonCreated(PostMessageResponse.parse(out));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
