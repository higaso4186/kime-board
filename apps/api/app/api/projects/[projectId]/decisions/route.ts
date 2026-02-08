import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { createDecision, listDecisionsByProject } from "@/repo/decisions";
import { parseJson, validate } from "@/lib/zod";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const owner = url.searchParams.get("owner") ?? undefined;
    const dueBefore = url.searchParams.get("dueBefore") ?? undefined;
    const limitStr = url.searchParams.get("limit") ?? undefined;
    const limit = limitStr ? Math.min(100, Math.max(1, Number(limitStr))) : 20;

    const decisions = await listDecisionsByProject(projectId, {
      status: status ?? undefined,
      owner,
      dueBefore,
      limit,
    });
    return jsonOk({ decisions });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

const CreateDecisionBody = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    const input = validate(CreateDecisionBody, await parseJson(req));
    const out = await createDecision(projectId, input);
    return jsonOk({ decisionId: out.decisionId });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
