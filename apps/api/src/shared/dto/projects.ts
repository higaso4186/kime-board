import { z } from "zod";

export const CreateProjectRequest = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequest>;

export const CreateProjectResponse = z.object({
  projectId: z.string().min(1),
});
export type CreateProjectResponse = z.infer<typeof CreateProjectResponse>;
