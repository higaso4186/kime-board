param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

Assert-Command -Name "gcloud"

Write-Host "Running gcloud auth login..."
& gcloud auth login
if ($LASTEXITCODE -ne 0) { throw "gcloud auth login failed." }

Write-Host "Running gcloud auth application-default login..."
& gcloud auth application-default login
if ($LASTEXITCODE -ne 0) { throw "gcloud auth application-default login failed." }

Write-Host "Setting active project: $ProjectId"
& gcloud config set project $ProjectId
if ($LASTEXITCODE -ne 0) { throw "Failed to set gcloud project." }

Write-Host "Active project from gcloud config:"
& gcloud config get-value project
if ($LASTEXITCODE -ne 0) { throw "Failed to read active project." }

Write-Host "Checking project billing state..."
& gcloud billing projects describe $ProjectId --format="value(projectId,billingEnabled,billingAccountName)"
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Could not verify billing state. Please check billing manually in GCP Console."
}

Write-Host "Active account:"
& gcloud auth list --filter=status:ACTIVE --format="value(account)"
if ($LASTEXITCODE -ne 0) { throw "Failed to fetch active account." }

Write-Host "glogin flow completed."
