export const ROUTES = {
  projects: "/projects",
  projectHome: "/p/:projectId",
  meetingNew: "/p/:projectId/meetings/new",
  meetingDetail: "/p/:projectId/meetings/:meetingId",
  decisionBacklog: "/p/:projectId/decisions",
  decisionDetail: "/p/:projectId/decisions/:decisionId",
  agendaNew: "/p/:projectId/agendas/new",
  execView: "/p/:projectId/exec",
} as const;
