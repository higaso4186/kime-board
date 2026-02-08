import { z } from "zod";

export const ProjectRole = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);
export type ProjectRole = z.infer<typeof ProjectRole>;
