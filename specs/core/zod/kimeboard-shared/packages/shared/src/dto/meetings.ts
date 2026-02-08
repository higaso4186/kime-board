import { z } from "zod";

export const CreateMeetingRequest = z.object({
  title: z.string().min(1),
  heldAt: z.string().datetime().optional(),
  participants: z.array(z.string()).optional(),
  sourceType: z.enum(["PASTE", "NOTION", "TLDV", "WEBHOOK", "API"]).default("PASTE"),
  rawText: z.string().min(1),
});
export type CreateMeetingRequest = z.infer<typeof CreateMeetingRequest>;

export const CreateMeetingResponse = z.object({
  meetingId: z.string().min(1),
  status: z.literal("ANALYZING"),
});
export type CreateMeetingResponse = z.infer<typeof CreateMeetingResponse>;
