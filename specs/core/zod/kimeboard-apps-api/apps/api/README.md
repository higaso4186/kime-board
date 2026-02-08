# apps/api

Next.js Route Handlers API for Kimeboard (Cloud Run friendly).

## Env
- `FIRESTORE_PROJECT_ID` (optional; defaults to GOOGLE_CLOUD_PROJECT)
- `GCP_REGION` (optional)
- `CLOUD_TASKS_QUEUE` (e.g. agent-queue-mvp)
- `CLOUD_TASKS_LOCATION` (e.g. asia-northeast1)
- `AGENT_TASK_URL_MEETING`
- `AGENT_TASK_URL_REPLY`
- `AGENT_TASK_URL_ACTIONS`
- `TASK_OIDC_SERVICE_ACCOUNT_EMAIL` (service account used by Cloud Tasks to call Agent)
- `API_BASE_URL` (optional, for building links)
- `APP_ENV` (mvp)

## Run
- `pnpm -C apps/api dev`
