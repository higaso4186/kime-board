import { GenerateAgendaRequest, GenerateAgendaResponse, buildAgendaDraft } from "@/shared";
import { parseJson, validate } from "@/lib/zod";
import { jsonError, jsonOk, toApiError } from "@/lib/http";
import { listDecisionsByProject } from "@/repo/decisions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const input = validate(GenerateAgendaRequest, await parseJson(req));
    const decisions = await listDecisionsByProject(input.projectId, { limit: 100 });
    const agendaDraft = buildAgendaDraft(decisions);
    const decisionIds = decisions.map((d) => d.decisionId);
    return jsonOk(GenerateAgendaResponse.parse({ agendaDraft, decisionIds }));
  } catch (e) {
    return jsonError(toApiError(e));
  }
}
