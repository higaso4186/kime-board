# apps/web

Next.js frontend for Kimeboard.

## Required env

- `KIMEBOARD_API_BASE_URL`
  - Backend API base URL for rewrite target (`/api/backend/*` -> `${KIMEBOARD_API_BASE_URL}/api/*`)
- `NEXT_PUBLIC_API_DATA_MODE`
  - `demo`: use `/api/demo/projects*`
  - `production`: use `/api/projects*` (including `/api/projects/:projectId/snapshot`)

## Local run

```bash
cd apps/web
npm install
npm run dev
```

## API mode switch

### Demo mode

```dotenv
KIMEBOARD_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_DATA_MODE=demo
```

### Production API mode

```dotenv
KIMEBOARD_API_BASE_URL=https://<api-cloud-run-url>
NEXT_PUBLIC_API_DATA_MODE=production
```

## Infra-aligned local env

After Terraform apply:

```powershell
./infra/scripts/sync-local-env.ps1 -WriteWebEnv
```

Generated:

- `apps/web/.env.infra.local`

This file includes:

- `KIMEBOARD_API_BASE_URL`
- `NEXT_PUBLIC_API_DATA_MODE=production`
