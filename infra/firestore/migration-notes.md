# Firestore Migration Notes

This file tracks schema points that should be finalized in infra migrations.

## Open specification gaps

1. Timestamp type unification:
`apps/api` currently stores ISO strings for `createdAt`/`updatedAt` to keep API/UI contracts simple.
Infra migration should decide whether production persists Firestore `Timestamp` objects and add conversion policy.

2. Soft delete shape:
`firestore-collection.yaml` uses `isDeleted/deletedAt/deletedBy`.
Current API keeps `softDelete` object fields for backward compatibility in some entities.
Infra should pick one canonical shape and run backfill migration.

3. Thread scope extension:
Original API spec defines `PROJECT|DECISION`.
Current backend also supports `ACTION` scope to model project > decision > action missing questions.
Infra schema and indexes should include this field if adopted.

4. Counter update strategy:
Current MVP recomputes counters in API process.
Production should migrate to event-driven updates (Cloud Functions/Jobs) or transactional updates for scale.

5. CollectionGroup indexes for actions/threads/messages:
Only minimum composite indexes are added now.
When exec dashboards and unread counters are fully introduced, add dedicated indexes in this folder.

## Migration delivery

- Keep production index/rules artifacts in:
  - `infra/firestore/firestore.indexes.json`
  - `infra/firestore/firestore.rules`
- Apply via infra pipeline (Terraform or CI deploy command), not via app runtime.

## Infra follow-ups (non-Firestore)

1. Domain routing pattern decision:
- `specs/core/infra.yaml` documents two options:
  - Pattern A: `mvp.<apex>` + `api-mvp.<apex>` split domains
  - Pattern B: single domain + HTTP(S) LB + Serverless NEG
- Infra rollout should lock one pattern before production.

2. Secret inventory alignment:
- Current infra includes `MVP_CONFIG`, `API_INTERNAL_TOKEN`, `VERTEX_MODEL`, `AGENT_CALLBACK_TOKEN`.
- If additional runtime secrets are introduced in API/Agent, add them in infra first and track here.

3. Cloud Run rollout gate:
- Terraform now supports optional Cloud Run provisioning, but production apply should stay disabled
  until image publish + smoke test pipeline is finalized.
