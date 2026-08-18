; =====================================================================
;  stockapp.iss
;  Script Inno Setup - genere l'installeur .exe de StockApp (mode offline)
; =====================================================================
;  Pre-requis :
;    - Inno Setup 6 installe : https://jrsoftware.org/isdl.php
;    - Avoir execute build-pack.ps1 au prealable (C:\StockApp pret)
;
;  Generation de l'installeur :
;    iscc stockapp.iss
; =====================================================================

#define MyAppName        "StockApp"
#define MyAppFullName    "StockApp - Gestion de Stock"
#define MyAppVersion     "1.0.0"
#define MyAppPublisher   "StockApp"
#define MyAppExeName     "start.bat"
#define BuildOutput      "C:\StockApp"

[Setup]
AppId={{B8F3C4E2-1234-5678-9ABC-DEF012345678}
AppName={#MyAppFullName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=.\output
OutputBaseFilename=StockApp-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
; Le lanceur doit etre execute en admin pour ouvrir le pare-feu (mode serveur)
PrivilegesRequiredOverridesAllowed=dialog

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Tout le contenu de C:\StockApp est embarque
Source: "{#BuildOutput}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion; Excludes: "logs\*,data\mysql\*,config.env"

; fichier .gitignore evite de copier les donnees runtime

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\bin\app.ico"; Comment: "Lancer StockApp (mode offline)"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\bin\app.ico"; Tasks: desktopicon; Comment: "Lancer StockApp (mode offline)"

[Run]
; Apres installation : lancer l'app directement
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Au desinstallation : nettoyer les donnees runtime (le client est averti)
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\data"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  MsgBoxResult: Integer;
begin
  Result := True;
end;
