# apps/api

Next.js Route Handlers API for Kimeboard.

## Implemented endpoints (MVP)

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:projectId`
- `GET /api/projects/:projectId/snapshot`
- `POST /api/projects/:projectId/meetings`
- `GET /api/projects/:projectId/meetings/:meetingId`
- `POST /api/projects/:projectId/meetings/:meetingId/logs`
- `GET /api/projects/:projectId/decisions`
- `POST /api/projects/:projectId/decisions`
- `POST /api/projects/:projectId/decisions/create` (compat alias)
- `GET /api/projects/:projectId/decisions/:decisionId`
- `PATCH /api/projects/:projectId/decisions/:decisionId`
- `POST /api/projects/:projectId/decisions/:decisionId/actions`
- `POST /api/projects/:projectId/decisions/:decisionId/actions/bulk`
- `POST /api/projects/:projectId/decisions/:decisionId/link_meeting`
- `POST /api/projects/:projectId/decisions/:decisionId/chat/thread`
- `POST /api/projects/:projectId/decisions/:decisionId/skills/draft_actions`
- `GET /api/chat/threads/:threadId/messages`
- `POST /api/chat/threads/:threadId/messages`
- `GET /api/chat/threads/:threadId/messages/list` (compat alias)
- `GET /api/chat/threads/:threadId/messages/:messageId`
- `POST /api/projects/:projectId/notifications`
- `GET /api/projects/:projectId/notifications`
- `POST /api/agendas/generate`
- `POST /api/internal/agent/callback`
- `POST /api/auth/demo-login`（デモログイン。Firebase 不使用）
- `GET /api/demo/projects`
- `POST /api/demo/projects`
- `PATCH /api/demo/projects/:projectId`
- `GET /api/demo/projects/:projectId/snapshot`
- `POST /api/demo/projects/:projectId/meetings`
- `POST /api/demo/projects/:projectId/decisions`
- `PATCH /api/demo/projects/:projectId/decisions/:decisionId`
- `POST /api/demo/projects/:projectId/decisions/:decisionId/chat/thread`
- `GET/POST /api/demo/chat/threads/:threadId/messages`
- `POST /api/demo/projects/:projectId/decisions/:decisionId/skills/draft_actions`

## Local demo DB (Firestore emulator)

1. `npm install`
2. Start DB + API: `npm run demo`
3. Seed demo data: `npm run demo:seed`
4. API URL: `http://localhost:3001`
5. Emulator UI: `http://127.0.0.1:4000`

## Core env vars

- `FIRESTORE_PROJECT_ID` (default: `demo-kimeboard`)
- `FIRESTORE_EMULATOR_HOST` (local only, e.g. `127.0.0.1:8080`)
- `DISABLE_CLOUD_TASKS=true` (local only)
- `CLOUD_TASKS_QUEUE`
- `CLOUD_TASKS_LOCATION`
- `GOOGLE_CLOUD_PROJECT`
- `TASK_OIDC_SERVICE_ACCOUNT_EMAIL`
- `AGENT_TASK_OIDC_AUDIENCE` (optional, defaults to each task URL)
- `AGENT_TASK_URL_MEETING`
- `AGENT_TASK_URL_REPLY`
- `AGENT_TASK_URL_ACTIONS`
- `AGENT_CALLBACK_TOKEN` (required for `/api/internal/agent/callback`)

## Infra-aligned local env

After Terraform apply, you can generate local env templates from outputs:

```powershell
./infra/scripts/sync-local-env.ps1
```

Generated files:

- `apps/api/.env.infra.local`
- `apps/agent/.env.infra.local`

To generate web env for production data mode too:

```powershell
./infra/scripts/sync-local-env.ps1 -WriteWebEnv
```

## Demo data files

- JSON source: `src/data/demo/*.json`
- Firestore seed source: `src/data/demo/firestore-seed.json`

## データモード（デモ vs 本番）

- **デモ**: `GET /api/demo/*` で JSON ファイルを DB 代わりに読み、書込はインメモリストアで保持（プロセス終了でリセット）。永続化なし。
- **本番**: `GET/POST/PATCH /api/projects/*` 等で Firestore を利用。現時点ではデモ用途のため、本番の書込は未接続の場合あり。

## 認証（AUTH）

| モード | 内容 |
|--------|------|
| **スキップ** | `DISABLE_AUTH=true`（API+Web 両方）。ログイン不要で利用可。 |
| **デモログイン** | `DEMO_LOGIN_ID` / `DEMO_LOGIN_PASSWORD` / `DEMO_AUTH_TOKEN` を設定。**Firebase は一切使用しない**。Web は `NEXT_PUBLIC_USE_DEMO_AUTH=true`。ログインID・パスワードでログイン。本番向け。 |
| **Firebase** | 上記なしで Firebase 資格情報を設定。メール/パスワード認証。 |
