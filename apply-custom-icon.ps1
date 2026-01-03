# 🎨 Application d'Icone Personnalisee - Stock Management
# Script professionnel pour appliquer une icone personnalisee

param(
    [string]$IconPath = "",
    [switch]$OpenGenerator,
    [switch]$Help
)

$AppName = "Stock Management"
$ShortcutName = "Stock Management.lnk"
$LauncherScript = "Stock-Management-Launcher.ps1"

function Show-Help {
    Write-Host "Application d'Icone Personnalisee - $AppName" -ForegroundColor Magenta
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host ""
    Write-Host "UTILISATION:" -ForegroundColor Yellow
    Write-Host "  .\apply-custom-icon.ps1                    # Mode interactif"
    Write-Host "  .\apply-custom-icon.ps1 -IconPath icon.png # Appliquer icone specifique"
    Write-Host "  .\apply-custom-icon.ps1 -OpenGenerator     # Ouvrir le generateur d'icones"
    Write-Host "  .\apply-custom-icon.ps1 -Help              # Afficher cette aide"
    Write-Host ""
    Write-Host "FORMATS SUPPORTES:" -ForegroundColor Yellow
    Write-Host "  • PNG (recommande pour Windows 10/11)"
    Write-Host "  • ICO (format classique)"
    Write-Host "  • JPG/JPEG (converti automatiquement)"
    Write-Host ""
}

function Open-IconGenerator {
    $generatorPath = "$PSScriptRoot\create-professional-icon.html"
    if (Test-Path $generatorPath) {
        Write-Host "Ouverture du generateur d'icones professionnel..." -ForegroundColor Green
        Start-Process $generatorPath
        Write-Host ""
        Write-Host "Instructions:" -ForegroundColor Yellow
        Write-Host "1. Personnalisez votre icone dans le navigateur"
        Write-Host "2. Cliquez sur 'Telecharger ICO'"
        Write-Host "3. Relancez ce script pour appliquer l'icone"
        Write-Host ""
    } else {
        Write-Host "Generateur d'icones non trouve: $generatorPath" -ForegroundColor Red
    }
}

function Find-IconFiles {
    $iconExtensions = @("*.png", "*.ico", "*.jpg", "*.jpeg")
    $foundIcons = @()
    
    foreach ($ext in $iconExtensions) {
        $icons = Get-ChildItem -Path $PSScriptRoot -Filter $ext -ErrorAction SilentlyContinue
        $foundIcons += $icons
    }
    
    # Priorite aux icones personnalisees Stock Management
    $customIcons = $foundIcons | Where-Object { $_.Name -like "*stock*" -or $_.Name -like "*management*" -or $_.Name -like "*custom*" }
    $otherIcons = $foundIcons | Where-Object { $_.Name -notlike "*stock*" -and $_.Name -notlike "*management*" -and $_.Name -notlike "*custom*" }
    
    return $customIcons + $otherIcons
}

function Apply-CustomIcon {
    param([string]$IconFilePath)
    
    $shortcutPath = "$([Environment]::GetFolderPath('Desktop'))\$ShortcutName"
    $launcherPath = "$PSScriptRoot\$LauncherScript"
    
    if (-not (Test-Path $IconFilePath)) {
        Write-Host "Fichier icone non trouve: $IconFilePath" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path $launcherPath)) {
        Write-Host "Script launcher non trouve: $launcherPath" -ForegroundColor Red
        return $false
    }
    
    try {
        Write-Host "Application de l'icone personnalisee..." -ForegroundColor Yellow
        
        # Creer ou modifier le raccourci
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($shortcutPath)
        $Shortcut.TargetPath = "powershell.exe"
        $Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
        $Shortcut.WorkingDirectory = $PSScriptRoot
        $Shortcut.IconLocation = $IconFilePath
        $Shortcut.Description = "$AppName - Application de Gestion de Stock Intelligente"
        $Shortcut.Save()
        
        Write-Host "Icone appliquee avec succes !" -ForegroundColor Green
        Write-Host "Raccourci mis a jour: $shortcutPath" -ForegroundColor Cyan
        Write-Host "Icone utilisee: $IconFilePath" -ForegroundColor Cyan
        
        # Rafraichir le bureau
        Write-Host "Rafraichissement du bureau..." -ForegroundColor Yellow
        $signature = @'
[DllImport("Shell32.dll")] 
public static extern int SHChangeNotify(int eventId, int flags, IntPtr item1, IntPtr item2);
'@
        $type = Add-Type -MemberDefinition $signature -Name ShellNotify -Namespace Win32 -PassThru
        $type::SHChangeNotify(0x8000000, 0x1000, [IntPtr]::Zero, [IntPtr]::Zero)
        
        Write-Host "Termine ! L'icone devrait apparaitre sur votre bureau." -ForegroundColor Green
        return $true
        
    } catch {
        Write-Host "Erreur lors de l'application de l'icone: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Show-InteractiveMenu {
    Clear-Host
    Write-Host "Application d'Icone Personnalisee - $AppName" -ForegroundColor Magenta
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host ""
    
    # Rechercher les icones disponibles
    $availableIcons = Find-IconFiles
    
    if ($availableIcons.Count -eq 0) {
        Write-Host "Aucune icone trouvee dans le dossier actuel" -ForegroundColor Red
        Write-Host ""
        Write-Host "Options disponibles:" -ForegroundColor Yellow
        Write-Host "1. Ouvrir le generateur d'icones professionnel"
        Write-Host "2. Copier une icone dans ce dossier"
        Write-Host "3. Annuler"
        Write-Host ""
        
        do {
            $choice = Read-Host "Votre choix (1-3)"
            switch ($choice) {
                "1" { Open-IconGenerator; return }
                "2" { 
                    Write-Host "Copiez votre fichier icone (PNG, ICO, JPG) dans ce dossier:" -ForegroundColor Yellow
                    Write-Host "   $PSScriptRoot" -ForegroundColor Cyan
                    Write-Host "Puis relancez ce script." -ForegroundColor Yellow
                    return 
                }
                "3" { Write-Host "Annule."; return }
                default { Write-Host "Choix invalide. Utilisez 1, 2 ou 3." -ForegroundColor Red }
            }
        } while ($true)
        return
    }
    
    Write-Host "Icones disponibles:" -ForegroundColor Green
    Write-Host ""
    
    for ($i = 0; $i -lt $availableIcons.Count; $i++) {
        $icon = $availableIcons[$i]
        $sizeText = ""
        if ($icon.Length -gt 0) { 
            $sizeKB = [math]::Round($icon.Length/1KB, 1)
            $sizeText = " ($sizeKB KB)"
        }
        Write-Host "$($i + 1). $($icon.Name)$sizeText" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "$($availableIcons.Count + 1). Ouvrir le generateur d'icones" -ForegroundColor Yellow
    Write-Host "$($availableIcons.Count + 2). Annuler" -ForegroundColor Red
    Write-Host ""
    
    do {
        $choice = Read-Host "Choisissez une icone (1-$($availableIcons.Count + 2))"
        $choiceNum = 0
        if ([int]::TryParse($choice, [ref]$choiceNum)) {
            if ($choiceNum -ge 1 -and $choiceNum -le $availableIcons.Count) {
                $selectedIcon = $availableIcons[$choiceNum - 1]
                Apply-CustomIcon -IconFilePath $selectedIcon.FullName
                return
            } elseif ($choiceNum -eq ($availableIcons.Count + 1)) {
                Open-IconGenerator
                return
            } elseif ($choiceNum -eq ($availableIcons.Count + 2)) {
                Write-Host "Annule."
                return
            }
        }
        Write-Host "Choix invalide. Utilisez un numero entre 1 et $($availableIcons.Count + 2)." -ForegroundColor Red
    } while ($true)
}

# === LOGIQUE PRINCIPALE ===

if ($Help) {
    Show-Help
    return
}

if ($OpenGenerator) {
    Open-IconGenerator
    return
}

if ($IconPath -ne "") {
    # Mode direct avec chemin specifie
    if (Apply-CustomIcon -IconFilePath $IconPath) {
        Write-Host ""
        Read-Host "Appuyez sur Entree pour fermer"
    }
} else {
    # Mode interactif
    Show-InteractiveMenu
    Write-Host ""
    Read-Host "Appuyez sur Entree pour fermer"
}