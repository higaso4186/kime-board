# Local Development Guide

`apps/web` (Frontend), `apps/api` (Backend), `apps/agent` (Agent) をローカルで同時に確認するための手順です。

## 前提

- Node.js 20+
- npm 10+
- Python 3.11+
- Java 17+（Firestore Emulator 用）
- 利用ポートが空いていること: `3000`, `3001`, `4000`, `8080`, `8081`

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

### Agent (`apps/agent/.env`)

```dotenv
API_BASE_URL=http://localhost:3001
API_AUDIENCE=http://localhost:3001
AGENT_CALLBACK_TOKEN=change-me
TASK_AUTH_MODE=NONE
```

`apps/agent/.env.example` をコピーして作成し、`AGENT_CALLBACK_TOKEN` を API と同じ値にしてください。

## 3. 起動手順（推奨: 4ターミナル）

### Terminal A: Firestore Emulator

```powershell
cd apps/api
npm run demo:db
```

### Terminal B: API

```powershell
cd apps/api
npm run dev:demo
```

### Terminal C: Agent

```powershell
cd apps/agent
.\.venv\Scripts\uvicorn src.server:app --reload --port 8081
```

### Terminal D: Web

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

- Web: `http://localhost:3000/projects`
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
