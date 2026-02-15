# Local Development Guide

`apps/web` (Frontend), `apps/api` (Backend), `apps/agent` (Agent) をローカルで同時に確認するための手順です。

## 前提

- Node.js 20+
- npm 10+
- Python 3.11+
- Java 17+（Firebase Emulator 用。Firestore / Emulator UI に必要）
- 利用ポートが空いていること: `3000`, `3001`, `4000`, `8080`, `8081`, `9099`（Auth Emulator）  
- **Java 17+**（Firebase Emulator 用。未導入時は [Adoptium](https://adoptium.net/) 等でインストール。Java なしで開発する場合は認証スキップ `DISABLE_AUTH` を利用）

## 1. 依存関係のインストール

```powershell
cd apps/web
npm install

cd ../api
npm install

cd ../agent
py -3 -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\pip install -e .[dev]
```

`py` が使えない環境では `python -m venv .venv` を使用してください。

## 2. 環境変数の準備

### API (`apps/api/.env`)

```dotenv
FIRESTORE_PROJECT_ID=demo-kimeboard
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
DISABLE_CLOUD_TASKS=true
AGENT_CALLBACK_TOKEN=change-me
```

`apps/api/.env.example` をコピーして作成し、最低限上記値を設定してください。

**Auth Emulator を利用する場合**（`demo:db` で firestore,auth を起動時、`dev:demo` に FIREBASE_AUTH_EMULATOR_HOST が含まれる）:

```dotenv
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

**認証をスキップする場合**:

```dotenv
DISABLE_AUTH=true
```

### Web (`apps/web/.env.local`)

**認証を有効にする場合**（Firebase プロジェクトが必要）:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
KIMEBOARD_API_BASE_URL=http://localhost:3001
```

**Auth Emulator を利用する場合**（API の `demo:db` で firestore,auth 起動時）:

```dotenv
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-kimeboard
KIMEBOARD_API_BASE_URL=http://localhost:3001
```

**認証をスキップする場合**（API に `DISABLE_AUTH=true` を設定した上で）:

```dotenv
NEXT_PUBLIC_DISABLE_AUTH=true
KIMEBOARD_API_BASE_URL=http://localhost:3001
```

`apps/web/.env.local.example` を参考に作成してください。

### Agent (`apps/agent/.env`)

```dotenv
API_BASE_URL=http://localhost:3001
API_AUDIENCE=http://localhost:3001
AGENT_CALLBACK_TOKEN=change-me
TASK_AUTH_MODE=NONE
```

`apps/agent/.env.example` をコピーして作成し、`AGENT_CALLBACK_TOKEN` を API と同じ値にしてください。

## 3. 起動手順（推奨: 3ターミナル）

### Terminal A: API + Emulators（Firestore + Auth 込み）

```powershell
cd apps/api
npm run dev:demo
```

Firestore (8080)、Auth (9099)、Next.js API (3001) が同時に起動。Emulator UI: `http://127.0.0.1:4000`。  
※ Java 17+ が必要。未インストールの場合は [Adoptium](https://adoptium.net/) 等でインストール。

### Terminal B: Agent

```powershell
cd apps/agent
.\.venv\Scripts\uvicorn src.server:app --reload --port 8081
```

### Terminal C: Web

```powershell
cd apps/web
npm run dev
```

## 4. デモデータ投入

```powershell
cd apps/api
npm run demo:seed
```

## 5. 疎通確認

### ヘルスチェック

```powershell
Invoke-RestMethod http://localhost:3001/healthz
Invoke-RestMethod http://localhost:8081/healthz
```

### API の基本確認

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3001/api/projects"
```

### Agent コールバック連携確認（手動トリガー）

`DISABLE_CLOUD_TASKS=true` のため、ローカルでは API から Agent タスクを自動実行しません。  
代わりに Agent タスク API を直接叩いて callback の流れを確認します。

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8081/tasks/meeting_structurer" `
  -ContentType "application/json" `
  -Body '{"projectId":"prj_01","meetingId":"mtg_01"}'
```

必要に応じて `projectId` / `meetingId` はシード済みデータに合わせて変更してください。

## 6. 画面確認

- Web: `http://localhost:3000/projects`（認証スキップ時は直接アクセス可）
- 認証有効時: 未ログインなら `/login` にリダイレクト、サインアップ/ログイン後に `/projects` へ

認証の詳細は [`specs/core/auth.md`](../../specs/core/auth.md) を参照してください。
- API: `http://localhost:3001`
- Firestore Emulator UI: `http://127.0.0.1:4000`

現状の Web は UI モック中心のため、全画面が API 完全連動していない箇所があります。  
アジェンダは独立ページではなく、会議詳細画面内の「会議アジェンダ素案」セクションで確認します。  
ただし UI/API/Agent の各サービスは上記手順で個別にローカル検証できます。

## 7. ローカル検証コマンド（CI 相当の最小セット）

```powershell
# Web
cd apps/web
npm run lint
npm run build

# API
cd ../api
npm run typecheck
npm run build

# Agent
cd ../agent
.\.venv\Scripts\pytest
```

## Infra-aligned local test (Cloud Run + local process)

After `infra` deploy with Cloud Run enabled, generate local env templates from Terraform outputs:

```powershell
./infra/scripts/sync-local-env.ps1
```

Generated files:

- `apps/api/.env.infra.local`
- `apps/agent/.env.infra.local`

Use these values in local `.env` before starting API/Agent if you want local processes to use deployed infra settings.

## Web/API mode alignment (important)

To run UI against real API data (not demo JSON), set:

```dotenv
KIMEBOARD_API_BASE_URL=<your-api-url>
NEXT_PUBLIC_API_DATA_MODE=production
```

When `NEXT_PUBLIC_API_DATA_MODE=production`, web loads:

- `GET /api/projects`
- `GET /api/projects/:projectId/snapshot`

When `NEXT_PUBLIC_API_DATA_MODE=demo`, web loads:

- `GET /api/demo/projects`
- `GET /api/demo/projects/:projectId/snapshot`

Recommended command after infra apply:

```powershell
./infra/scripts/sync-local-env.ps1 -WriteWebEnv
./infra/scripts/verify-agent-api-connection.ps1
```
