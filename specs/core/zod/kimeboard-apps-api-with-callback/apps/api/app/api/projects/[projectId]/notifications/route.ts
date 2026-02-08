import { CreateNotificationRequest, CreateNotificationResponse, ListNotificationsResponse } from "@kimeboard/shared";
import { parseJson, validate } from "../../../../../src/lib/zod";
import { jsonCreated, jsonError, jsonOk, toApiError } from "../../../../../src/lib/http";
import { createNotification, listNotifications } from "../../../../../src/repo/notifications";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(CreateNotificationRequest, body);
    const out = await createNotification(projectId, input);
    return jsonCreated(CreateNotificationResponse.parse(out));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const url = new URL(req.url);
    const limitStr = url.searchParams.get("limit") ?? "50";
    const limit = Math.min(200, Math.max(1, Number(limitStr)));
    const notifications = await listNotifications(projectId, limit);
    return jsonOk(ListNotificationsResponse.parse({ notifications }));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
