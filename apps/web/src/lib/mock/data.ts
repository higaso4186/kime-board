export type DecisionStatus = "NEEDS_INFO" | "READY_TO_DECIDE" | "DECIDED" | "REOPEN";
export type MeetingStatus = "ANALYZING" | "DONE" | "FAILED";
export type ActionStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";

export type Project = {
  projectId: string;
  name: string;
  description: string;
  undecided: number;
  ready: number;
  overdue: number;
  missingOwner: number;
  nextMeetingAt: string;
};

export type Decision = {
  decisionId: string;
  projectId: string;
  title: string;
  summary: string;
  tag: string;
  status: DecisionStatus;
  owner?: string;
  dueAt?: string;
  meetingTitle?: string;
  priority: "高" | "中" | "低";
  readiness: number;
};

export type Meeting = {
  meetingId: string;
  projectId: string;
  title: string;
  heldAt: string;
  participants: string[];
  status: MeetingStatus;
  extractedDecisionIds: string[];
};

export type Action = {
  actionId: string;
  decisionId: string;
  projectId: string;
  title: string;
  type: "Prep" | "Exec";
  supportsDecisionId?: string;
  assignee?: string;
  dueAt?: string;
  status: ActionStatus;
};

export type MissingFieldKey =
  | "owner"
  | "dueAt"
  | "criteria"
  | "options"
  | "assignee"
  | "definitionOfDone"
  | "blockedReason";

export type QuestionSource = "agent" | "user";
export type QuestionTargetType = "DECISION" | "ACTION";
export type QuestionStatus = "OPEN" | "ANSWERED";

export type InsufficientQuestion = {
  questionId: string;
  projectId: string;
  decisionId: string;
  actionId?: string;
  targetType: QuestionTargetType;
  source: QuestionSource;
  title: string;
  prompt: string;
  missingFields: MissingFieldKey[];
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: QuestionStatus;
  createdAt: string;
  resolvedAt?: string;
};

export type ChatMessage = {
  messageId: string;
  threadId: string;
  projectId: string;
  decisionId: string;
  actionId?: string;
  questionId?: string;
  sender: QuestionSource;
  kind: "QUESTION" | "ANSWER" | "NOTE";
  text: string;
  createdAt: string;
};

export type SearchResult = {
  id: string;
  type: "decision" | "meeting" | "action";
  title: string;
  subtitle: string;
  href: string;
};

export const missingFieldLabels: Record<MissingFieldKey, string> = {
  owner: "決裁者",
  dueAt: "期限",
  criteria: "判断基準",
  options: "選択肢",
  assignee: "担当者",
  definitionOfDone: "完了条件",
  blockedReason: "ブロッカー理由",
};

export const projects: Project[] = [
  {
    projectId: "prj_01",
    name: "営業DX刷新",
    description: "商談情報の一元化と週次決裁サイクルの短縮",
    undecided: 24,
    ready: 7,
    overdue: 3,
    missingOwner: 5,
    nextMeetingAt: "2026-02-10T10:00:00+09:00",
  },
  {
    projectId: "prj_02",
    name: "採用広報Q2",
    description: "採用チャネル配分とメッセージ戦略",
    undecided: 11,
    ready: 4,
    overdue: 2,
    missingOwner: 2,
    nextMeetingAt: "2026-02-11T15:00:00+09:00",
  },
  {
    projectId: "prj_03",
    name: "CS運用改善",
    description: "一次応答 SLA とナレッジ更新フロー整備",
    undecided: 9,
    ready: 3,
    overdue: 1,
    missingOwner: 1,
    nextMeetingAt: "2026-02-12T11:00:00+09:00",
  },
];

export const decisions: Decision[] = [
  {
    decisionId: "dcs_01",
    projectId: "prj_01",
    title: "見積テンプレートを3種に統一する",
    summary: "見積入力の揺れを減らし、承認時間を短縮する。",
    tag: "運用",
    status: "NEEDS_INFO",
    owner: "",
    dueAt: "2026-02-15T18:00:00+09:00",
    meetingTitle: "週次PJ定例 2/8",
    priority: "高",
    readiness: 58,
  },
  {
    decisionId: "dcs_02",
    projectId: "prj_01",
    title: "インサイドセールスのKPI定義を改訂",
    summary: "商談化率の定義を一本化し、現場判断の差異を抑える。",
    tag: "組織",
    status: "READY_TO_DECIDE",
    owner: "本部長 佐藤",
    dueAt: "2026-02-13T18:00:00+09:00",
    meetingTitle: "週次PJ定例 2/8",
    priority: "中",
    readiness: 88,
  },
  {
    decisionId: "dcs_03",
    projectId: "prj_01",
    title: "顧客スコア算出ロジックをv2へ移行",
    summary: "過去6か月データでスコア精度を改善し優先度を再計算する。",
    tag: "技術",
    status: "DECIDED",
    owner: "PM 高橋",
    dueAt: "2026-02-20T18:00:00+09:00",
    meetingTitle: "ステアリング委員会",
    priority: "中",
    readiness: 100,
  },
  {
    decisionId: "dcs_04",
    projectId: "prj_01",
    title: "オンボーディング研修の必修化範囲",
    summary: "職種別に必修範囲を再定義し、離職率の上昇を抑える。",
    tag: "人材",
    status: "REOPEN",
    owner: "人事 伊藤",
    dueAt: "2026-02-18T18:00:00+09:00",
    meetingTitle: "月次レビュー",
    priority: "低",
    readiness: 72,
  },
];

export const meetings: Meeting[] = [
  {
    meetingId: "mtg_01",
    projectId: "prj_01",
    title: "週次PJ定例 2/8",
    heldAt: "2026-02-08T09:00:00+09:00",
    participants: ["本部長 佐藤", "PM 高橋", "営業Mgr 田中"],
    status: "ANALYZING",
    extractedDecisionIds: ["dcs_01", "dcs_02"],
  },
  {
    meetingId: "mtg_02",
    projectId: "prj_01",
    title: "ステアリング委員会",
    heldAt: "2026-02-05T16:00:00+09:00",
    participants: ["CRO", "本部長 佐藤", "PM 高橋"],
    status: "DONE",
    extractedDecisionIds: ["dcs_03"],
  },
  {
    meetingId: "mtg_03",
    projectId: "prj_01",
    title: "臨時課題整理",
    heldAt: "2026-02-03T13:00:00+09:00",
    participants: ["PM 高橋", "人事 伊藤"],
    status: "FAILED",
    extractedDecisionIds: ["dcs_04"],
  },
];

export const actions: Action[] = [
  {
    actionId: "act_01",
    decisionId: "dcs_02",
    projectId: "prj_01",
    title: "営業 KPI 新定義を資料化",
    type: "Prep",
    supportsDecisionId: "dcs_01",
    assignee: "PM 高橋",
    dueAt: "2026-02-11T17:00:00+09:00",
    status: "DOING",
  },
  {
    actionId: "act_02",
    decisionId: "dcs_01",
    projectId: "prj_01",
    title: "決裁者候補の確認",
    type: "Prep",
    assignee: "営業Mgr 田中",
    dueAt: "2026-02-10T12:00:00+09:00",
    status: "TODO",
  },
  {
    actionId: "act_05",
    decisionId: "dcs_01",
    projectId: "prj_01",
    title: "見積例外パターンを棚卸し",
    type: "Prep",
    assignee: "営業Mgr 田中",
    dueAt: "2026-02-12T18:00:00+09:00",
    status: "DOING",
  },
  {
    actionId: "act_06",
    decisionId: "dcs_01",
    projectId: "prj_01",
    title: "テンプレート移行の社内告知",
    type: "Exec",
    assignee: "BizOps 山口",
    dueAt: "2026-02-16T10:00:00+09:00",
    status: "TODO",
  },
  {
    actionId: "act_03",
    decisionId: "dcs_03",
    projectId: "prj_01",
    title: "v2 ロジックの本番適用",
    type: "Exec",
    assignee: "SRE 鈴木",
    dueAt: "2026-02-06T19:00:00+09:00",
    status: "BLOCKED",
  },
  {
    actionId: "act_07",
    decisionId: "dcs_02",
    projectId: "prj_01",
    title: "KPI定義変更に伴うダッシュボード改修",
    type: "Exec",
    assignee: "Data 石井",
    dueAt: "2026-02-18T12:00:00+09:00",
    status: "TODO",
  },
  {
    actionId: "act_08",
    decisionId: "dcs_02",
    projectId: "prj_01",
    title: "KPI改訂が研修設計へ与える影響を整理",
    type: "Prep",
    supportsDecisionId: "dcs_04",
    assignee: "人事 伊藤",
    dueAt: "2026-02-12T15:00:00+09:00",
    status: "TODO",
  },
  {
    actionId: "act_04",
    decisionId: "dcs_04",
    projectId: "prj_01",
    title: "研修対象の再集計",
    type: "Exec",
    supportsDecisionId: "dcs_02",
    assignee: "人事 伊藤",
    dueAt: "2026-02-07T19:00:00+09:00",
    status: "TODO",
  },
];

export const insufficientQuestions: InsufficientQuestion[] = [
  {
    questionId: "qst_01",
    projectId: "prj_01",
    decisionId: "dcs_01",
    targetType: "DECISION",
    source: "agent",
    title: "決裁者が未設定",
    prompt: "この決裁の最終決裁者を指定してください。",
    missingFields: ["owner"],
    priority: "HIGH",
    status: "OPEN",
    createdAt: "2026-02-08T09:21:00+09:00",
  },
  {
    questionId: "qst_02",
    projectId: "prj_01",
    decisionId: "dcs_01",
    targetType: "DECISION",
    source: "agent",
    title: "期限が未確定",
    prompt: "決裁期限を日付で入力してください。",
    missingFields: ["dueAt"],
    priority: "HIGH",
    status: "OPEN",
    createdAt: "2026-02-08T09:22:00+09:00",
  },
  {
    questionId: "qst_03",
    projectId: "prj_01",
    decisionId: "dcs_01",
    actionId: "act_02",
    targetType: "ACTION",
    source: "user",
    title: "Prep アクションの完了条件不足",
    prompt: "act_02 の完了条件が曖昧です。Definition of Done を追加したいです。",
    missingFields: ["definitionOfDone"],
    priority: "MEDIUM",
    status: "OPEN",
    createdAt: "2026-02-08T09:40:00+09:00",
  },
  {
    questionId: "qst_04",
    projectId: "prj_01",
    decisionId: "dcs_03",
    actionId: "act_03",
    targetType: "ACTION",
    source: "agent",
    title: "ブロッカー理由の明確化",
    prompt: "act_03 の BLOCKED 理由を具体化してください。",
    missingFields: ["blockedReason"],
    priority: "MEDIUM",
    status: "OPEN",
    createdAt: "2026-02-08T09:45:00+09:00",
  },
  {
    questionId: "qst_05",
    projectId: "prj_01",
    decisionId: "dcs_02",
    targetType: "DECISION",
    source: "user",
    title: "判断基準の粒度確認",
    prompt: "定量基準を数値で明記する必要がありますか？",
    missingFields: ["criteria"],
    priority: "LOW",
    status: "ANSWERED",
    createdAt: "2026-02-08T08:55:00+09:00",
    resolvedAt: "2026-02-08T09:05:00+09:00",
  },
];

export const chatMessages: ChatMessage[] = [
  {
    messageId: "msg_01",
    threadId: "thr_prj01_dcs01",
    projectId: "prj_01",
    decisionId: "dcs_01",
    questionId: "qst_01",
    sender: "agent",
    kind: "QUESTION",
    text: "この決裁の最終決裁者は誰ですか？",
    createdAt: "2026-02-08T09:21:05+09:00",
  },
  {
    messageId: "msg_02",
    threadId: "thr_prj01_dcs01",
    projectId: "prj_01",
    decisionId: "dcs_01",
    questionId: "qst_02",
    sender: "agent",
    kind: "QUESTION",
    text: "決める期限はいつにしますか？",
    createdAt: "2026-02-08T09:22:10+09:00",
  },
  {
    messageId: "msg_03",
    threadId: "thr_prj01_dcs01",
    projectId: "prj_01",
    decisionId: "dcs_01",
    questionId: "qst_01",
    sender: "user",
    kind: "ANSWER",
    text: "本部長 佐藤を決裁者にします。",
    createdAt: "2026-02-08T09:25:00+09:00",
  },
  {
    messageId: "msg_04",
    threadId: "thr_prj01_dcs01",
    projectId: "prj_01",
    decisionId: "dcs_01",
    actionId: "act_02",
    questionId: "qst_03",
    sender: "user",
    kind: "QUESTION",
    text: "act_02 の完了条件を明文化したいです。",
    createdAt: "2026-02-08T09:40:05+09:00",
  },
];

export const agentLogs = [
  "[t+0.3s] Decision候補: 3件抽出",
  "[t+0.8s] 既存Decisionへのマージ候補: 1件",
  "[t+1.2s] 不足質問: 2件生成",
];

export function getProject(projectId: string) {
  return projects.find((item) => item.projectId === projectId);
}

export function getProjectDecisions(projectId: string) {
  return decisions.filter((item) => item.projectId === projectId);
}

export function getDecision(projectId: string, decisionId: string) {
  return decisions.find(
    (item) => item.projectId === projectId && item.decisionId === decisionId,
  );
}

export function getProjectMeetings(projectId: string) {
  return meetings.filter((item) => item.projectId === projectId);
}

export function getMeeting(projectId: string, meetingId: string) {
  return meetings.find(
    (item) => item.projectId === projectId && item.meetingId === meetingId,
  );
}

export function getDecisionActions(projectId: string, decisionId: string) {
  return actions.filter(
    (item) => item.projectId === projectId && item.decisionId === decisionId,
  );
}

export function getProjectActions(projectId: string) {
  return actions.filter((item) => item.projectId === projectId);
}

export function getProjectQuestions(projectId: string) {
  return insufficientQuestions.filter((item) => item.projectId === projectId);
}

export function getOpenQuestions(projectId: string) {
  return getProjectQuestions(projectId).filter((item) => item.status === "OPEN");
}

export function getDecisionQuestions(projectId: string, decisionId: string) {
  return getProjectQuestions(projectId).filter((item) => item.decisionId === decisionId);
}

export function getOpenQuestionCountByDecision(projectId: string, decisionId: string) {
  return getOpenQuestions(projectId).filter((item) => item.decisionId === decisionId).length;
}

export function getChatMessages(projectId: string, decisionId?: string) {
  return chatMessages.filter(
    (item) =>
      item.projectId === projectId && (!decisionId || item.decisionId === decisionId),
  );
}

export function getMissingFieldLabel(field: MissingFieldKey) {
  return missingFieldLabels[field];
}

export function getQuestionTargetPath(question: InsufficientQuestion) {
  const decision = decisions.find((item) => item.decisionId === question.decisionId);
  if (question.targetType === "DECISION") {
    return `決裁: ${decision?.title ?? question.decisionId}`;
  }

  const action = actions.find((item) => item.actionId === question.actionId);
  return `決裁: ${decision?.title ?? question.decisionId} > アクション: ${action?.title ?? question.actionId}`;
}

export function searchProjectItems(projectId: string, query: string): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const d = getProjectDecisions(projectId)
    .filter((item) => item.title.includes(q) || item.summary.includes(q))
    .map((item) => ({
      id: item.decisionId,
      type: "decision" as const,
      title: item.title,
      subtitle: `${item.status} / ${item.owner || "決裁者未設定"}`,
      href: `/p/${projectId}/decisions/${item.decisionId}`,
    }));

  const m = getProjectMeetings(projectId)
    .filter((item) => item.title.includes(q))
    .map((item) => ({
      id: item.meetingId,
      type: "meeting" as const,
      title: item.title,
      subtitle: `${item.status} / ${item.heldAt.slice(0, 10)}`,
      href: `/p/${projectId}/meetings/${item.meetingId}`,
    }));

  const a = getProjectActions(projectId)
    .filter((item) => item.title.includes(q))
    .map((item) => ({
      id: item.actionId,
      type: "action" as const,
      title: item.title,
      subtitle: `${item.status} / ${item.assignee || "担当未設定"}`,
      href: `/p/${projectId}/decisions/${item.decisionId}`,
    }));

  return [...d, ...m, ...a].slice(0, 8);
}
