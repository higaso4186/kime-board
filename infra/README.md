# Infra Operations

This directory contains Terraform and helper scripts to provision Kimeboard infra in GCP.

## Goals

- Run infra by component (`db`, `adk`, etc.)
- Run everything in one shot (`all`)
- Use a `glogin`-first workflow for real execution
- Do not run production deploy tests from this setup yet

## Directory Layout

- `terraform/`: Terraform root and modules
- `scripts/`: PowerShell wrappers (`glogin`, `infra`)
- `firestore/`: Firestore rules/indexes artifacts

## Prerequisites

- Terraform 1.6+
- Google Cloud SDK (`gcloud`)
- Firebase CLI (`firebase`) if you want to deploy Firestore rules/indexes

## Environment File (.env.infra)

Use `infra/.env.infra.example` as a template and create `infra/.env.infra`.

```env
GCP_PROJECT_ID=your-gcp-project-id
APEX_DOMAIN=example.com
API_BASE_URL=
```

`infra/scripts/infra.ps1` automatically loads this file. CLI args still override env values.

## デプロイ手順（概要）

DB や ADK を個別にデプロイする場合の推奨順序です。

| 順番 | 手順 | コマンド |
|------|------|----------|
| 1 | **G ログイン** | `./infra/scripts/glogin.ps1 -ProjectId <PROJECT_ID>` |
| 2 | **Init** | `./infra/scripts/infra.ps1 -Action init -ProjectId <PROJECT_ID>` |
| 3 | **DB のみ** | `plan` → `apply -Component db`（必要時 `-DeployFirestoreArtifacts`） |
| 4 | **ADK のみ** | `plan` → `apply -Component adk` |

DB と ADK は互いに依存しないため、3 と 4 の順序は入れ替え可能です。`foundation` は DB/ADK の apply 時に Terraform が自動で扱います。

詳細（上書き防止の注意、既存 DB の import 等）は [docs/plans/infra-plan.md](../docs/plans/infra-plan.md) を参照してください。

## Authentication Flow (glogin)

```powershell
./infra/scripts/glogin.ps1 -ProjectId <YOUR_GCP_PROJECT_ID>
```

This performs:

1. `gcloud auth login`
2. `gcloud auth application-default login`
3. `gcloud config set project ...`

## Component Execution

```powershell
# Init
./infra/scripts/infra.ps1 -Action init -ProjectId <PROJECT_ID>

# Plan only: DB
./infra/scripts/infra.ps1 -Action plan -Component db -ProjectId <PROJECT_ID>

# Apply only: ADK
./infra/scripts/infra.ps1 -Action apply -Component adk -ProjectId <PROJECT_ID>

# Apply all components
./infra/scripts/infra.ps1 -Action apply -Component all -ProjectId <PROJECT_ID>

# Apply services only (foundation + cloudrun)
./infra/scripts/infra.ps1 -Action apply -Component services -EnableCloudRun

# Apply all + generate local env templates from terraform outputs
./infra/scripts/infra.ps1 -Action apply -Component all -ProjectId <PROJECT_ID> -EnableCloudRun -SyncLocalEnv
```

### Optional Cloud Run creation

Cloud Run resources are disabled by default to avoid accidental deployment.

```powershell
./infra/scripts/infra.ps1 -Action plan -Component all -ProjectId <PROJECT_ID> -EnableCloudRun
```

## Firestore Rules/Indexes

On `apply` for `db` or `all`, you can deploy rules/indexes too:

```powershell
./infra/scripts/infra.ps1 -Action apply -Component db -ProjectId <PROJECT_ID> -DeployFirestoreArtifacts
```

This uses:

- `infra/firestore/firestore.rules`
- `infra/firestore/firestore.indexes.json`

## 認証（本番環境）

### オプション A: デモログイン（推奨・Firebase 不使用）

本番で Firebase を使わず、デモ用 ID/パスワードでログインする構成。

**API（Cloud Run）に渡す環境変数:**

| 変数 | 説明 |
|------|------|
| `DEMO_LOGIN_ID` | ログインID（例: demo） |
| `DEMO_LOGIN_PASSWORD` | パスワード |
| `DEMO_AUTH_TOKEN` | 共有トークン（32文字以上推奨）。ログイン成功時にクライアントへ返却 |

**Web に渡す環境変数:**

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_USE_DEMO_AUTH` | `true` に設定 |

Secret Manager に格納し、Cloud Run の env で参照するか、デプロイ時に直接渡す。

### オプション B: Firebase Authentication

Firebase を使う場合は Firebase Console で有効化する。Terraform ではプロビジョニングしない。

1. **Firebase Console** (https://console.firebase.google.com/) でプロジェクトを作成し、GCP プロジェクトと紐付け
2. **Authentication** → Sign-in method で「メール/パスワード」を有効化
3. **サービスアカウント**: Firebase プロジェクトの設定 → サービスアカウント → 新しい秘密鍵の生成
4. 秘密鍵 JSON の `project_id`, `client_email`, `private_key` を Secret Manager に保存

**API に渡す環境変数:** `GOOGLE_CLOUD_PROJECT`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

詳細は [`specs/core/auth.md`](../specs/core/auth.md) 参照。

### ローカル: Auth Emulator（Firebase 利用時）

`infra/firestore/firebase.json` の `emulators.auth` で Auth Emulator (port 9099) を定義。`FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` を API に渡すとトークン検証が Emulator に接続する。

## 修正計画・詳細

デプロイ単位の整理（個別 DB/ADK、一括 services）、上書き防止の制度設計、コマンド例の詳細は [docs/plans/infra-plan.md](../docs/plans/infra-plan.md) を参照。  
※ 実施順序: apps/agent の整備を先に行い、その後 infra を実施する。

## Notes

- Domain mapping / DNS / SSL setup is intentionally kept outside automatic apply in this phase.
- Production rollout tests are intentionally not included yet.

## Terraform Backend (GCS)

For production state management, copy `infra/terraform/backend.tf.example` to `infra/terraform/backend.tf` and set your tfstate bucket.

If Firestore DB already exists, import it before first apply:

```powershell
terraform -chdir=infra/terraform import module.db.google_firestore_database.default "projects/<PROJECT_ID>/databases/(default)"
```

## Local Env Sync (after deploy)

Generate local env files for `apps/api` and `apps/agent` from Terraform outputs:

```powershell
./infra/scripts/sync-local-env.ps1
```

Outputs:

- `apps/api/.env.infra.local`
- `apps/agent/.env.infra.local`

These files include infra-aligned values such as queue name, Cloud Run URLs, and OIDC audience.

If you also want web env output:

```powershell
./infra/scripts/sync-local-env.ps1 -WriteWebEnv
```

This also generates:

- `apps/web/.env.infra.local`

with:

- `KIMEBOARD_API_BASE_URL`
- `NEXT_PUBLIC_API_DATA_MODE=production`

## Verify API <-> Agent alignment

After env sync and service startup, run:

```powershell
./infra/scripts/verify-agent-api-connection.ps1
```

This checks:

- callback token alignment (`apps/api/.env` vs `apps/agent/.env`)
- Cloud Tasks/OIDC required vars when tasks are enabled
- API/Agent health endpoints
