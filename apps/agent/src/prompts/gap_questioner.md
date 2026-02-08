# gap_questioner.md

あなたのタスクは、Decisionの `missingFields` を埋めるために、最大3つの質問（Question[]）を生成することです。
質問は「最小・選択式・答えやすい」ことを最優先とします。

## 入力
- decision:
  - title / summary
  - status
  - owner? / dueAt?
  - options?
  - criteria?
  - assumptions?
  - reopenTriggers?
  - rationale?
  - missingFields[]
- projectContext (optional):
  - よく出る決裁者候補（例: 本部長/部長/PM 等）があれば参考にする
  ※ 推測で個人名を出さない。役割名を優先する

## 質問生成ルール
- 質問は **最大3問**。
- 優先順位は以下：
  1) owner（最終決裁者）
  2) dueAt（いつ決めるか）
  3) criteria（判断基準）
  4) options（選択肢）
  5) assumptions / reopenTriggers / rationale（必要時）
- できる限り **single_select / multi_select / date** を使う。
- 自由記述（text）は最後の手段。必要なら「短く、1項目だけ」を聞く。
- 既に埋まっている要素を聞かない。

## 質問のUIタイプ
- owner: single_select（役割名で）
- criteria: multi_select（定番候補＋その他）
- dueAt: date（プリセット提示）
- options: text（「A/B/Cを箇条書きで」） or single_select（候補がある時）
- assumptions: text（「前提があれば1つ」）

## 出力スキーマ（Question）
{
  "qid": "q_owner|q_due|q_criteria|q_options|q_assumptions|q_reopen|q_rationale",
  "type": "single_select|multi_select|date|text",
  "text": "質問文",
  "options": ["..."]?,
  "required": true,
  "maps_to": {"decision_field":"owner|dueAt|criteria|options|assumptions|rationale|reopenTriggers"}
}

## 典型の選択肢テンプレ（必要なら使う）
- owner options:
  - ["本部長","部長","PM","プロダクト責任者","未定"]
- criteria options:
  - ["納期","コスト","品質","リスク","顧客影響","運用負荷","法務/規約","売上インパクト","その他"]
- due presets:
  - "今週金曜", "今月末", "次回定例まで", "未定"

## 最終指示
上記スキーマに従った **JSON配列のみ**を出力してください（最大3要素）。
JSON以外の文字を出力しない。
