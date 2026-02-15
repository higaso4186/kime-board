# Prompt / Implementation Map

## 1. 方針
- `src/prompts/*.md` は「LLM利用時の仕様定義」。
- 現行MVPは rule-based 実装が主体で、同等責務を workflow 側で担保する。

## 2. 対応表

| Prompt | 実装 | 差分 |
|---|---|---|
| `src/prompts/meeting_structurer.md` | `src/agents/workflows/meeting_structurer.py` | LLM抽出ではなく prefix-based 抽出で deterministic に実行 |
| `src/prompts/gap_questioner.md` | `src/agents/workflows/gap_questioner.py` | 質問文生成もテンプレート固定、最大3問制約をコードで保証 |
| `src/prompts/reply_integrator.md` | `src/agents/workflows/reply_integrator.py` | 自由記述パースは正規表現ベース、要約推論は未使用 |
| `src/prompts/draft_actions.md` | `src/agents/workflows/draft_actions_skill.py` | 補完度 missingFields を起点に固定ロジックで草案生成 |

## 3. ガードレール
- callback schema (`src/models/schemas.py`) を単一の契約面として扱う。
- prompt更新時は下記を必須確認:
  - schema互換
  - callback payload互換
  - UI表示項目（question target/field, decision status）互換
