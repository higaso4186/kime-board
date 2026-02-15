export const ROUTES = {
  login: "/login",
  signup: "/signup",
  projects: "/projects",
  /** プロジェクトを開いたときのデフォルト（決裁一覧） */
  projectHome: (projectId: string) => `/p/${projectId}/decisions`,
  /** 管理権限向けダッシュボード */
  projectDashboard: (projectId: string) => `/p/${projectId}/dashboard`,
  meetings: (projectId: string) => `/p/${projectId}/meetings`,
  meetingNew: (projectId: string) => `/p/${projectId}/meetings/new`,
  meetingDetail: (projectId: string, meetingId: string) =>
    `/p/${projectId}/meetings/${meetingId}`,
  meetingAgenda: (projectId: string, meetingId: string) =>
    `/p/${projectId}/meetings/${meetingId}#agenda`,
  decisions: (projectId: string) => `/p/${projectId}/decisions`,
  decisionNew: (projectId: string) => `/p/${projectId}/decisions/new`,
  decisionDetail: (projectId: string, decisionId: string) =>
    `/p/${projectId}/decisions/${decisionId}`,
  chat: (projectId: string, decisionId?: string) =>
    `/p/${projectId}/chat${decisionId ? `?decisionId=${decisionId}` : ""}`,
  exec: (projectId: string) => `/p/${projectId}/exec`,
  members: (projectId: string) => `/p/${projectId}/settings/members`,
};
