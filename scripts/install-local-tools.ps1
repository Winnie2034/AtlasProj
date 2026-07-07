$ErrorActionPreference = "Stop"

if (-not (Get-Command "winget" -ErrorAction SilentlyContinue)) {
  Write-Host "winget is not available on this machine." -ForegroundColor Red
  Write-Host "Install PostgreSQL 15+ and DBeaver Community manually, then rerun scripts\dev-local.ps1."
  exit 1
}

Write-Host "Installing Node.js LTS locally..."
winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements

Write-Host "Installing PostgreSQL locally..."
winget install --id PostgreSQL.PostgreSQL -e

Write-Host "Installing DBeaver Community locally..."
winget install --id dbeaver.dbeaver.community -e --accept-source-agreements --accept-package-agreements

Write-Host ""
Write-Host "After installation, reopen your terminal and run:" -ForegroundColor Green
Write-Host "powershell -ExecutionPolicy Bypass -File .\start.ps1"
