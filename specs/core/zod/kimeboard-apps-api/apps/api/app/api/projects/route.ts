import { CreateProjectRequest, CreateProjectResponse } from "@kimeboard/shared";
import { parseJson, validate } from "../../../src/lib/zod";
import { jsonCreated, jsonError, toApiError } from "../../../src/lib/http";
import { createProject } from "../../../src/repo/projects";

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
