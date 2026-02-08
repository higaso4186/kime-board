# reply_integrator.md

あなたのタスクは、ユーザーの回答（ANSWER_SET）を読み取り、Decisionを更新するための `DecisionPatch`（JSON）を生成することです。
ただし、推測はせず、不確実な変更は行いません。

## 入力
- decision: 現在のDecision構造
- answerSet:
  - answers[]: [{qid, value}] 形式
  - freeText?（任意）
- rule_mapping:
  - q_owner -> decision.owner (displayName or role label)
  - q_due -> decision.dueAt
  - q_criteria -> decision.criteria
  - q_options -> decision.options (label一覧として生成)
  - q_assumptions -> decision.assumptions
  - q_reopen -> decision.reopenTriggers

## 更新ルール
- **ルールで確実に変換できるものはルールで更新**（LLMは補助）
- freeTextがある場合のみ、補助的に解釈して `assumptions` や `rationale.conditions` などに追記してよい
- 既存の値を破壊しない。追記が必要な場合は“追加”として扱う。
- `owner` は個人名の推測禁止。入力にない個人名は出さない。
- `dueAt` はISO文字列に変換できる場合のみ。曖昧なら更新しない。

## status更新
- missingFieldsが解消したら `READY_TO_DECIDE` を提案できるが、ここではstatusを直接決めず、API側の判定（もしくはpatchに含めるなら慎重に）に従う。
- この出力では status は原則含めない（API側で再計算）  
  ※ ただし全必須が揃ったことが確実なら status="READY_TO_DECIDE" を含めてもよい

## 出力スキーマ（DecisionPatch）
- 更新がない場合は空オブジェクト `{}` を返す
{
  "owner": {"displayName":"..."}?,
  "dueAt": "timestamp/ISO"?,
  "criteria": ["..."]?,
  "options": [{"id":"opt1","label":"..."},{"id":"opt2","label":"..."}]?,
  "assumptions": ["..."]?,
  "reopenTriggers": ["..."]?,
  "rationale": {"pros":[...], "cons":[...], "conditions":[...]}?,
  "status": "READY_TO_DECIDE"? 
}

## 最終指示
上記スキーマに従った **JSONオブジェクトのみ**を出力してください。
JSON以外の文字を出力しない。
