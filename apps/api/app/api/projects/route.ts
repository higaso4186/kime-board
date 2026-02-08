import { CreateProjectRequest, CreateProjectResponse } from "@/shared";
import { parseJson, validate } from "@/lib/zod";
import { jsonCreated, jsonError, jsonOk, toApiError } from "@/lib/http";
import { createProject, listProjects } from "@/repo/projects";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await parseJson(req);
    const input = validate(CreateProjectRequest, body);
    const out = await createProject(input);
    return jsonCreated(CreateProjectResponse.parse(out));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}

export async function GET() {
  try {
    const projects = await listProjects();
    return jsonOk({ projects });
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
