import { z } from "zod";
import { jsonCreated, jsonError, toApiError } from "@/lib/http";
import { parseJson, validate } from "@/lib/zod";
import { createDecision } from "@/repo/decisions";

export const runtime = "nodejs";

const CreateDecisionRequest = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(CreateDecisionRequest, body);
    const out = await createDecision(projectId, input);
    return jsonCreated({ decisionId: out.decisionId });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
