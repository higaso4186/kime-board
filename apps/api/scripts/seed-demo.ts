import { Firestore } from "@google-cloud/firestore";

const projectId = process.env.FIRESTORE_PROJECT_ID || "demo-kimeboard";
const db = new Firestore({ projectId, ignoreUndefinedProperties: true });

const now = new Date().toISOString();
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

async function main() {
  const projectRef = db.collection("projects").doc("prj_01");
  const decisionRef1 = projectRef.collection("decisions").doc("dcs_01");
  const decisionRef2 = projectRef.collection("decisions").doc("dcs_02");
  const meetingRef = projectRef.collection("meetings").doc("mtg_01");
  const actionRef1 = decisionRef1.collection("actions").doc("act_01");
  const threadRef = decisionRef1.collection("threads").doc("thr_01");
  const messageRef1 = threadRef.collection("messages").doc("msg_01");
  const messageRef2 = threadRef.collection("messages").doc("msg_02");
  const notificationRef = projectRef.collection("notifications").doc("ntf_01");

  const batch = db.batch();
  batch.set(projectRef, {
    projectId: "prj_01",
    name: "営業DX刷新",
    description: "デモ用プロジェクト",
    status: "ACTIVE",
    counters: {
      decisions_total: 2,
      decisions_open: 2,
      decisions_needs_info: 1,
      decisions_ready: 1,
      decisions_reopen: 0,
      decisions_owner_missing: 0,
      actions_overdue: 0,
      meetings_total: 1,
      meetings_analyzing: 0,
    },
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
    lastMeetingAt: now,
    lastDecisionUpdatedAt: now,
  });

  batch.set(meetingRef, {
    meetingId: "mtg_01",
    projectId: "prj_01",
    title: "Q2 商談優先度決め",
    heldAt: now,
    participants: ["SH", "営業責任者"],
    source: { type: "PASTE" },
    raw: { storage: "FIRESTORE", text: "商談優先度を再評価する必要がある" },
    status: "DONE",
    extracted: { decisionIds: ["dcs_01", "dcs_02"] },
    createdAt: now,
    updatedAt: now,
  });

  batch.set(decisionRef1, {
    decisionId: "dcs_01",
    projectId: "prj_01",
    title: "重点商談の優先度再配分",
    status: "NEEDS_INFO",
    priority: "HIGH",
    owner: { userId: "u_01", displayName: "佐藤" },
    dueAt: nextWeek,
    options: [
      { id: "opt_1", label: "Aランク案件優先" },
      { id: "opt_2", label: "既存案件維持" }
    ],
    criteria: ["売上見込み", "失注リスク"],
    assumptions: ["来週中に営業工数を確保できる"],
    reopenTriggers: [],
    rationale: { pros: ["売上最大化"], cons: ["担当偏り"], conditions: ["承認が必要"] },
    completeness: { score: 72, missingFields: ["rationale"] },
    linkage: { linkedMeetingIds: ["mtg_01"] },
    merge: { mergeStatus: "NONE", requiresHumanApproval: true, mergeCandidates: [] },
    ownerMissing: false,
    dueMissing: false,
    criteriaMissing: false,
    optionsCount: 2,
    linkedMeetingCount: 1,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(decisionRef2, {
    decisionId: "dcs_02",
    projectId: "prj_01",
    title: "新規キャンペーンのGo/NoGo",
    status: "READY_TO_DECIDE",
    priority: "MEDIUM",
    owner: { userId: "u_02", displayName: "鈴木" },
    dueAt: nextWeek,
    options: [
      { id: "opt_1", label: "Go" },
      { id: "opt_2", label: "NoGo" }
    ],
    criteria: ["CPA", "受注率"],
    assumptions: ["予算は追加可能"],
    reopenTriggers: ["CPAが閾値を超過"],
    rationale: { pros: ["リード増"], cons: ["コスト増"], conditions: ["週次レビュー"] },
    completeness: { score: 90, missingFields: [] },
    linkage: { linkedMeetingIds: ["mtg_01"] },
    merge: { mergeStatus: "NONE", requiresHumanApproval: true, mergeCandidates: [] },
    ownerMissing: false,
    dueMissing: false,
    criteriaMissing: false,
    optionsCount: 2,
    linkedMeetingCount: 1,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(actionRef1, {
    actionId: "act_01",
    projectId: "prj_01",
    decisionId: "dcs_01",
    type: "PREP",
    title: "商談リスト更新",
    assignee: { userId: "u_03", displayName: "高橋" },
    dueAt: nextWeek,
    status: "TODO",
    createdAt: now,
    updatedAt: now,
  });

  batch.set(threadRef, {
    threadId: "thr_01",
    projectId: "prj_01",
    decisionId: "dcs_01",
    scopeType: "DECISION",
    scopeId: "dcs_01",
    channel: "IN_APP",
    title: "不足質問",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  });

  batch.set(messageRef1, {
    messageId: "msg_01",
    threadId: "thr_01",
    senderType: "AGENT",
    format: "QUESTION_SET",
    content: "不足している根拠を教えてください。",
    metadata: {
      questions: [
        {
          qid: "q_01",
          type: "text",
          text: "優先度再配分の懸念点は？",
          required: true,
          maps_to: { targetType: "DECISION", field: "rationale" }
        }
      ]
    },
    relatesTo: { projectId: "prj_01", decisionId: "dcs_01" },
    createdAt: now,
  });

  batch.set(messageRef2, {
    messageId: "msg_02",
    threadId: "thr_01",
    senderType: "USER",
    format: "ANSWER_SET",
    content: "担当偏りの懸念があるため、調整案が必要です。",
    metadata: {
      answers: [{ qid: "q_01", value: "担当偏りの懸念があるため、調整案が必要です。" }]
    },
    relatesTo: { projectId: "prj_01", decisionId: "dcs_01" },
    createdAt: now,
  });

  batch.set(notificationRef, {
    notificationId: "ntf_01",
    projectId: "prj_01",
    eventType: "DECISION_NEEDS_INFO",
    title: "不足情報の確認",
    body: "重点商談の優先度再配分で追加確認が必要です。",
    link: { route: "/p/prj_01/decisions/dcs_01" },
    delivery: { channel: "IN_APP", status: "DELIVERED" },
    createdBy: "SYSTEM",
    createdAt: now,
  });

  await batch.commit();
  console.log("Seed completed for project prj_01");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
