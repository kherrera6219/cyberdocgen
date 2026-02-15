[CmdletBinding()]
param(
  [string]$ArtifactsPath = ".\dist\packaging",
  [string]$ReportPath = "",
  [switch]$RequireTimestamp,
  [switch]$IncludeUnpacked
)

$ErrorActionPreference = "Stop"

$verificationMode = "authenticode"
$signToolPath = $null

$signatureCommand = Get-Command -Name Get-AuthenticodeSignature -ErrorAction SilentlyContinue
if (-not $signatureCommand) {
  try {
    Import-Module Microsoft.PowerShell.Security -ErrorAction Stop
  } catch {}
}

$signatureCommand = Get-Command -Name Get-AuthenticodeSignature -ErrorAction SilentlyContinue
if (-not $signatureCommand) {
  $signToolCommand = Get-Command -Name signtool.exe -ErrorAction SilentlyContinue
  if ($signToolCommand) {
    $verificationMode = "signtool"
    $signToolPath = $signToolCommand.Source
  } else {
    Write-Error "No Windows signature verifier is available. Expected Get-AuthenticodeSignature or signtool.exe."
  }
}

$resolvedArtifactsPath = Resolve-Path -Path $ArtifactsPath -ErrorAction Stop

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
  $stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
  $ReportPath = Join-Path $PSScriptRoot "..\artifacts\signature-reports\signature-report-$stamp.json"
}

$allExecutables = Get-ChildItem -Path $resolvedArtifactsPath -Filter "*.exe" -File -Recurse
if (-not $IncludeUnpacked) {
  $allExecutables = @(
    $allExecutables | Where-Object { $_.FullName -notlike "*\win-unpacked\*" }
  )
}

if ($allExecutables.Count -eq 0) {
  Write-Error "No executable artifacts found under $resolvedArtifactsPath"
}

$results = @()

foreach ($exe in $allExecutables) {
  if ($verificationMode -eq "authenticode") {
    $signature = Get-AuthenticodeSignature -FilePath $exe.FullName
    $isValid = $signature.Status -eq [System.Management.Automation.SignatureStatus]::Valid
    $hasTimestamp = $null -ne $signature.TimeStamperCertificate
    $timestampValid = (-not $RequireTimestamp) -or $hasTimestamp
    $passed = $isValid -and $timestampValid

    $detail = [ordered]@{
      file = $exe.FullName
      mode = $verificationMode
      status = $signature.Status.ToString()
      statusMessage = $signature.StatusMessage
      signerSubject = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { $null }
      signerThumbprint = if ($signature.SignerCertificate) { $signature.SignerCertificate.Thumbprint } else { $null }
      hasTimestamp = $hasTimestamp
      timestampSubject = if ($signature.TimeStamperCertificate) { $signature.TimeStamperCertificate.Subject } else { $null }
      passed = $passed
    }

    $results += $detail
    continue
  }

  $verifyOutput = & $signToolPath verify /pa /all $exe.FullName 2>&1
  $verifyExitCode = $LASTEXITCODE
  $timestampOutput = & $signToolPath verify /pa /all /tw $exe.FullName 2>&1
  $timestampExitCode = $LASTEXITCODE

  $isValid = $verifyExitCode -eq 0
  $hasTimestamp = $timestampExitCode -eq 0
  $timestampValid = (-not $RequireTimestamp) -or $hasTimestamp
  $passed = $isValid -and $timestampValid

  $statusMessage = ($verifyOutput | Out-String).Trim()
  if (-not $timestampValid) {
    $statusMessage = "$statusMessage`nTimestamp verification failed: $($timestampOutput | Out-String)"
  }

  $results += [ordered]@{
    file = $exe.FullName
    mode = $verificationMode
    status = if ($isValid) { "Valid" } else { "Invalid" }
    statusMessage = $statusMessage
    signerSubject = $null
    signerThumbprint = $null
    hasTimestamp = $hasTimestamp
    timestampSubject = $null
    passed = $passed
  }
}

$failed = @($results | Where-Object { -not $_.passed })

$report = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  artifactsPath = $resolvedArtifactsPath.Path
  verificationMode = $verificationMode
  requireTimestamp = [bool]$RequireTimestamp
  includeUnpacked = [bool]$IncludeUnpacked
  summary = [ordered]@{
    total = $results.Count
    passed = $results.Count - $failed.Count
    failed = $failed.Count
  }
  files = $results
}

$reportDirectory = Split-Path -Parent $ReportPath
New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
$report | ConvertTo-Json -Depth 6 | Set-Content -Path $ReportPath -Encoding UTF8

Write-Host "Signature verification report: $ReportPath"
Write-Host "Signed executables passed: $($report.summary.passed)/$($report.summary.total)"

if ($failed.Count -gt 0) {
  foreach ($item in $failed) {
    Write-Host "FAILED: $($item.file) | status=$($item.status) | timestamp=$($item.hasTimestamp)"
  }
  exit 1
}

exit 0
