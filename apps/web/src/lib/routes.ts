export const ROUTES = {
  projects: "/projects",
  projectHome: (projectId: string) => `/p/${projectId}`,
  meetings: (projectId: string) => `/p/${projectId}/meetings`,
  meetingNew: (projectId: string) => `/p/${projectId}/meetings/new`,
  meetingDetail: (projectId: string, meetingId: string) =>
    `/p/${projectId}/meetings/${meetingId}`,
  meetingAgenda: (projectId: string, meetingId: string) =>
    `/p/${projectId}/meetings/${meetingId}#agenda`,
  decisions: (projectId: string) => `/p/${projectId}/decisions`,
  decisionDetail: (projectId: string, decisionId: string) =>
    `/p/${projectId}/decisions/${decisionId}`,
  chat: (projectId: string, decisionId?: string) =>
    `/p/${projectId}/chat${decisionId ? `?decisionId=${decisionId}` : ""}`,
  exec: (projectId: string) => `/p/${projectId}/exec`,
  members: (projectId: string) => `/p/${projectId}/settings/members`,
};
