# キメボード (Kimeboard)

会議メモから決裁（選択肢）を抽出し、不足情報を質問で埋めて「決められる状態」まで整える B2B SaaS プロダクト。

## 概要

キメボードは、社内プロジェクトの会議メモ（議事録）を構造化し、決裁プロセスを可視化・管理するためのツールです。

### 主な機能

- **会議メモ解析**: 議事録から決裁候補を自動抽出
- **不足情報の質問生成**: 決裁に必要な情報（決裁者、期限、判断基準など）が不足している場合、エージェントが質問を生成
- **決裁状態管理**: NEEDS_INFO → READY_TO_DECIDE → DECIDED の状態遷移を可視化
- **アクション管理**: 決裁に紐づくアクション（Prep/Exec）の管理
- **アジェンダ生成**: 会議で決めるべき決裁を整理したアジェンダの自動生成

### 対象ユーザー

- 社内プロジェクトの推進役（PM/PO/部門横断調整）
- 決裁者（部長/役員）とその周辺の実務者

## アーキテクチャ

### システム構成

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  apps/web   │────▶│  apps/api    │────▶│ apps/agent  │
│  (Next.js)  │     │  (Next.js)   │     │  (Python)   │
│     UI      │     │   Route      │     │   Agent     │
│             │     │  Handlers    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    │
                     ┌─────────────┐            │
                     │  Firestore  │◀───────────┘
                     │  (Database) │
                     └─────────────┘
                            ▲
                            │
                     ┌─────────────┐
                     │Cloud Tasks   │
                     │  (Async)     │
                     └─────────────┘
```

### 技術スタック

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend API**: Next.js Route Handlers, TypeScript
- **Agent**: Python, FastAPI (uvicorn)
- **Database**: Firestore
- **Infrastructure**: GCP (Cloud Run, Cloud Tasks, Firestore)
- **IaC**: Terraform

## ディレクトリ構造

```
kimeboard/
├── apps/
│   ├── api/          # Next.js API (Route Handlers)
│   ├── web/          # Next.js UI (Frontend)
│   └── agent/        # Python Agent (会議解析・質問生成)
├── infra/            # Terraform インフラ定義
├── specs/            # 仕様書・設計ドキュメント
│   └── core/
│       ├── mvp.yaml              # MVP 仕様
│       ├── web.yaml              # UI 仕様
│       ├── api.yaml              # API 仕様
│       ├── agent.yaml            # Agent 仕様
│       ├── infra.yaml            # インフラ仕様
│       ├── spec-impl-map.yaml    # 仕様↔実装対応表
│       └── ai-rules/             # AI 開発ルール
├── docs/             # ドキュメント
│   ├── doc/          # アーキテクチャ図・スライド
│   └── local/        # ローカル開発手順
└── README.md         # このファイル
```

## セットアップ

### 前提条件

- Node.js 18+ (apps/api, apps/web)
- Python 3.11+ (apps/agent)
- GCP アカウント（本番環境の場合）
- Terraform 1.5+（インフラ構築の場合）

### ローカル開発

各アプリの詳細なセットアップ手順は以下のドキュメントを参照してください。

- **全体のローカル開発手順**: [`docs/local/README.md`](docs/local/README.md)
- **API**: [`apps/api/README.md`](apps/api/README.md)
- **Web UI**: [`apps/web/README.md`](apps/web/README.md)
- **Agent**: [`apps/agent/README.md`](apps/agent/README.md)

### クイックスタート

#### 1. API の起動

```bash
cd apps/api
npm install
npm run dev
# http://localhost:3000 で起動
```

#### 2. Web UI の起動

```bash
cd apps/web
npm install
npm run dev
# http://localhost:3001 で起動（ポート競合時）
```

#### 3. Agent の起動

```bash
cd apps/agent
pip install -e .[dev]
cp .env.example .env
# .env を編集して API の URL を設定
uvicorn src.server:app --reload --port 8081
```

## 開発

### 仕様書

プロジェクトの詳細な仕様は `specs/core/` にあります。

- **MVP 仕様**: [`specs/core/mvp.yaml`](specs/core/mvp.yaml)
- **UI 仕様**: [`specs/core/web.yaml`](specs/core/web.yaml)
- **API 仕様**: [`specs/core/api.yaml`](specs/core/api.yaml)
- **Agent 仕様**: [`specs/core/agent.yaml`](specs/core/agent.yaml)
- **インフラ仕様**: [`specs/core/infra.yaml`](specs/core/infra.yaml)
- **仕様↔実装対応**: [`specs/core/spec-impl-map.yaml`](specs/core/spec-impl-map.yaml)

### アーキテクチャドキュメント

- **アーキテクチャ図**: [`docs/doc/architecture.html`](docs/doc/architecture.html)
- **説明スライド**: [`docs/doc/slide.html`](docs/doc/slide.html)

### インフラ構築

インフラの構築手順は [`infra/README.md`](infra/README.md) を参照してください。

```bash
cd infra
# GCP ログイン
./scripts/glogin.ps1
# Terraform 実行
terraform init
terraform plan
terraform apply
```

## 主要なワークフロー

### 1. 会議メモから決裁抽出

1. ユーザーが会議メモを貼り付け（`POST /api/projects/:projectId/meetings`）
2. API が Cloud Tasks で Agent を起動
3. Agent が会議メモを解析し、Decision 候補を抽出
4. Agent が API の callback エンドポイントに結果を送信
5. API が Decision を作成・更新し、不足情報があれば質問を生成

### 2. 不足情報の埋め込み

1. ユーザーがチャットで質問に回答（`POST /api/chat/threads/:threadId/messages`）
2. API が Cloud Tasks で Agent (reply_integrator) を起動
3. Agent が回答を Decision に反映する patch を生成
4. API が Decision を更新し、readiness を再計算
5. 条件を満たせば状態が NEEDS_INFO → READY_TO_DECIDE に自動遷移

### 3. アクション素案生成

1. ユーザーが「素案生成」を実行（`POST /api/projects/:projectId/decisions/:decisionId/skills/draft_actions`）
2. API が Cloud Tasks で Agent (draft_actions_skill) を起動
3. Agent が Decision からアクション素案を生成
4. API が Action を一括作成

## ライセンス

（未定）

## コントリビューション

（未定）
