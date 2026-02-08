import { jsonError, jsonOk, toApiError } from "../../../../../src/lib/http";
import { listMessages } from "../../../../../src/repo/chat";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await ctx.params;
    const url = new URL(req.url);
    const limitStr = url.searchParams.get("limit") ?? "50";
    const limit = Math.min(200, Math.max(1, Number(limitStr)));
    const messages = await listMessages(threadId, limit);
    return jsonOk({ messages });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
