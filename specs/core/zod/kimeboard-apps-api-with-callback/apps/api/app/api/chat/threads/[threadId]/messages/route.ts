import { PostMessageRequest, PostMessageResponse } from "@kimeboard/shared";
import { parseJson, validate } from "../../../../../src/lib/zod";
import { jsonCreated, jsonError, toApiError } from "../../../../../src/lib/http";
import { postMessage } from "../../../../../src/repo/chat";
import { enqueueJsonTask } from "../../../../../src/lib/tasks";

export const runtime = "nodejs";

/**
 * MVP contract:
 * - If format=ANSWER_SET, API enqueues agent reply_integrator (requires metadata.decisionId in body for now).
 *   (Later: resolve decisionId via thread -> decision relationship)
 */
export async function POST(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(PostMessageRequest, body);
    const out = await postMessage(threadId, input);

    // If it's an answer set, kick integrator.
    if (input.format === "ANSWER_SET") {
      const decisionId = (input.metadata as any)?.decisionId as string | undefined;
      const projectId = (input.metadata as any)?.projectId as string | undefined;
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
