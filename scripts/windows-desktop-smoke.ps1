[CmdletBinding()]
param(
  [string]$AppName = "CyberDocGen",
  [string]$BaseUrl = "http://127.0.0.1:5000",
  [string]$Provider = "openai",
  [string]$ApiKey = "sk-smoketest-abcdefghijklmnopqrstuvwxyz1234567890",
  [int]$StartupTimeoutSec = 90,
  [switch]$SkipLaunch,
  [switch]$KeepApiKey,
  [string]$ReportPath = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
  $stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
  $ReportPath = Join-Path $PSScriptRoot "..\artifacts\windows-desktop-smoke\report-$stamp.json"
}

$report = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  appName = $AppName
  baseUrl = $BaseUrl
  checks = @()
}

function Add-CheckResult {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Details
  )

  $entry = [ordered]@{
    name = $Name
    status = if ($Passed) { "passed" } else { "failed" }
    details = $Details
  }
  $script:report.checks += $entry
}

function Invoke-JsonRequest {
  param(
    [ValidateSet("GET", "POST", "DELETE")]
    [string]$Method,
    [string]$Url,
    [hashtable]$Body
  )

  if ($Method -eq "GET" -or $Method -eq "DELETE") {
    return Invoke-RestMethod -Method $Method -Uri $Url -TimeoutSec 15
  }

  return Invoke-RestMethod -Method "POST" -Uri $Url -ContentType "application/json" -Body ($Body | ConvertTo-Json -Compress) -TimeoutSec 15
}

function Wait-ForHealth {
  param(
    [string]$Url,
    [int]$TimeoutSec
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $live = Invoke-JsonRequest -Method GET -Url "$Url/live"
      $ready = Invoke-JsonRequest -Method GET -Url "$Url/ready"
      if ($live.status -and $ready.status) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 2
      continue
    }
  }
  return $false
}

$startMenuRoots = @(
  Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs",
  Join-Path $env:ProgramData "Microsoft\Windows\Start Menu\Programs"
)

$shortcut = $null
foreach ($root in $startMenuRoots) {
  if (-not (Test-Path $root)) {
    continue
  }

  $shortcut = Get-ChildItem -Path $root -Filter "*.lnk" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "$AppName*.lnk" } |
    Select-Object -First 1

  if ($shortcut) {
    break
  }
}

if ($shortcut) {
  Add-CheckResult -Name "Start Menu Shortcut" -Passed $true -Details "Found: $($shortcut.FullName)"
} else {
  Add-CheckResult -Name "Start Menu Shortcut" -Passed $false -Details "No Start Menu shortcut found for $AppName"
}

$installedExePath = Join-Path $env:LOCALAPPDATA "Programs\$AppName\$AppName.exe"

if (-not $SkipLaunch) {
  if (Test-Path $installedExePath) {
    try {
      Start-Process -FilePath $installedExePath | Out-Null
      Add-CheckResult -Name "Launch From Install Path" -Passed $true -Details "Started $installedExePath"
    } catch {
      Add-CheckResult -Name "Launch From Install Path" -Passed $false -Details $_.Exception.Message
    }
  } elseif ($shortcut) {
    try {
      Start-Process -FilePath $shortcut.FullName | Out-Null
      Add-CheckResult -Name "Launch From Shortcut" -Passed $true -Details "Started $($shortcut.FullName)"
    } catch {
      Add-CheckResult -Name "Launch From Shortcut" -Passed $false -Details $_.Exception.Message
    }
  } else {
    Add-CheckResult -Name "Application Launch" -Passed $false -Details "No launch target available"
  }

  $healthReady = Wait-ForHealth -Url $BaseUrl -TimeoutSec $StartupTimeoutSec
  Add-CheckResult -Name "Desktop Runtime Health" -Passed $healthReady -Details (if ($healthReady) { "Both /live and /ready are reachable" } else { "Health endpoints did not become ready within timeout" })
}

$saveSucceeded = $false
try {
  $saveResponse = Invoke-JsonRequest -Method POST -Url "$BaseUrl/api/local/api-keys/$Provider" -Body @{ apiKey = $ApiKey }
  $saveSucceeded = [bool]$saveResponse.success
  $persistence = if ($saveResponse.persistence) { [string]$saveResponse.persistence } else { "unknown" }
  Add-CheckResult -Name "API Key Save" -Passed $saveSucceeded -Details "Provider=$Provider, persistence=$persistence"
} catch {
  Add-CheckResult -Name "API Key Save" -Passed $false -Details $_.Exception.Message
}

try {
  $configured = Invoke-JsonRequest -Method GET -Url "$BaseUrl/api/local/api-keys/configured"
  $configuredList = @($configured.configured)
  $hasProvider = $configuredList -contains $Provider.ToUpperInvariant()
  Add-CheckResult -Name "API Key Configured List" -Passed $true -Details "Configured providers: $($configuredList -join ', '); contains target provider=$hasProvider"
} catch {
  Add-CheckResult -Name "API Key Configured List" -Passed $false -Details $_.Exception.Message
}

if (-not $KeepApiKey -and $saveSucceeded) {
  try {
    $deleteResponse = Invoke-JsonRequest -Method DELETE -Url "$BaseUrl/api/local/api-keys/$Provider"
    $deleteSucceeded = [bool]$deleteResponse.success
    Add-CheckResult -Name "API Key Delete" -Passed $deleteSucceeded -Details "Provider=$Provider"
  } catch {
    Add-CheckResult -Name "API Key Delete" -Passed $false -Details $_.Exception.Message
  }
}

$failedChecks = @($report.checks | Where-Object { $_.status -eq "failed" })
$report.summary = [ordered]@{
  passed = ($failedChecks.Count -eq 0)
  total = $report.checks.Count
  failed = $failedChecks.Count
}

$reportDir = Split-Path -Parent $ReportPath
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
$report | ConvertTo-Json -Depth 6 | Set-Content -Path $ReportPath -Encoding UTF8

Write-Host "Desktop smoke report: $ReportPath"
Write-Host "Passed checks: $($report.summary.total - $report.summary.failed)"
Write-Host "Failed checks: $($report.summary.failed)"

if ($report.summary.passed) {
  exit 0
}

exit 1
