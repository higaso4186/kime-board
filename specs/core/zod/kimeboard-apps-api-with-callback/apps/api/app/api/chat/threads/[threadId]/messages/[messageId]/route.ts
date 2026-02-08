import { jsonError, jsonOk, toApiError } from "../../../../../../src/lib/http";
import { getMessage } from "../../../../../../src/repo/chat";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ threadId: string; messageId: string }> }) {
  try {
    const { threadId, messageId } = await ctx.params;
    const msg = await getMessage(threadId, messageId);
    if (!msg) return jsonError({ code: "NOT_FOUND", message: "Message not found", status: 404 });
    return jsonOk({ message: msg });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
