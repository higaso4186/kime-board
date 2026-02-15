# Gap Questioner Design

## 1. 目的
- Decision の不足情報を優先順位付きで特定し、最大3件まで質問を生成する。
- 生成質問は `QUESTION_SET` として API に保存され、UI のチケット表示と回答導線に直結する。

## 2. 不足判定
- 優先順位:
  - `owner` > `dueAt` > `criteria` > `options` > `rationale` > `assumptions` > `reopenTriggers`
- 判定ロジック:
  - `owner`: owner がなく、`userId/displayName` も空
  - `dueAt`: 未設定
  - `criteria`: 空配列 or 未設定
  - `options`: 2件未満
  - `rationale`: pros/cons が空（conditionsのみでは不足扱い）
  - `assumptions`, `reopenTriggers`: 任意だが不足時は質問候補に含める
- `decision.completeness.missingFields` が存在する場合はそれを最優先で採用。

## 3. 質問生成仕様
- 最大質問数:
  - `MAX_QUESTIONS = 3`
- question type:
  - `owner`: `text`
  - `dueAt`: `date`
  - `criteria`: `multi_select`
  - `options`: `text`
  - `rationale`: `text`
  - `assumptions`: `text`
  - `reopenTriggers`: `text`
- `maps_to`:
  - `targetType`: `DECISION`
  - `field`: 該当フィールド名

## 4. なぜ owner/dueAt が最優先か
- owner 不在だと責任者が確定せず、決裁完了までの運用導線が止まる。
- dueAt 不在だと意思決定の期限管理が崩れ、会議体運用の優先順位付けができない。

## 5. なぜ3問上限か
- UI右パネルとチャット導線で一度に処理可能な認知負荷を抑えるため。
- 4問以上を一括提示すると回答遅延が増え、`reply_integrator` 適用までのリードタイムが伸びやすい。

## 6. LLM拡張時の整合
- 現行は deterministic rule-based。
- `src/prompts/gap_questioner.md` を将来的に有効化する場合も、以下は固定ガードレールとする:
  - 最大3問
  - `maps_to` の target/field を必須化
  - owner/dueAt 優先順位
