param(
  [ValidateSet("init", "plan", "apply", "destroy")]
  [string]$Action = "plan",

  [ValidateSet("foundation", "db", "adk", "cloudrun", "services", "all")]
  [string]$Component = "all",

  [Parameter(Mandatory = $false)]
  [string]$ProjectId = $env:GCP_PROJECT_ID,

  [string]$Region = "asia-northeast1",
  [string]$Environment = "mvp",
  [string]$ApexDomain = "",
  [string]$ApiBaseUrl = "",

  [switch]$EnableCloudRun,
  [switch]$DeployFirestoreArtifacts,
  [switch]$SyncLocalEnv
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Invoke-Terraform {
  param([string[]]$Args)
  & terraform "-chdir=$terraformDir" @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Terraform command failed: terraform $($Args -join ' ')"
  }
}

function Import-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return
  }
  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { return }
    if ($line.StartsWith("#")) { return }
    $parts = $line -split "=", 2
    if ($parts.Count -ne 2) { return }
    $name = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if (-not [string]::IsNullOrWhiteSpace($name)) {
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir
$terraformDir = Join-Path $infraDir "terraform"
$firestoreDir = Join-Path $infraDir "firestore"

Import-EnvFile -Path (Join-Path $infraDir ".env.infra")

if ([string]::IsNullOrWhiteSpace($ProjectId)) { $ProjectId = $env:GCP_PROJECT_ID }
if ([string]::IsNullOrWhiteSpace($ApexDomain)) { $ApexDomain = $env:APEX_DOMAIN }
if ([string]::IsNullOrWhiteSpace($ApiBaseUrl)) { $ApiBaseUrl = $env:API_BASE_URL }

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
  throw "ProjectId is required. Pass -ProjectId or set GCP_PROJECT_ID."
}

Assert-Command -Name "terraform"

$tfvarsPath = Join-Path $terraformDir ".tmp.$Environment.auto.tfvars"
$tfvarsLines = @(
  "project_id = `"$ProjectId`"",
  "region = `"$Region`"",
  "environment = `"$Environment`"",
  "enable_cloud_run = $($EnableCloudRun.IsPresent.ToString().ToLowerInvariant())"
)

if (-not [string]::IsNullOrWhiteSpace($ApexDomain)) {
  $tfvarsLines += "apex_domain = `"$ApexDomain`""
}
if (-not [string]::IsNullOrWhiteSpace($ApiBaseUrl)) {
  $tfvarsLines += "api_base_url = `"$ApiBaseUrl`""
}

Set-Content -Path $tfvarsPath -Value ($tfvarsLines -join "`n") -Encoding utf8

$targets = @()
switch ($Component) {
  "foundation" { $targets += "-target=module.foundation" }
  "db" { $targets += "-target=module.db" }
  "adk" { $targets += "-target=module.adk" }
  "cloudrun" {
    if (-not $EnableCloudRun.IsPresent) {
      throw "Component 'cloudrun' requires -EnableCloudRun."
    }
    $targets += "-target=module.cloud_run[0]"
  }
  "services" {
    if (-not $EnableCloudRun.IsPresent) {
      throw "Component 'services' requires -EnableCloudRun."
    }
    $targets += "-target=module.foundation"
    $targets += "-target=module.cloud_run[0]"
  }
  "all" { }
}

Write-Host "Terraform init..."
Invoke-Terraform -Args @("init")

$baseArgs = @("-var-file=$tfvarsPath") + $targets

switch ($Action) {
  "init" {
    Write-Host "Init completed."
  }
  "plan" {
    Write-Host "Running terraform plan ($Component)..."
    Invoke-Terraform -Args (@("plan") + $baseArgs)
  }
  "apply" {
    Write-Warning "Apply will change live resources. Review terraform plan output before running apply."
    Write-Host "Running terraform apply ($Component)..."
    Invoke-Terraform -Args (@("apply", "-auto-approve") + $baseArgs)

    if ($DeployFirestoreArtifacts.IsPresent -and ($Component -eq "db" -or $Component -eq "all")) {
      if (Get-Command firebase -ErrorAction SilentlyContinue) {
        $firebaseConfig = Join-Path $firestoreDir "firebase.json"
        Write-Host "Deploying Firestore rules/indexes..."
        & firebase deploy --project $ProjectId --config $firebaseConfig --only "firestore:rules,firestore:indexes"
        if ($LASTEXITCODE -ne 0) {
          throw "Firestore artifacts deploy failed."
        }
      } else {
        Write-Warning "firebase command not found. Skipped Firestore artifacts deploy."
      }
    }

    if ($SyncLocalEnv.IsPresent) {
      $syncScript = Join-Path $scriptDir "sync-local-env.ps1"
      if (-not (Test-Path $syncScript)) {
        throw "Sync script not found: $syncScript"
      }
      Write-Host "Generating local env files from Terraform outputs..."
      & $syncScript -Environment $Environment
      if ($LASTEXITCODE -ne 0) {
        throw "sync-local-env.ps1 failed."
      }
    }
  }
  "destroy" {
    Write-Host "Running terraform destroy ($Component)..."
    Invoke-Terraform -Args (@("destroy", "-auto-approve") + $baseArgs)
  }
}

Write-Host "Done."
