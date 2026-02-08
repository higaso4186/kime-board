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

## Notes

- Domain mapping / DNS / SSL setup is intentionally kept outside automatic apply in this phase.
- Production rollout tests are intentionally not included yet.
