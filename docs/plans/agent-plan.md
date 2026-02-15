# Agent 整備計画

apps/api, apps/web と同様に apps/agent を整備する。**設計の確実性を実証する**ための整理を行う。

※ Infra の整備はこの後に実施。本ドキュメントは Agent 専用。

---

## 1. Agent の責務（2大機能）

| 機能 | 説明 | 対応ワークフロー |
|------|------|------------------|
| **会議メモから決裁の議題・アクションを整理** | 議事録を解析し、Decision 候補・アクションを抽出・構造化 | `meeting_structurer` |
| **不足についてユーザーに質問** | 決裁に必要な情報が欠けている部分を特定し、質問を生成 | `gap_questioner`（meeting_structurer 内で呼出） |

補足:
- `reply_integrator`: ユーザーの回答を Decision に統合（質問に対する回答の処理）
- `draft_actions_skill`: 決裁からアクション素案を生成

---

## 2. 現状構成

```
apps/agent/
├── src/
│   ├── agents/workflows/
│   │   ├── meeting_structurer.py   # 会議メモ解析・決裁抽出
│   │   ├── gap_questioner.py       # 不足フィールド判定・質問生成
│   │   ├── reply_integrator.py     # 回答統合
│   │   └── draft_actions_skill.py  # アクション素案
│   ├── prompts/                    # 設計・スキーマ定義（LLM 用の仕様）
│   │   ├── meeting_structurer.md
│   │   ├── gap_questioner.md
│   │   ├── reply_integrator.md
│   │   └── draft_actions.md
│   ├── models/schemas.py
│   └── tools/kimeboard_api_tools.py
├── tests/
└── README.md
```

---

## 3. 設計の確実性を実証するための整備

各機能について「どういう基準で動いているか」を明確にし、設計がしっかりしていることを示す。

### 3.1 会議メモ → 決裁整理（meeting_structurer）

#### 現状の設計

| 観点 | 内容 | 所在 |
|------|------|------|
| 抽出ルール | テキストの行頭プレフィックス（決裁:, 選択肢:, 基準:, 決裁者:, 期限: 等）で構造化 | `meeting_structurer.py` の `_extract_blocks`, `_apply_detail_line` |
| 不足判定 | owner, dueAt, criteria, options, rationale の有無で `_missing_fields` | `meeting_structurer.py` の `_missing_fields` |
| 既存決裁とのマッチ | タイトル正規化・トークン一致（0.6 以上）で同一候補と判定 | `_match_existing_decision` |
| スキーマ・出力形式 | DecisionExtract, missingFields, completenessScore | `meeting_structurer.md`（仕様）, `schemas.py` |

#### 整備内容

- [x] **設計書の作成**: `docs/agent/meeting-structurer-design.md` を作成し、以下を明文化
  - 抽出対象の定義（Decision とは何か）
  - 行プレフィックスの一覧と意味
  - ブロック単位の処理フロー
  - 既存決裁マッチの基準（スコア閾値 0.6 の根拠）

### 3.2 不足質問（gap_questioner）

#### 「どの基準で不足を選ぶか」の設計

| 観点 | 内容 | 所在 |
|------|------|------|
| **不足フィールドの優先順位** | owner > dueAt > criteria > options > rationale > assumptions > reopenTriggers | `gap_questioner.py` の `_FIELD_PRIORITY` |
| **不足の判定基準** | 各フィールドごとのルール（例: options は 2 件未満で不足） | `_missing_fields` |
| **質問の上限** | 最大 3 問 | `utils/limits.py` の `MAX_QUESTIONS` |
| **質問タイプ** | single_select, multi_select, date, text のいずれか | `_question_for_field` |

**不足判定の具体基準**:

| フィールド | 不足とみなす条件 |
|------------|------------------|
| owner | `owner` がなく、かつ `displayName` / `userId` もない |
| dueAt | 日時が未設定 |
| criteria | 配列が空 |
| options | 2 件未満 |
| rationale | pros も cons も空 |
| assumptions, reopenTriggers | 任意。不足時も質問は生成する |

#### 整備内容

- [x] **設計書の作成**: `docs/agent/gap-questioner-design.md` を作成し、以下を明文化
  - 不足を選ぶ基準（上記テーブルの正式版）
  - 優先順位の根拠（なぜ owner/dueAt が最優先か）
  - 質問数の上限（3 問）の理由
  - 各フィールドの質問タイプ選定理由
  - 将来的な LLM 利用時との整合（`gap_questioner.md` プロンプトとの対応）

### 3.3 回答統合（reply_integrator）

- [x] **設計書の作成**: `docs/agent/reply-integrator-design.md`
  - qid から field へのマッピング
  - 自由記述テキストからのパースルール（キーワード: 決裁者, 基準, 選択肢 等）
  - safe_mode 時のガードレール

### 3.4 スキーマ・プロンプトの対応表

- [x] `src/prompts/*.md` と実装（workflows, schemas）の対応を一覧化
  - プロンプトが LLM 用の仕様であることを明記
  - 現状のルールベース実装とプロンプトの差分を整理

---

## 4. README 整備

| 項目 | 変更案 |
|------|--------|
| 責務 | 2 大機能（会議メモ解析、不足質問）を冒頭に明記 |
| 設計ドキュメント | `docs/agent/*.md` へのリンクを追加 |
| ローカル開発 | `docs/local` との連携、認証スキップ時の手順 |
| .env.example | 必須項目のコメントを整理 |

---

## 5. 実施順序

1. **設計書作成**（meeting_structurer, gap_questioner, reply_integrator）
2. **README 更新**（責務・設計書リンク・ローカル手順）
3. **.env.example 整備**

---

## 6. 成果物一覧

| 成果物 | 説明 |
|--------|------|
| `docs/agent/meeting-structurer-design.md` | 会議メモ解析の設計 |
| `docs/agent/gap-questioner-design.md` | 不足判定・質問生成の設計（基準の明文化） |
| `docs/agent/reply-integrator-design.md` | 回答統合の設計 |
| `docs/agent/prompt-implementation-map.md` | プロンプトと実装対応表 |
| `apps/agent/README.md` | 責務・設計リンク・手順の更新 |
