# =====================================================================
#  build-pack.ps1
#  Construit le pack offline complet (un dossier pret a livrer).
#  Telecharge automatiquement MariaDB et Node.js portables.
#  Produit un ZIP final contenant tout.
# =====================================================================
#  Utilisation :
#    .\build-pack.ps1 -RepoRoot C:\netbean\St_Article_1 -OutDir D:\StockApp_test
# =====================================================================
[CmdletBinding()]
param(
    [string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)),
    [string]$OutDir   = 'D:\StockApp_test',
    [switch]$SkipFrontendBuild,
    [switch]$SkipBackendInstall,
    [switch]$SkipDownload    # evite de telecharger MariaDB/Node
)

$ErrorActionPreference = 'Stop'

function Write-Step($m) { Write-Host "`n>>> $m" -ForegroundColor Cyan }
function Write-Ok($m)   { Write-Host "    [OK] $m" -ForegroundColor Green }
function Write-Warn2($m){ Write-Host "    [!]  $m" -ForegroundColor Yellow }
function Write-Err($m)  { Write-Host "    [X]  $m" -ForegroundColor Red }

function Download-File {
    param([string]$Url, [string]$OutFile, [string]$Label)
    Write-Host "    Telechargement de $Label..." -ForegroundColor DarkGray
    Write-Host "        $Url" -ForegroundColor DarkGray
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add('User-Agent', 'StockApp-Build/1.0')
        $wc.DownloadFile($Url, $OutFile)
        if ((Get-Item $OutFile).Length -eq 0) { throw "Fichier vide" }
        Write-Ok "$Label telecharge ($((Get-Item $OutFile).Length / 1MB) MB)"
    } catch {
        throw "Echec du telechargement de $Label : $_"
    }
}

function Expand-Zip {
    param([string]$ZipPath, [string]$DestDir, [string]$Label)
    Write-Host "    Extraction de $Label..." -ForegroundColor DarkGray
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $DestDir)
        Write-Ok "$Label extrait dans $DestDir"
    } catch {
        throw "Echec de l'extraction de $Label : $_"
    }
}

$RepoRoot = (Resolve-Path $RepoRoot).Path
$OfflinePack = Join-Path $RepoRoot 'offline-pack'

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  Construction du pack offline StockApp" -ForegroundColor Cyan
Write-Host "  Source  : $RepoRoot" -ForegroundColor DarkGray
Write-Host "  Sortie  : $OutDir" -ForegroundColor DarkGray
Write-Host "=============================================================" -ForegroundColor Cyan

# --- Nettoyage / creation de la sortie ---
Write-Step "Preparation du dossier de sortie"
if (Test-Path $OutDir) {
    Write-Warn2 "$OutDir existe deja. On le supprime."
    Remove-Item -Recurse -Force $OutDir
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OutDir 'bin')        | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OutDir 'data')      | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OutDir 'logs')      | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OutDir 'database')  | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OutDir 'scripts')   | Out-Null
Write-Ok "Structure creee"

# --- 0. Cache de telechargement dans offline-pack\bin\ ---
Write-Step "Telechargement des binaires portables"
$BinCache = Join-Path $OfflinePack 'bin'
$MariadbSrc = Join-Path $BinCache 'mariadb'
$NodeSrc    = Join-Path $BinCache 'node'

# Creer le dossier cache s'il n'existe pas
if (-not (Test-Path $BinCache)) { New-Item -ItemType Directory -Force -Path $BinCache | Out-Null }

if (-not $SkipDownload) {
    # MariaDB portable
    if (Test-Path (Join-Path $MariadbSrc 'bin\mysqld.exe')) {
        Write-Ok "MariaDB deja present dans $MariadbSrc"
    } else {
        $mariadbZip = Join-Path $BinCache 'mariadb.zip'
        $mariadbUrl = 'https://archive.mariadb.org/mariadb-10.6.18/winx64-packages/mariadb-10.6.18-winx64.zip'
        Download-File -Url $mariadbUrl -OutFile $mariadbZip -Label 'MariaDB 10.6.18'
        $tmpDir = Join-Path $BinCache '_mariadb_extract'
        Expand-Zip -ZipPath $mariadbZip -DestDir $tmpDir -Label 'MariaDB'
        $extracted = Get-ChildItem $tmpDir -Directory | Select-Object -First 1
        if (-not $extracted) { throw "Aucun dossier trouve dans l'archive MariaDB" }
        Move-Item -Path $extracted.FullName -Destination $MariadbSrc -Force
        Remove-Item -Recurse -Force $tmpDir
        Remove-Item -Force $mariadbZip
        Write-Ok "MariaDB portable installe dans $MariadbSrc"
    }

    # Node.js portable
    if (Test-Path (Join-Path $NodeSrc 'node.exe')) {
        Write-Ok "Node.js deja present dans $NodeSrc"
    } else {
        $nodeZip = Join-Path $BinCache 'node.zip'
        $nodeUrl = 'https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip'
        Download-File -Url $nodeUrl -OutFile $nodeZip -Label 'Node.js 22.11.0'
        $tmpDir = Join-Path $BinCache '_node_extract'
        Expand-Zip -ZipPath $nodeZip -DestDir $tmpDir -Label 'Node.js'
        $extracted = Get-ChildItem $tmpDir -Directory | Select-Object -First 1
        if (-not $extracted) { throw "Aucun dossier trouve dans l'archive Node.js" }
        Move-Item -Path $extracted.FullName -Destination $NodeSrc -Force
        Remove-Item -Recurse -Force $tmpDir
        Remove-Item -Force $nodeZip
        Write-Ok "Node.js portable installe dans $NodeSrc"
    }
} else {
    Write-Warn2 "Telechargement ignore (-SkipDownload)"
}

# --- 1. Backend ---
Write-Step "Preparation du backend"
$BackendSrc = Join-Path $RepoRoot 'backend'
$BackendDst = Join-Path $OutDir 'backend'

robocopy $BackendSrc $BackendDst /E /XD node_modules .next /XF *.log bun.lock /NJH /NJS /NFL /NDL | Out-Null

if (-not $SkipBackendInstall) {
    Write-Host "    Installation des dependances backend..." -ForegroundColor DarkGray
    Push-Location $BackendDst
    try {
        $bunExe = Get-Command bun -ErrorAction SilentlyContinue
        $savedErrorAction = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $bunLockPath = Join-Path $BackendDst 'bun.lock'
        if (Test-Path $bunLockPath) { Remove-Item -Force $bunLockPath }
        $npmLockPath = Join-Path $BackendDst 'package-lock.json'
        if (Test-Path $npmLockPath) { Remove-Item -Force $npmLockPath }
        if ($bunExe) {
            $installOutput = & bun install --production 2>&1
            if ($LASTEXITCODE -ne 0) { $ErrorActionPreference = $savedErrorAction; throw "bun install failed: $installOutput" }
            Write-Ok "Dependances installees (Bun)"
        } else {
            $installOutput = & npm install --production 2>&1
            if ($LASTEXITCODE -ne 0) { $ErrorActionPreference = $savedErrorAction; throw "npm install failed: $installOutput" }
            Write-Ok "Dependances installees (npm)"
        }

        Write-Host "    Compilation TypeScript -> JavaScript..." -ForegroundColor DarkGray
        $compileOk = $false
        if ($bunExe) {
            Write-Host "        bun build ./index.ts --outdir ./dist --target node --packages external" -ForegroundColor DarkGray
            $buildOutput = & bun build ./index.ts --outdir ./dist --target node --packages external 2>&1
            if ($LASTEXITCODE -eq 0) {
                $compileOk = $true
                Write-Ok "Backend compile via bun dans dist/"
            } else {
                Write-Warn2 "bun build a echoue :"
                $buildOutput | ForEach-Object { Write-Host "        $_" -ForegroundColor Red }
                Write-Warn2 "essai avec tsc..."
            }
        }
        if (-not $compileOk) {
            Write-Host "        npx -p typescript tsc --project tsconfig.build.json" -ForegroundColor DarkGray
            $tscOutput = & npx -p typescript tsc --project tsconfig.build.json 2>&1
            if ($LASTEXITCODE -eq 0) {
                $compileOk = $true
                Write-Ok "Backend compile via tsc dans dist/"
            } else {
                Write-Warn2 "tsc a echoue :"
                $tscOutput | ForEach-Object { Write-Host "        $_" -ForegroundColor Red }
            }
        }
        if ($compileOk) {
            Get-ChildItem -Recurse -Filter *.ts | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\dist\\' } | Remove-Item -Force
            Write-Ok "Fichiers source .ts supprimes (protection du code)"
            Copy-Item -Path (Join-Path $BackendDst 'package.json') -Destination (Join-Path $BackendDst 'dist\') -Force
        } else {
            Write-Warn2 "Echec de la compilation, conservation des sources .ts"
        }
        $ErrorActionPreference = $savedErrorAction
    } finally {
        Pop-Location
    }
} else {
    Write-Warn2 "Installation backend sautee (-SkipBackendInstall)"
}

# --- 2. Frontend ---
Write-Step "Preparation du frontend"
$FrontendSrc = Join-Path $RepoRoot 'frontend'
$FrontendDst = Join-Path $OutDir 'frontend'

robocopy $FrontendSrc $FrontendDst /E /XD node_modules .next .vercel /XF *.log *.tsbuildinfo test-db-target-*.json /NJH /NJS /NFL /NDL | Out-Null

if (-not $SkipFrontendBuild) {
    Write-Host "    Installation + build Next.js (peut durer quelques minutes)..." -ForegroundColor DarkGray
    Push-Location $FrontendDst
    try {
        $savedErrorActionFe = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $frontendInstall = & npm install 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Warn2 "npm install frontend: $frontendInstall" }
        $frontendBuild = & npm run build 2>&1
        $ErrorActionPreference = $savedErrorActionFe
        if (Test-Path (Join-Path $FrontendDst '.next')) {
            Write-Ok "Frontend builde"
            Write-Host "    Suppression des fichiers source frontend..." -ForegroundColor DarkGray
            $sourceDirs = @('app', 'src', 'components', 'contexts', 'hooks', 'lib', 'utils')
            foreach ($dir in $sourceDirs) {
                $fullPath = Join-Path $FrontendDst $dir
                if (Test-Path $fullPath) { Remove-Item -Recurse -Force $fullPath -ErrorAction SilentlyContinue }
            }
            Get-ChildItem -Path $FrontendDst -Recurse -Filter *.ts -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' } | Remove-Item -Force
            Get-ChildItem -Path $FrontendDst -Recurse -Filter *.tsx -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' } | Remove-Item -Force
            Write-Ok "Fichiers source frontend supprimes (protection du code)"
        } else {
            Write-Err "Le build frontend a echoue (.next absent)"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Warn2 "Build frontend saute (-SkipFrontendBuild)"
}

# --- 3. Base de donnees ---
Write-Step "Copie du schema SQL"
Copy-Item -Path (Join-Path $OfflinePack 'database\schema-mysql.sql') -Destination (Join-Path $OutDir 'database\') -Force
Copy-Item -Path (Join-Path $OfflinePack 'database\seed-admin.sql')   -Destination (Join-Path $OutDir 'database\') -Force
Write-Ok "Fichiers SQL copies"

# --- 4. Scripts de lancement ---
Write-Step "Copie des scripts et du lanceur"
Copy-Item -Path (Join-Path $OfflinePack 'start.bat')                  -Destination $OutDir -Force
Copy-Item -Path (Join-Path $OfflinePack 'scripts\StockApp-Launcher.ps1') -Destination (Join-Path $OutDir 'scripts\') -Force
Copy-Item -Path (Join-Path $OfflinePack 'scripts\setup-config.ps1')     -Destination (Join-Path $OutDir 'scripts\') -Force
Copy-Item -Path (Join-Path $OfflinePack 'scripts\setup-first-run.ps1')  -Destination (Join-Path $OutDir 'scripts\') -Force
Copy-Item -Path (Join-Path $OfflinePack 'scripts\generate-license.ps1') -Destination (Join-Path $OutDir 'scripts\') -Force
Copy-Item -Path (Join-Path $OfflinePack 'scripts\wait-for-port.ps1')    -Destination (Join-Path $OutDir 'scripts\') -Force
Copy-Item -Path (Join-Path $OfflinePack 'scripts\install-firewall-rules.ps1') -Destination (Join-Path $OutDir 'scripts\') -Force
Write-Ok "Scripts copies"

# --- 5. Binaire MariaDB portable ---
Write-Step "Copie de MariaDB portable"
$MariadbDst = Join-Path $OutDir 'bin\mariadb'
$MysqlDataDir = Join-Path $OutDir 'data\mysql'
if (Test-Path (Join-Path $MariadbSrc 'bin\mysqld.exe')) {
    robocopy $MariadbSrc $MariadbDst /E /NJH /NJS /NFL /NDL | Out-Null
    Write-Ok "MariaDB portable copie dans le pack"
    # Ajouter les DLLs VC++ runtime (manquantes dans MariaDB portable)
    $mariadbBin = Join-Path $MariadbDst 'bin'
    $vcDlls = @('vcruntime140.dll', 'vcruntime140_1.dll', 'msvcp140.dll', 'msvcp140_1.dll', 'concrt140.dll')
    $missingDlls = $vcDlls | Where-Object { -not (Test-Path (Join-Path $mariadbBin $_)) -and -not (Test-Path ([System.IO.Path]::Combine([System.Environment]::SystemDirectory, $_))) }
    if ($missingDlls.Count -gt 0) {
        Write-Host "    Telechargement des DLLs VC++ runtime..." -ForegroundColor DarkGray
        $vcUrl = 'https://aka.ms/vs/17/release/vc_redist.x64.exe'
        $vcExe = Join-Path $BinCache 'vc_redist.x64.exe'
        if (-not (Test-Path $vcExe)) {
            Download-File -Url $vcUrl -OutFile $vcExe -Label 'VC++ Redistributable'
        }
        $vcTmp = Join-Path $BinCache '_vc_extract'
        Remove-Item -Recurse -Force $vcTmp -ErrorAction SilentlyContinue
        New-Item -ItemType Directory -Force -Path $vcTmp | Out-Null
        Write-Host "    Extraction des DLLs..." -ForegroundColor DarkGray
        $extractProc = Start-Process -FilePath $vcExe -ArgumentList @("/extract:$vcTmp", "/quiet", "/norestart") -NoNewWindow -Wait -PassThru
        if ($extractProc.ExitCode -eq 0 -or $extractProc.ExitCode -eq 3010) {
            Get-ChildItem -Path $vcTmp -Recurse -Filter '*.dll' | Where-Object { $_.Name -match '^(vcruntime|msvcp|concrt|vcamp)' } | ForEach-Object {
                $dst = Join-Path $mariadbBin $_.Name
                if (-not (Test-Path $dst)) { Copy-Item -Path $_.FullName -Destination $dst -Force }
            }
            Write-Ok "DLLs VC++ runtime ajoutees a MariaDB"
        } else {
            Write-Warn2 "Extraction VC++ echouee (code $($extractProc.ExitCode))"
        }
        Remove-Item -Recurse -Force $vcTmp -ErrorAction SilentlyContinue
    } else {
        Write-Ok "DLLs VC++ runtime deja disponibles"
    }

    #     # Tester si les exe fonctionnent
    Write-Host "    Test des executables MariaDB..." -ForegroundColor DarkGray
    Push-Location $mariadbBin
    foreach ($exe in @('mariadbd.exe', 'mysqld.exe')) {
        $dbdExe = Join-Path $mariadbBin $exe
        if (-not (Test-Path $dbdExe)) { continue }
        $verOut = & cmd /c "`"$dbdExe`" --version 2>&1"
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "$exe OK: $($verOut -join ' ')"
        } else {
            Write-Warn2 "$exe --version a echoue (code $LASTEXITCODE)"
            $verOut | ForEach-Object { Write-Host "        $_" -ForegroundColor Red }
        }
    }
    Pop-Location

    # Pre-initialiser le datadir
    if (-not (Test-Path (Join-Path $MysqlDataDir 'mysql'))) {
        Write-Host "    Initialisation du datadir MariaDB..." -ForegroundColor DarkGray
        Push-Location $mariadbBin
        $initOk = $false
        $savedEA = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        # Sur Windows, mysql_install_db est l'outil correct (pas --initialize-insecure)
        $installDb = if (Test-Path '.\mariadb-install-db.exe') { '.\mariadb-install-db.exe' } else { '.\mysql_install_db.exe' }
        if (Test-Path $installDb) {
            Write-Host "        $installDb --datadir $MysqlDataDir" -ForegroundColor DarkGray
            $output = & cmd /c "`"$installDb`" --datadir `"$MysqlDataDir`" 2>&1"
            if ($LASTEXITCODE -eq 0) {
                $initOk = $true
                Write-Ok "Datadir initialise avec succes"
            } else {
                Write-Warn2 "$installDb a echoue (code $LASTEXITCODE) :"
                $output | Select-Object -Last 5 | ForEach-Object { Write-Host "        $_" -ForegroundColor Red }
            }
        } else {
            Write-Warn2 "mysql_install_db.exe non trouve dans $mariadbBin"
        }
        if (-not $initOk) {
            Write-Warn2 "Echec de l'initialisation MariaDB."
            Write-Warn2 "Le datadir sera initialise au 1er lancement par l'utilisateur."
        }
        $ErrorActionPreference = $savedEA
        Pop-Location
    } else {
        Write-Ok "Datadir deja initialise"
    }
} else {
    Write-Err "MariaDB introuvable dans $MariadbSrc"
}

# --- 6. Runtime Node portable ---
Write-Step "Copie de Node.js portable"
$NodeDst = Join-Path $OutDir 'bin\node'
if (Test-Path (Join-Path $NodeSrc 'node.exe')) {
    robocopy $NodeSrc $NodeDst /E /NJH /NJS /NFL /NDL | Out-Null
    Write-Ok "Node.js portable copie dans le pack"
} else {
    Write-Err "Node.js introuvable dans $NodeSrc"
}

# --- 7. Fichier .gitignore dans le pack ---
@'
# Donneés runtime (a ne pas livrer)
data/
logs/
config.env
backend/.env
backend/database-config.json
frontend/.env.local
'@ | Set-Content -Path (Join-Path $OutDir '.gitignore') -Encoding UTF8

# --- 8. Creation du ZIP final ---
Write-Step "Creation du ZIP final"
$zipPath = "$OutDir.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
$compressStart = Get-Date
$totalMB = (Get-ChildItem -Recurse $OutDir | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "    Compression de $([math]::Round($totalMB)) MB en cours..." -ForegroundColor DarkGray
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($OutDir, $zipPath, 'Optimal', $false)
    $elapsed = [math]::Round(((Get-Date) - $compressStart).TotalSeconds)
    Write-Ok "ZIP cree : $zipPath ($([math]::Round((Get-Item $zipPath).Length / 1MB)) MB, ${elapsed}s)"
} catch {
    Write-Warn2 "Echec de la creation du ZIP (Compress-Archive) : $_"
    Write-Host "         le dossier non compresse est disponible dans : $OutDir" -ForegroundColor DarkGray
}

# --- Bilan ---
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host "  Pack pret a livrer !" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green
Write-Host ""

$zipOk = Test-Path $zipPath
if ($zipOk) {
    Write-Host "  ZIP   : $zipPath" -ForegroundColor Cyan
    Write-Host "  Taille: $( [math]::Round((Get-Item $zipPath).Length / 1MB) ) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Livrez ce ZIP au client." -ForegroundColor Green
    Write-Host "  Le client n'a qu'a extraire et double-cliquer sur start.bat" -ForegroundColor Green
} else {
    Write-Host "  Dossier: $OutDir" -ForegroundColor Cyan
    Write-Host "  (la creation du ZIP a echoue, livrez ce dossier compresse manuellement)" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Pour generer l'installeur .exe (optionnel) :" -ForegroundColor Cyan
Write-Host "    iscc `"$OfflinePack\installer\stockapp.iss`"" -ForegroundColor DarkGray
Write-Host ""
