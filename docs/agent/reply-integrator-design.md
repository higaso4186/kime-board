# Reply Integrator Design

## 1. 目的
- ユーザー回答（`ANSWER_SET` or 自由記述）を Decision patch に変換し、API callback で反映する。

## 2. 入力
- task payload: `projectId`, `decisionId`, `threadId`, `messageId`
- API取得:
  - `GET /api/projects/{projectId}/decisions/{decisionId}`
  - `GET /api/chat/threads/{threadId}/messages/{messageId}`

## 3. qid -> field マッピング
- `qid` の先頭トークンを field とみなす。
  - 例: `owner:1` -> `owner`
  - 例: `criteria_1` -> `criteria`
- サポート field:
  - owner
  - dueAt
  - criteria
  - options
  - assumptions
  - reopenTriggers
  - rationale

## 4. パッチ適用ルール
- owner -> `ownerDisplayName`
- dueAt -> ISO datetime に正規化（parse失敗時は無視）
- criteria/assumptions/reopenTriggers -> 配列に追加（重複は最後に除去）
- options -> `[{ label }]` 形式で追加
- rationale -> `rationale.pros` 側へ追加（現行実装）

## 5. 自由記述フォールバック
- `metadata.answers` が無い場合、本文行単位で簡易パース:
  - `20xx-xx-xx` パターン -> dueAt
  - `決裁者/オーナー/owner` を含む行 -> owner
  - `基準/criteria` を含む行 -> criteria
  - `選択肢/option` を含む行 -> options

## 6. safe_mode ガードレール
- `SAFE_MODE=true` 時:
  - options は `label` が空の要素を除外
  - 過剰補完を避け、明示入力のみ patch 化
- patch が空でも callback は成功として返し、API 側で no-op 反映可能。

## 7. API callback反映仕様（API側）
- owner/dueAt/criteria/options/assumptions/reopenTriggers/rationale を `patchDecision` に適用。
- 適用後に readiness を再計算し、通知 (`DECISION_READY_TO_DECIDE`) を発行可能。
