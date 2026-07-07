$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Require-Command($name, $hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "Missing required command: $name" -ForegroundColor Red
    Write-Host $hint
    exit 1
  }
}

function Add-ToolDirectoryToPath($toolPath) {
  if ($toolPath) {
    $toolDir = Split-Path -Parent $toolPath
    if ($env:PATH -notlike "*$toolDir*") {
      $env:PATH = "$toolDir;$env:PATH"
    }
  }
}

function Find-Node {
  $command = Get-Command "node" -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $searchRoots = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
  )

  $match = $searchRoots |
    Where-Object { Test-Path $_ } |
    ForEach-Object { Get-ChildItem -Path $_ -Filter "node.exe" -ErrorAction SilentlyContinue } |
    Select-Object -First 1

  if ($match) {
    return $match.FullName
  }

  return $null
}

function Ensure-Node {
  $node = Find-Node
  if ($node) {
    Add-ToolDirectoryToPath $node
    return
  }

  if (-not (Get-Command "winget" -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "Missing required command: node" -ForegroundColor Red
    Write-Host "Install Node.js 22+ from https://nodejs.org, then reopen your terminal."
    exit 1
  }

  Write-Host "Node.js is missing. Installing Node.js LTS locally with winget..."
  winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements

  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:PATH = "$machinePath;$userPath;$env:PATH"

  $node = Find-Node
  if (-not $node) {
    Write-Host ""
    Write-Host "Node.js was installed, but this terminal cannot see it yet." -ForegroundColor Yellow
    Write-Host "Close this terminal, open a new one, and rerun: powershell -ExecutionPolicy Bypass -File .\start.ps1"
    exit 1
  }

  Add-ToolDirectoryToPath $node
}

function Find-PostgresTool($name) {
  $command = Get-Command $name -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $searchRoots = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "$env:LOCALAPPDATA\PostgreSQL"
  )

  $matches = $searchRoots |
    Where-Object { Test-Path $_ } |
    ForEach-Object { Get-ChildItem -Path $_ -Recurse -Filter "$name.exe" -ErrorAction SilentlyContinue } |
    Sort-Object FullName -Descending |
    Select-Object -First 1

  if ($matches) {
    return $matches.FullName
  }

  $service = Get-CimInstance Win32_Service -Filter "Name LIKE 'postgresql%'" -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($service -and $service.PathName) {
    $postgresExe = ($service.PathName -replace '^"', '') -replace '".*$', ''
    $binDir = Split-Path -Parent $postgresExe
    $candidate = Join-Path $binDir "$name.exe"
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Start-LocalPostgres {
  $service = Get-CimInstance Win32_Service -Filter "Name LIKE 'postgresql%'" -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($service -and $service.State -ne "Running") {
    Write-Host "Starting local PostgreSQL service..."
    try {
      Start-Service -Name $service.Name -ErrorAction Stop
    } catch {
      Write-Host "Could not start PostgreSQL service from this terminal." -ForegroundColor Yellow
      Write-Host "Open Windows Services as Administrator, start '$($service.Name)', then rerun this command." -ForegroundColor Yellow
    }
  }
}

function Get-EnvValue($path, $name) {
  $line = Get-Content $path |
    Where-Object { $_ -match "^$([regex]::Escape($name))=" } |
    Select-Object -First 1

  if (-not $line) {
    return $null
  }

  return $line.Substring($name.Length + 1)
}

function Get-DatabaseConfig($databaseUrl) {
  try {
    $uri = [Uri]$databaseUrl
    $userInfo = $uri.UserInfo.Split(":", 2)
    $database = $uri.AbsolutePath.TrimStart("/")

    if ($userInfo.Length -lt 2 -or -not $database) {
      throw "DATABASE_URL must include username, password, host, port, and database name."
    }

    return @{
      Host = $uri.Host
      Port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
      User = [Uri]::UnescapeDataString($userInfo[0])
      Password = [Uri]::UnescapeDataString($userInfo[1])
      Database = $database
    }
  } catch {
    throw "DATABASE_URL is not valid. Expected format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
  }
}

Ensure-Node

Require-Command "npm" "Node.js is installed, but npm is not available. Reinstall Node.js LTS from https://nodejs.org."

$envPath = Join-Path $root "backend\.env"
if (-not (Test-Path $envPath)) {
  Copy-Item (Join-Path $root "backend\.env.example") $envPath
  Write-Host "Created backend\.env. Add your real DATABASE_URL and HEVY_API_KEY, then rerun this command." -ForegroundColor Yellow
  exit 1
}

$databaseUrl = Get-EnvValue $envPath "DATABASE_URL"
$hevyApiKey = Get-EnvValue $envPath "HEVY_API_KEY"
if (-not $databaseUrl -or $databaseUrl -like "*replace_with_your_postgres_password*") {
  Write-Host "backend\.env needs a real DATABASE_URL before Atlas can start." -ForegroundColor Yellow
  exit 1
}

if (-not $hevyApiKey -or $hevyApiKey -like "*replace_with_your_hevy_api_key*") {
  Write-Host "backend\.env needs a real HEVY_API_KEY before Atlas can sync Hevy data." -ForegroundColor Yellow
  exit 1
}

$databaseConfig = Get-DatabaseConfig $databaseUrl

Start-LocalPostgres

$psql = Find-PostgresTool "psql"

if (-not $psql) {
  Write-Host ""
  Write-Host "PostgreSQL is not installed locally, or its bin folder is not discoverable." -ForegroundColor Red
  Write-Host "Install PostgreSQL 15+ locally, then rerun this command."
  Write-Host "After install, make sure this folder exists or is on PATH: C:\Program Files\PostgreSQL\<version>\bin"
  exit 1
}

Write-Host "Checking local PostgreSQL database..."
$env:PGPASSWORD = $databaseConfig.Password
& $psql -h $databaseConfig.Host -p $databaseConfig.Port -U $databaseConfig.User -d $databaseConfig.Database -v ON_ERROR_STOP=1 -c "SELECT 1;"
if ($LASTEXITCODE -ne 0) {
  throw "Could not connect to local PostgreSQL using the DATABASE_URL in backend\.env. Check the password and service status."
}

$env:PGPASSWORD = ""

Write-Host "Installing dependencies..."
npm install

Write-Host "Preparing database..."
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run prisma:seed

Write-Host ""
Write-Host "Atlas frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Atlas backend:  http://localhost:4000/api" -ForegroundColor Green
Write-Host "PostgreSQL:     $($databaseConfig.Host):$($databaseConfig.Port) / $($databaseConfig.Database) / $($databaseConfig.User)" -ForegroundColor Green
Write-Host ""

npm run dev
