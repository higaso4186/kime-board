import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { parseJson, validate } from "@/lib/zod";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";
import { patchDemoDecision } from "@/demo/store";
import { z } from "zod";

export const runtime = "nodejs";

const PatchDecisionBody = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["NEEDS_INFO", "READY_TO_DECIDE", "DECIDED", "REOPEN"]).optional(),
  owner: z.string().optional(),
  dueAt: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ projectId: string; decisionId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { projectId, decisionId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(PatchDecisionBody, body);
    const decision = await patchDemoDecision(projectId, decisionId, {
      title: input.title,
      status: input.status,
      owner: input.owner,
      dueAt: input.dueAt ?? undefined,
    });
    if (!decision) {
      return jsonError({
        code: "NOT_FOUND",
        message: "Decision not found",
        status: 404,
      });
    }
    return jsonOk({ decision });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
