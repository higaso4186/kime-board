import { z } from "zod";

export const GenerateAgendaRequest = z.object({
  projectId: z.string().min(1),
  horizon: z.enum(["THIS_WEEK", "NEXT_WEEK", "CUSTOM"]).default("THIS_WEEK"),
});
export const GenerateAgendaResponse = z.object({
  agendaDraft: z.any(),
  decisionIds: z.array(z.string()),
});
