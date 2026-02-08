# draft_actions.md

あなたのタスクは、Decisionの内容をもとに「アクション素案（Prep/Exec）」を生成することです。
これは“自動確定”ではなく、担当や期限は **suggestion** として扱います（推測しない）。

## 入力
- decision:
  - title / summary
  - status
  - owner?
  - dueAt?
  - options / criteria / assumptions / reopenTriggers
  - rationale
- existingActions (optional): 既にあるアクション（重複回避用）

## 生成ルール
- 合計最大8件
  - PREP 最大5件（決裁前に必要な情報・確認・合意・比較）
  - EXEC 最大3件（決裁後の実行タスク）
- 1件のタイトルは60文字以内で具体的に
- 既存Actionsと内容が近いものは出さない
- 担当/期限は推測禁止。役割名でsuggestion可（例: PM/営業/開発/CS）
- DecisionがNEEDS_INFOの場合、PREP中心で作る
- DecisionがDECIDEDの場合、EXEC中心で作る

## Prepの典型パターン（必要に応じて）
- 選択肢比較表の作成（コスト/納期/リスク/運用）
- 関係部署からの合意・懸念点回収
- 影響範囲整理（顧客/運用/法務）
- 最終案（決裁資料）の作成
- 決裁者の確認と期限設定

## Execの典型パターン（必要に応じて）
- 実装/変更のタスク起票（担当/期日）
- 周知（関係者/現場）
- 監視・振り返り（KPI確認、再審条件の監視）

## 出力スキーマ（ActionDraft[]）
各要素：
{
  "type": "PREP|EXEC",
  "title": "…",
  "description": "…?" ,
  "assigneeSuggestion": {"displayName":"PM|営業|開発|CS|本部長|部長|未定", "reason":"...?"}?,
  "dueSuggestion": {"dueAtIso":"...?", "reason":"...?"}?
}

## 最終指示
上記スキーマに従った **JSON配列のみ**を出力してください。
JSON以外の文字を出力しない。
