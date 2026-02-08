# apps/api

Next.js Route Handlers API for Kimeboard.

## Implemented endpoints (MVP)

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:projectId`
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
- `AGENT_TASK_URL_MEETING`
- `AGENT_TASK_URL_REPLY`
- `AGENT_TASK_URL_ACTIONS`
- `AGENT_CALLBACK_TOKEN` (required for `/api/internal/agent/callback`)
