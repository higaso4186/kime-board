import type { DecisionStatus, MeetingStatus } from "../constants/status";

export const JA = {
  status: {
    decision: {
      NEEDS_INFO: "情報不足",
      READY_TO_DECIDE: "決められる",
      DECIDED: "確定",
      REOPEN: "再審",
      ARCHIVED: "アーカイブ",
    } satisfies Record<DecisionStatus, string>,
    meeting: {
      DRAFT: "下書き",
      ANALYZING: "解析中",
      DONE: "完了",
      FAILED: "失敗",
    } satisfies Record<MeetingStatus, string>,
  },
  ui: {
    cta: {
      addMeeting: "会議メモを追加",
      decide: "確定",
      generateActions: "素案生成",
    },
    hints: {
      missingOwner: "決裁者が未設定です",
      missingDue: "期限が未設定です",
    },
  },
} as const;
