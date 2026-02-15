import { jsonCreated, jsonError, toApiError } from "@/lib/http";
import { parseJson, validate } from "@/lib/zod";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";
import { createDemoDecision } from "@/demo/store";
import { z } from "zod";

export const runtime = "nodejs";

const CreateDecisionBody = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { projectId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(CreateDecisionBody, body);
    const decision = await createDemoDecision(projectId, input);
    return jsonCreated({ decisionId: decision.decisionId, decision });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
