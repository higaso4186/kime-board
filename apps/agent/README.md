# apps/agent

Kimeboard agent service.

## What it does

- Receives Cloud Tasks requests:
  - `POST /tasks/meeting_structurer`
  - `POST /tasks/reply_integrator`
  - `POST /tasks/draft_actions_skill`
- Calls API endpoints to fetch context.
- Builds workflow outputs.
- Sends normalized callback to API:
  - `POST /api/internal/agent/callback`

## Local run

1. `cd apps/agent`
2. `pip install -e .[dev]`
3. Copy `.env.example` to `.env` and adjust values.
4. `uvicorn src.server:app --reload --port 8081`

## Env

See `.env.example`.

## Notes

- This implementation prioritizes API contract consistency with `apps/api`.
- LLM calls are optional; MVP uses deterministic heuristics to avoid local setup friction.
