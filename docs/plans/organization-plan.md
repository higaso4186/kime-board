# 全体整理対応計画

apps/api, apps/web は整備済み。**それ以外**の領域を同様に整える。できるだけ**最小限**で実施する。

## 0. プロダクト方針（タスク管理ツールとの非競合）

- 本プロダクトのアクションは、**決裁を前に進めるための進行管理**を目的とする。
- 担当者の細かな作業分解、工数管理、スプリント運用などは、既存のタスク管理ツールで行う前提とする。
- そのため、UI と API は「決裁の文脈」と「次の意思決定につながるか」を中心に設計し、タスク管理の代替は目指さない。

## 1. 実施順序とドキュメント分離

| 順序 | 領域 | 計画書 | 備考 |
|------|------|--------|------|
| **1** | **apps/agent** | [`agent-plan.md`](./agent-plan.md) | 先に実施。設計の確実性を実証する整備 |
| **2** | **infra** | [`infra-plan.md`](./infra-plan.md) | agent のあと。個別 DB/ADK、一括、上書き防止 |
| 3 | docs, specs | 本 MD 内 | 必要に応じて最小限 |

**ドキュメントの分離**: agent と infra は別計画書とする。本 MD は全体の順序と概要のみを扱う。

---

## 2. 対象領域

| 領域 | 現状 | 整備レベル |
|------|------|------|
| apps/api | ✅ 整備済み | README、.env.example、ローカル手順 |
| apps/web | ✅ 整備済み | 同上 |
| apps/agent | ⚠ 要整理 | 詳細は [`agent-plan.md`](./agent-plan.md) |
| infra | ⚠ 要整理 | 詳細は [`infra-plan.md`](./infra-plan.md) |
| docs, specs | △ | 必要に応じて最小限 |

---

## 3. apps/agent（第1優先）

**計画書**: [`agent-plan.md`](./agent-plan.md)

### 概要

- **責務**: 会議メモ→決裁整理、不足質問の 2 大機能
- **整備方針**: 個々の部分の設計が確実にできていることを示すための整理
- **成果物**: 設計書（meeting_structurer, gap_questioner, reply_integrator）、README 更新

実施順: agent → **そのあと** infra

---

## 4. infra（第2優先、agent のあと）

**計画書**: [`infra-plan.md`](./infra-plan.md)  
**目的**: Terraform を正しく利用し、本番環境へのデプロイ操作を確実に行えるようにする。

### 4.1 最重要なゴール

1. **Terraform の正しい利用** - state 管理、変数設計、モジュール構成
2. **本番環境への正しいデプロイ** - glogin で対象確認 → ENV/tfvars で指定 → 自動で環境構築
3. **コスト最小化** - 初回は最小限スペックで全リソースを作成

### 4.2 前提条件（実行前に満たすこと）

| 条件 | 説明 |
|------|------|
| **決済の紐づけ** | GCP プロジェクトに課金（Billing）アカウントが紐づいていること。未紐づけだと API 有効化や一部リソース作成が失敗する |
| **権限** | プロジェクトの Owner または必要な IAM ロール（編集者等） |
| **gcloud / Terraform** | ローカルに gcloud CLI、Terraform 1.6+ がインストール済み |

### 4.3 実行フロー（やるべきアクション）

#### Step 0: 入力ファイルの準備

**`infra/.env.infra`**（新規作成）を用意し、次の変数のみ指定する。

```env
# 必須
GCP_PROJECT_ID=your-gcp-project-id

# ドメイン（オプション。空なら Cloud Run のデフォルト *.run.app URL を使用）
APEX_DOMAIN=example.com

# オプション（空でも可）
# API_BASE_URL=https://api-mvp.example.com
# API_DOMAIN=api-mvp.example.com
# WEB_DOMAIN=mvp.example.com
```

※ 決済が紐づいたプロジェクト ID を指定すれば十分。ドメインは空でも初回構築可能（Cloud Run のデフォルト URL を使用）。カスタムドメインを使う場合は `APEX_DOMAIN` を設定する。

#### Step 1: glogin で「正しいプロジェクトか」を確認

```powershell
cd infra
./scripts/glogin.ps1 -ProjectId $env:GCP_PROJECT_ID
# または
./scripts/glogin.ps1 -ProjectId "your-gcp-project-id"
```

実行後、以下を確認する:

- ログインしたアカウントが意図したものか
- アクティブプロジェクトが `gcloud config get-value project` で正しいか
- 該当プロジェクトの Billing が有効か（GCP Console で確認）

#### Step 2: ENV の読み込み（infra.ps1 が自動で行う想定）

`infra.ps1` 実行時、`infra/.env.infra` が存在すれば自動で読み込み、`ProjectId`, `ApexDomain` 等を環境変数として使用する。未指定の引数は環境変数から取得する。

#### Step 3: plan で差分確認（必須）

```powershell
# .env.infra を読み込む想定の場合（infra.ps1 が自動読み込みすれば引数省略可）
./infra/scripts/infra.ps1 -Action plan -Component all -EnableCloudRun

# 引数で明示する場合
./infra/scripts/infra.ps1 -Action plan -Component all -ProjectId "your-project-id" -ApexDomain "example.com" -EnableCloudRun
```

- 作成・変更・削除されるリソースを確認する
- 想定外の destroy や大量の change があれば止める

#### Step 4: apply で環境構築

```powershell
# .env.infra 読み込み + 全リソース作成（最小スペック）
./infra/scripts/infra.ps1 -Action apply -Component all -EnableCloudRun -DeployFirestoreArtifacts -SyncLocalEnv
```

- `-DeployFirestoreArtifacts`: Firestore rules/indexes もデプロイ
- `-SyncLocalEnv`: 適用後、apps/api, apps/agent 用の .env.infra.local を生成

### 4.4 最小限スペック（コスト最小化）

初回構築時は以下を適用し、コストを抑える。

| リソース | 最小スペック | 現状の変数 |
|----------|--------------|------------|
| Cloud Run (web/api/agent) | min_instances=0, max=2, 512Mi, 1 CPU | `cloud_run_min_instances`, `cloud_run_max_instances`, `cloud_run_memory` |
| Cloud Tasks キュー | max_concurrent=1 | `agent_queue_max_concurrent_dispatches` |
| Firestore | (default) 1 DB | 変更なし |
| Artifact Registry | 1 リポジトリ | 変更なし |

※ 変数は既に最小寄りのデフォルト。追加で見直す場合は `terraform.tfvars` または `infra.ps1` のパラメータで上書き可能にする。

### 4.5 やるべきアクション一覧（詳細）

| # | アクション | 優先度 | 説明 |
|---|------------|--------|------|
| 1 | `infra/.env.infra.example` 作成 | 高 | プロジェクト ID・ドメイン等のサンプルを提供 |
| 2 | `infra.ps1` の ENV 読み込み | 高 | 起動時に `infra/.env.infra` を読み込み、`ProjectId`/`ApexDomain` 等を環境変数として利用。引数で上書き可能 |
| 3 | glogin 実行前の確認強化 | 高 | プロジェクト ID・Billing 有効の表示・確認プロンプトを追加（任意） |
| 4 | Terraform state を GCS に移行 | 高 | 本番用に `backend "gcs"` を設定。`infra/terraform/backend.tf.example` を用意 |
| 5 | `services` Component 追加 | 中 | foundation + cloud_run のみ一括。DB/ADK は個別（infra-plan 参照） |
| 6 | apply 前の plan 必須化 | 中 | apply 実行前に plan の確認を促すチェック or ドキュメント化 |
| 7 | 最小スペックの明文化 | 中 | README に「初回は最小スペック推奨」を記載 |
| 8 | Firestore import 手順 | 低 | 既存 DB がある場合の `terraform import` 手順を README に追加 |

### 4.6 入力の受け方（ENV vs コマンド引数）

| 方式 | メリット | 対応案 |
|------|----------|--------|
| **ENV ファイル** | プロジェクト・ドメインを一元管理。誤操作防止 | `infra/.env.infra` を用意し、`infra.ps1` で読み込む |
| **コマンド引数** | 都度指定可能。自動化しやすい | 既存の `-ProjectId`, `-ApexDomain` を維持。ENV が優先 |

**推奨**: `infra/.env.infra` に `GCP_PROJECT_ID`, `APEX_DOMAIN` を記載し、`infra.ps1` 起動時に自動読み込み。引数で上書き可能にする。

### 4.7 実施時期

apps/agent の整備完了後。

### 4.8 最短フロー（実装後のイメージ）

1. `infra/.env.infra` に `GCP_PROJECT_ID`（と必要なら `APEX_DOMAIN`）のみ記載
2. `./scripts/glogin.ps1 -ProjectId <ID>` で認証・プロジェクト確認
3. `./scripts/infra.ps1 -Action plan -Component all -EnableCloudRun` で plan 確認
4. `./scripts/infra.ps1 -Action apply -Component all -EnableCloudRun -DeployFirestoreArtifacts -SyncLocalEnv` で構築

→ プロジェクト + ドメインの指定だけで、そのプロジェクト内に最小スペックの環境が自動で作成される。

---

## 5. docs / specs

- docs/local: 認証スキップ時の最短手順（必要なら追記）
- specs: 現状維持

---

## 6. 除外（本計画では対応しない）

- README のポート表記の統一
- agendas ルートの整理
- ライセンス・コントリビューション
