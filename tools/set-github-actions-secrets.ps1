#Requires -Version 5.1
<#
.SYNOPSIS
  Sets Actions secrets for CI/CD deploy (Oracle VM) from this repo folder.

.DESCRIPTION
  Uses GitHub CLI (gh). Install once:
    winget install --id GitHub.cli
  Then authenticate:
    gh auth login
  Run from repo root:
    .\tools\set-github-actions-secrets.ps1

  Override host/user:
    $env:DEPLOY_HOST = '1.2.3.4'; $env:DEPLOY_USER = 'opc'; .\tools\set-github-actions-secrets.ps1

  Environment secrets (Settings → Environments → production) — create the environment in GitHub first:
    .\tools\set-github-actions-secrets.ps1 -Environment production
#>
param(
  [string]$Environment = ''
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error @"
GitHub CLI (gh) is not installed or not on PATH.

Install:
  winget install --id GitHub.cli

Then sign in:
  gh auth login

Re-run this script from the project root.
"@
}

$remote = (git remote get-url origin 2>$null)
if (-not $remote) {
  Write-Error 'No git remote ''origin''. Add origin first (e.g. https://github.com/OWNER/REPO.git).'
}

# owner/repo from https://github.com/basheerbk/skyrover.git or git@github.com:basheerbk/skyrover.git
$repo = $null
if ($remote -match 'github\.com[:/]([^/]+)/([^/.]+)') {
  $repo = "$($Matches[1])/$($Matches[2])"
}
if (-not $repo) {
  Write-Error "Could not parse owner/repo from origin: $remote"
}

$keyFile = Join-Path $RepoRoot 'deploy\github-actions-deploy'
if (-not (Test-Path -LiteralPath $keyFile)) {
  Write-Error "Missing deploy private key: $keyFile. Generate with docs/ci-cd-github.md (One-time: deploy SSH key)."
}

$hostVal = if ($env:DEPLOY_HOST) { $env:DEPLOY_HOST } else { '68.233.112.68' }
$userVal = if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { 'opc' }

$envArgs = @()
if ($Environment) {
  $envArgs += '--env', $Environment
  Write-Host "Target: environment '$Environment' (create it in GitHub first if missing)"
}

Write-Host "Repository: $repo"
Write-Host "Setting DEPLOY_SSH_KEY from deploy\github-actions-deploy ..."
Get-Content -LiteralPath $keyFile -Raw | gh secret set DEPLOY_SSH_KEY -R $repo @envArgs

Write-Host "Setting DEPLOY_HOST=$hostVal ..."
$hostVal | gh secret set DEPLOY_HOST -R $repo @envArgs

Write-Host "Setting DEPLOY_USER=$userVal ..."
$userVal | gh secret set DEPLOY_USER -R $repo @envArgs

Write-Host 'Done. Check: gh secret list -R' $repo @envArgs
