# Créer une icône personnalisée pour Stock Management

Add-Type -AssemblyName System.Drawing

# Créer une bitmap 32x32
$bitmap = New-Object System.Drawing.Bitmap(32, 32)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Couleurs
$bgColor = [System.Drawing.Color]::FromArgb(45, 85, 135)      # Bleu professionnel
$boxColor = [System.Drawing.Color]::FromArgb(255, 165, 0)     # Orange pour les boîtes
$textColor = [System.Drawing.Color]::White

# Remplir le fond
$graphics.FillRectangle([System.Drawing.Brushes]::new($bgColor), 0, 0, 32, 32)

# Dessiner des boîtes empilées (représentant le stock)
$boxBrush = [System.Drawing.SolidBrush]::new($boxColor)

# Boîte du bas
$graphics.FillRectangle($boxBrush, 4, 20, 12, 8)
$graphics.DrawRectangle([System.Drawing.Pens]::Black, 4, 20, 12, 8)

# Boîte du milieu
$graphics.FillRectangle($boxBrush, 6, 14, 12, 8)
$graphics.DrawRectangle([System.Drawing.Pens]::Black, 6, 14, 12, 8)

# Boîte du haut
$graphics.FillRectangle($boxBrush, 8, 8, 12, 8)
$graphics.DrawRectangle([System.Drawing.Pens]::Black, 8, 8, 12, 8)

# Ajouter un petit graphique (représentant les statistiques)
$pen = [System.Drawing.Pen]::new($textColor, 2)
$graphics.DrawLine($pen, 22, 25, 24, 20)
$graphics.DrawLine($pen, 24, 20, 26, 15)
$graphics.DrawLine($pen, 26, 15, 28, 18)

# Sauvegarder comme ICO
$iconPath = "$PSScriptRoot\stock-management.ico"

try {
    # Convertir en ICO (méthode simple)
    $bitmap.Save("$PSScriptRoot\stock-management.png", [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "✅ Icône créée: stock-management.png" -ForegroundColor Green
    
    # Note: Pour un vrai ICO, il faudrait un convertisseur externe
    Write-Host "💡 Pour convertir en .ico, utilisez un outil en ligne ou:" -ForegroundColor Yellow
    Write-Host "   https://convertio.co/png-ico/" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erreur création icône: $($_.Exception.Message)" -ForegroundColor Red
}

# Nettoyer
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "🎨 Icône personnalisée créée !" -ForegroundColor Green