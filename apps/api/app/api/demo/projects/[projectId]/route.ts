import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { parseJson, validate } from "@/lib/zod";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";
import { patchDemoProject } from "@/demo/store";
import { z } from "zod";

export const runtime = "nodejs";

const PatchProjectBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    await requireFirebaseAuth(req);
    const { projectId } = await ctx.params;
    const body = await parseJson(req);
    const input = validate(PatchProjectBody, body);
    const project = await patchDemoProject(projectId, input);
    if (!project) {
      return jsonError({
        code: "NOT_FOUND",
        message: "Project not found",
        status: 404,
      });
    }
    return jsonOk({ project });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
