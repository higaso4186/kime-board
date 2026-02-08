# meeting_structurer.md

あなたのタスクは、会議メモ（rawText）から「Decision候補」を抽出し、構造化したJSON配列を出力することです。
併せて、Projectの既存Decision候補リスト（candidateDecisions）を参照し、同一の可能性が高い場合は `mergeCandidate` を付与してください。ただし**自動マージはしません**。

## 入力
- meeting:
  - meetingId
  - title
  - rawText（会議メモ本文）
- candidateDecisions: 既存Decisionの候補一覧（最大10件）
  - candidateDecisionId
  - title
  - summary
  - status
  - ownerDisplayName?
  - dueAt?
  - tags?

## 抽出対象（Decisionの定義）
Decisionとは、以下を満たすものです：
- 何かを決める必要がある（選択肢がある / 何を採用するか / 誰が決裁するか等）
- その結果、次のアクションが変わる
- まだ確定していない、または再検討が必要

※ 単なるToDoや作業報告はDecisionではありません。Decisionに繋がる「前提確認」や「条件」は `assumptions` / `conditions` に入れてください。

## 出力要件
- 出力は `DecisionExtract[]` のJSON配列のみ。
- 1会議で最大6件まで（それ以上は最重要のものを選ぶ）。
- `missingFields` と `completenessScore` は必須。
- `evidenceQuotes` は必要な場合のみ。会議文の短い引用（<=200文字）。

## マージ候補（mergeCandidate）の付与基準
- candidateDecisionsのタイトル/要約と、抽出したDecisionの内容が高い一致を示す場合：
  - `mergeCandidate.candidateDecisionId` を設定
  - `mergeCandidate.score` を 0.0〜1.0 で設定
  - `mergeCandidate.reason` を短く説明
- 一致が弱い場合は mergeCandidate を付けない（安易に付けない）

## フィールドの埋め方ガイド
- title: 一文で「何を決めるか」。例「配送会社をA/Bどちらにするか」
- summary: 1行要約（任意）
- options: 会議メモに選択肢があれば抽出。なければ空配列にせず、`missingFields` に "options" を入れる
- rationale:
  - pros/cons は会議で出た論点を箇条書き
  - conditions は「採用するならこの条件」の形式
- assumptions: 前提条件（未確認なら missingFields に "assumptions"）
- reopenTriggers: 「この条件が崩れたら再検討」を短く
- ownerSuggestion/dueSuggestion: 会議で明示があるか、強く示唆がある場合のみ。推測はしない
- criteria: 判断基準（納期/コスト/品質/リスク/顧客影響…）

## completenessScore の目安
- 0〜30: 何を決めるか曖昧 / 必須要素がほぼ無い
- 31〜60: Decisionは明確だが、owner/due/options/criteria の一部が不足
- 61〜85: 主要要素が揃い、決裁に回せる一歩手前
- 86〜100: そのまま決められる（READY_TO_DECIDE相当）

## 出力スキーマ（DecisionExtract）
各要素は次の形で出力：
{
  "title": "...",
  "summary": "...?",
  "tags": ["..."]?,
  "options": [{"id":"opt1","label":"...","description":"...?", "recommended": false?}]?,
  "criteria": ["..."]?,
  "assumptions": ["..."]?,
  "reopenTriggers": ["..."]?,
  "rationale": {"pros":[...], "cons":[...], "conditions":[...]},
  "ownerSuggestion": {"displayName":"...?", "reason":"...?"}?,
  "dueSuggestion": {"dueAtIso":"...?", "reason":"...?"}?,
  "mergeCandidate": {"candidateDecisionId":"...?", "score":0.0, "reason":"...?"}?,
  "missingFields": ["owner","dueAt","options","criteria","assumptions","reopenTriggers","rationale"] ,
  "completenessScore": 0,
  "evidenceQuotes": [{"meetingId":"...","text":"..."}]?
}

## 最終指示
今から、上記スキーマに厳密に従った **JSON配列のみ**を出力してください。
