param(
  [string]$ApiEnvPath = "apps/api/.env",
  [string]$AgentEnvPath = "apps/agent/.env",
  [string]$ApiBaseUrl = "",
  [string]$AgentBaseUrl = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-DotEnv {
  param(
    [string]$Path,
    [switch]$AllowMissing
  )

  if (-not (Test-Path $Path)) {
    if ($AllowMissing.IsPresent) {
      return @{}
    }
    throw "Env file not found: $Path"
  }

  $map = @{}
  foreach ($line in Get-Content -Path $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }
    $pair = $trimmed.Split("=", 2)
    if ($pair.Length -ne 2) {
      continue
    }
    $key = $pair[0].Trim()
    $value = $pair[1].Trim()
    $map[$key] = $value
  }
  return $map
}

function Resolve-EnvPath {
  param([string]$Path)

  if (Test-Path $Path) {
    return $Path
  }

  if ($Path.EndsWith(".env")) {
    $fallback = "$Path.infra.local"
    if (Test-Path $fallback) {
      return $fallback
    }
  }

  return $Path
}

function Add-Check {
  param(
    [System.Collections.Generic.List[object]]$Checks,
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )
  $Checks.Add([PSCustomObject]@{
      Name = $Name
      Ok = $Ok
      Detail = $Detail
    })
}

function Is-NonEmpty {
  param([string]$Value)
  return -not [string]::IsNullOrWhiteSpace($Value)
}

function Normalize-BaseUrl {
  param([string]$Value)
  if (-not (Is-NonEmpty $Value)) { return "" }
  return $Value.TrimEnd("/")
}

function Get-MapValue {
  param(
    [hashtable]$Map,
    [string]$Key,
    [string]$DefaultValue = ""
  )
  if ($Map.ContainsKey($Key) -and $null -ne $Map[$Key]) {
    return [string]$Map[$Key]
  }
  return $DefaultValue
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Push-Location $repoRoot
try {
  $resolvedApiEnvPath = Resolve-EnvPath -Path $ApiEnvPath
  $resolvedAgentEnvPath = Resolve-EnvPath -Path $AgentEnvPath

  $apiEnv = Read-DotEnv -Path $resolvedApiEnvPath -AllowMissing
  $agentEnv = Read-DotEnv -Path $resolvedAgentEnvPath -AllowMissing

  if (-not (Is-NonEmpty $ApiBaseUrl)) {
    $ApiBaseUrl = $agentEnv["API_BASE_URL"]
  }
  if (-not (Is-NonEmpty $ApiBaseUrl)) {
    $ApiBaseUrl = "http://localhost:3001"
  }

  if (-not (Is-NonEmpty $AgentBaseUrl)) {
    $taskUrl = $apiEnv["AGENT_TASK_URL_MEETING"]
    if (Is-NonEmpty $taskUrl) {
      $uri = [Uri]$taskUrl
      $AgentBaseUrl = "$($uri.Scheme)://$($uri.Authority)"
    }
  }
  if (-not (Is-NonEmpty $AgentBaseUrl)) {
    $AgentBaseUrl = "http://localhost:8081"
  }

  $ApiBaseUrl = Normalize-BaseUrl $ApiBaseUrl
  $AgentBaseUrl = Normalize-BaseUrl $AgentBaseUrl

  $checks = New-Object 'System.Collections.Generic.List[object]'

  Add-Check -Checks $checks -Name "API env file" -Ok (Test-Path $resolvedApiEnvPath) -Detail $resolvedApiEnvPath
  Add-Check -Checks $checks -Name "Agent env file" -Ok (Test-Path $resolvedAgentEnvPath) -Detail $resolvedAgentEnvPath

  $apiToken = $apiEnv["AGENT_CALLBACK_TOKEN"]
  $agentToken = $agentEnv["AGENT_CALLBACK_TOKEN"]
  $tokenAligned = (Is-NonEmpty $apiToken) -and (Is-NonEmpty $agentToken) -and ($apiToken -eq $agentToken)
  Add-Check -Checks $checks -Name "Callback token alignment" -Ok $tokenAligned -Detail "api=$([bool](Is-NonEmpty $apiToken)) agent=$([bool](Is-NonEmpty $agentToken))"

  $disableCloudTasks = (Get-MapValue -Map $apiEnv -Key "DISABLE_CLOUD_TASKS" -DefaultValue "").ToLower()
  $cloudTasksEnabled = ($disableCloudTasks -ne "true")
  Add-Check -Checks $checks -Name "Cloud Tasks mode" -Ok $true -Detail ($(if ($cloudTasksEnabled) { "enabled" } else { "disabled (local direct mode)" }))

  if ($cloudTasksEnabled) {
    $requiredVars = @(
      "CLOUD_TASKS_QUEUE",
      "GOOGLE_CLOUD_PROJECT",
      "TASK_OIDC_SERVICE_ACCOUNT_EMAIL",
      "AGENT_TASK_URL_MEETING",
      "AGENT_TASK_URL_REPLY",
      "AGENT_TASK_URL_ACTIONS"
    )
    foreach ($name in $requiredVars) {
      Add-Check -Checks $checks -Name "API env: $name" -Ok (Is-NonEmpty $apiEnv[$name]) -Detail (Get-MapValue -Map $apiEnv -Key $name -DefaultValue "")
    }

    $expectedAudience = $apiEnv["AGENT_TASK_OIDC_AUDIENCE"]
    $agentAudience = $agentEnv["TASK_OIDC_AUDIENCE"]
    if (Is-NonEmpty $expectedAudience) {
      Add-Check -Checks $checks -Name "OIDC audience alignment" -Ok ($expectedAudience -eq $agentAudience) -Detail "api=$expectedAudience agent=$agentAudience"
    }
  }

  $taskAuthMode = (Get-MapValue -Map $agentEnv -Key "TASK_AUTH_MODE" -DefaultValue "NONE").ToUpper()
  Add-Check -Checks $checks -Name "Agent TASK_AUTH_MODE" -Ok ($taskAuthMode -in @("NONE", "OIDC", "TOKEN")) -Detail $taskAuthMode

  try {
    $apiHealth = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/healthz" -TimeoutSec 10
    Add-Check -Checks $checks -Name "API healthz" -Ok ($apiHealth.ok -eq $true) -Detail "$ApiBaseUrl/healthz"
  }
  catch {
    Add-Check -Checks $checks -Name "API healthz" -Ok $false -Detail $_.Exception.Message
  }

  try {
    $agentHealth = Invoke-RestMethod -Method Get -Uri "$AgentBaseUrl/healthz" -TimeoutSec 10
    Add-Check -Checks $checks -Name "Agent healthz" -Ok ($agentHealth.ok -eq $true) -Detail "$AgentBaseUrl/healthz"
  }
  catch {
    Add-Check -Checks $checks -Name "Agent healthz" -Ok $false -Detail $_.Exception.Message
  }

  Write-Host ""
  Write-Host "=== Agent/API Connection Checks ==="
  $failed = 0
  foreach ($check in $checks) {
    $mark = if ($check.Ok) { "[OK]" } else { "[NG]" }
    Write-Host "$mark $($check.Name) :: $($check.Detail)"
    if (-not $check.Ok) { $failed += 1 }
  }

  if ($failed -gt 0) {
    Write-Host ""
    Write-Host "Result: FAILED ($failed checks)"
    exit 1
  }

  Write-Host ""
  Write-Host "Result: PASSED"
  exit 0
}
finally {
  Pop-Location
}
