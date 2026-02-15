# apps/agent

Kimeboard agent service (FastAPI).

## Responsibilities

- `meeting_structurer`: extract decisions from meeting memo and generate question sets.
- `reply_integrator`: apply answer set/free-text replies into decision patch payload.
- `draft_actions_skill`: generate PREP/EXEC action drafts from decision completeness.

## Endpoints

- `GET /healthz`
- `POST /tasks/meeting_structurer`
- `POST /tasks/reply_integrator`
- `POST /tasks/draft_actions_skill`

## Runtime Modes

- Local direct test:
  - `TASK_AUTH_MODE=NONE`
  - You can call task endpoints directly with `curl`/`Invoke-RestMethod`.
- Deployed on Cloud Run (managed by `infra/terraform`):
  - `TASK_AUTH_MODE=OIDC`
  - Cloud Tasks calls are verified with OIDC (`TASK_OIDC_AUDIENCE`).

## Design Docs

- `docs/agent/meeting-structurer-design.md`
- `docs/agent/gap-questioner-design.md`
- `docs/agent/reply-integrator-design.md`
- `docs/agent/prompt-implementation-map.md`

## Local Run

```bash
cd apps/agent
pip install -e .[dev]
cp .env.example .env
uvicorn src.server:app --reload --port 8081
```

## Infra-Aligned Local Test Flow

After infra deploy, generate env files from Terraform outputs:

```powershell
./infra/scripts/infra.ps1 -Action apply -Component all -ProjectId <PROJECT_ID> -EnableCloudRun -SyncLocalEnv
```

This creates:

- `apps/api/.env.infra.local`
- `apps/agent/.env.infra.local`

Then:

1. Copy required values into your local `.env` (or load them in your shell).
2. Set `AGENT_CALLBACK_TOKEN` to the same value used by API Secret Manager.
3. Run agent locally and test callbacks against deployed API.

## Env

See `apps/agent/.env.example`.
