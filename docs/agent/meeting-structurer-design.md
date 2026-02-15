# Meeting Structurer Design

## 1. 目的
- 会議メモ（raw text）から `Decision` 候補を抽出する。
- 抽出と同時に不足情報（missing fields）を判定し、質問生成（`gap_questioner`）につなげる。
- API callback (`/api/internal/agent/callback`) へ `meeting_structurer` 結果を返す。

## 2. 入出力
- 入力:
  - task payload: `projectId`, `meetingId`, `idempotencyKey?`
  - API: `GET /api/projects/{projectId}/meetings/{meetingId}`
  - API: `GET /api/projects/{projectId}/decisions?limit=N`（既存決裁候補）
- 出力:
  - callback kind: `meeting_structurer`
  - `extracted.decisions[]`: `AgentDecisionExtract`
  - `extracted.questionSets[]`: `QuestionSet`

## 3. 抽出ルール
- ブロック開始判定（行頭prefix）:
  - `決裁:`, `decision:`, `意思決定:`, `論点:`
- 詳細行の抽出:
  - `選択肢:` / `options:` -> options
  - `基準:` / `criteria:` -> criteria
  - `決裁者:` / `owner:` -> owner
  - `期限:` / `due:` / `dueAt:` -> dueAt
  - `前提:` / `assumptions:` -> assumptions
  - `再審条件:` / `reopen:` / `reopenTriggers:` -> reopenTriggers
  - `理由+:` / `pros:` -> rationale.pros
  - `理由-:` / `cons:` -> rationale.cons
  - `条件:` / `conditions:` -> rationale.conditions
- どのprefixにも一致しない行は `notes` として summary 候補に蓄積。

## 4. 不足判定
- 判定対象:
  - `owner`
  - `dueAt`
  - `criteria`
  - `options`（2件未満は不足）
  - `rationale`（pros/cons/conditions が全て空）
- 補完スコア:
  - `100 - 20 * missing_count`（最低0）
- ステータス:
  - 不足あり: `NEEDS_INFO`
  - 不足なし: `READY_TO_DECIDE`

## 5. 既存決裁とのマッチ
- 完全一致:
  - タイトル正規化（空白除去+lowercase）で一致
- 緩和一致:
  - token overlap score = `|A ∩ B| / |A ∪ B|`
  - 閾値 `0.6` 以上で既存 `decisionId` を採用
- 閾値未満:
  - 新規 `decisionId` 発行

### 0.6 の意図
- 誤マージ回避を優先しつつ、同義語を含む軽微な表記揺れを拾うための保守的閾値。
- 0.5 以下は別議題誤結合リスクが上がり、0.7 以上は再利用率が低下しやすい。

## 6. gap_questioner 連携
- 抽出済み Decision を `Decision` モデル化して `generate_question_set` に渡す。
- `questionSets` の `decisionRef` には callback 適用時に追跡できるよう `decisionId` と `title` を保持。

## 7. 失敗時
- callback status `FAILED` を API に返却。
- API 側で通知 (`AGENT_RUN_FAILED`) を発行可能な状態にする。
