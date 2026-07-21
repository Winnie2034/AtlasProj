$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "Install Node.js 22+ before starting Atlas."
}

$envPath = Join-Path $root "backend\.env"
if (-not (Test-Path $envPath)) {
  Copy-Item (Join-Path $root "backend\.env.example") $envPath
  Write-Host "Created backend\.env. Add your DATABASE_URL, then rerun Atlas." -ForegroundColor Yellow
  exit 1
}

$content = Get-Content $envPath
if ($content -match "replace_with_your_postgres_password") {
  throw "Add a real DATABASE_URL to backend\.env before starting Atlas."
}

if (-not ($content -match "^HEVY_KEY_ENCRYPTION_KEY=(?!replace_).+")) {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $key = [Convert]::ToBase64String($bytes)
  if ($content -match "^HEVY_KEY_ENCRYPTION_KEY=") {
    $content = $content -replace "^HEVY_KEY_ENCRYPTION_KEY=.*$", "HEVY_KEY_ENCRYPTION_KEY=$key"
    Set-Content $envPath $content
  } else {
    Add-Content $envPath "HEVY_KEY_ENCRYPTION_KEY=$key"
  }
}

npm install
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm run dev
