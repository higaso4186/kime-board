import { jsonCreated, jsonError, jsonOk, toApiError } from "@/lib/http";
import { parseJson, validate } from "@/lib/zod";
import { requireFirebaseAuth } from "@/lib/require-firebase-auth";
import { listDemoProjects } from "@/demo/data";
import { createDemoProject } from "@/demo/store";
import { z } from "zod";

export const runtime = "nodejs";

const CreateProjectBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    await requireFirebaseAuth(req);
    const projects = await listDemoProjects();
    return jsonOk({ projects });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

export async function POST(req: Request) {
  try {
    await requireFirebaseAuth(req);
    const body = await parseJson(req);
    const input = validate(CreateProjectBody, body);
    const project = await createDemoProject({
      name: input.name,
      description: input.description,
    });
    return jsonCreated({ projectId: project.projectId, project });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
