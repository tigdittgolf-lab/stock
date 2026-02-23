# Script pour remplacer toutes les URLs hardcodées par BACKEND_URL

Write-Host "🔧 Correction de toutes les routes API avec BACKEND_URL..." -ForegroundColor Cyan

$files = @(
    "frontend/app/api/suppliers/route.ts",
    "frontend/app/api/sales/proformas/route.ts",
    "frontend/app/api/sales/proforma/[id]/route.ts",
    "frontend/app/api/sales/proforma/route.ts",
    "frontend/app/api/sales/proforma/next-number/route.ts",
    "frontend/app/api/sales/invoices/[id]/route.ts",
    "frontend/app/api/sales/invoices/route.ts",
    "frontend/app/api/sales/delivery-notes/[id]/edit/route.ts",
    "frontend/app/api/rpc/get_fact_for_pdf/route.ts",
    "frontend/app/api/pdf/proforma/[id]/route.ts",
    "frontend/app/api/pdf/invoice/[id]/route.ts",
    "frontend/app/api/pdf/delivery-note-ticket/[id]/route.ts",
    "frontend/app/api/pdf/delivery-note-small/[id]/route.ts",
    "frontend/app/api/pdf/debug-bl/[id]/route.ts",
    "frontend/app/api/health/route.ts",
    "frontend/app/api/database/test/route.ts",
    "frontend/app/api/database/switch/route.ts",
    "frontend/app/api/clients/route.ts"
)

$patterns = @(
    @{
        Old = "process.env.NODE_ENV === 'production' `n      ? 'https://midi-charm-harvard-performed.trycloudflare.com/api'`n      : 'http://localhost:3005/api'"
        New = "process.env.BACKEND_URL `n      ? ```${process.env.BACKEND_URL}/api```n      : 'http://localhost:3005/api'"
    },
    @{
        Old = "process.env.NODE_ENV === 'production' `n  ? 'https://midi-charm-harvard-performed.trycloudflare.com/api'`n  : 'http://localhost:3005/api'"
        New = "process.env.BACKEND_URL `n  ? ```${process.env.BACKEND_URL}/api```n  : 'http://localhost:3005/api'"
    },
    @{
        Old = "process.env.NODE_ENV === 'production' `n      ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'`n      : 'http://localhost:3005/api'"
        New = "process.env.BACKEND_URL `n      ? ```${process.env.BACKEND_URL}/api```n      : 'http://localhost:3005/api'"
    },
    @{
        Old = "process.env.NODE_ENV === 'production' `n  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'`n  : 'http://localhost:3005/api'"
        New = "process.env.BACKEND_URL `n  ? ```${process.env.BACKEND_URL}/api```n  : 'http://localhost:3005/api'"
    },
    @{
        Old = "process.env.NODE_ENV === 'production' `n  ? 'https://desktop-bhhs068.tail1d9c54.ts.net'`n  : 'http://localhost:3005'"
        New = "process.env.BACKEND_URL `n  ? process.env.BACKEND_URL`n  : 'http://localhost:3005'"
    },
    @{
        Old = "```${process.env.NODE_ENV === 'production' ? 'https://midi-charm-harvard-performed.trycloudflare.com' : 'http://localhost:3005'}"
        New = "```${process.env.BACKEND_URL || 'http://localhost:3005'}"
    },
    @{
        Old = "```${process.env.NODE_ENV === 'production' ? 'https://desktop-bhhs068.tail1d9c54.ts.net' : 'http://localhost:3005'}"
        New = "```${process.env.BACKEND_URL || 'http://localhost:3005'}"
    }
)

$totalFixed = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        # Remplacer toutes les occurrences
        $content = $content -replace "process\.env\.NODE_ENV === 'production'\s*\n\s*\? 'https://midi-charm-harvard-performed\.trycloudflare\.com/api'\s*\n\s*: 'http://localhost:3005/api'", "process.env.BACKEND_URL `n      ? ```${process.env.BACKEND_URL}/api```n      : 'http://localhost:3005/api'"
        
        $content = $content -replace "process\.env\.NODE_ENV === 'production'\s*\n\s*\? 'https://desktop-bhhs068\.tail1d9c54\.ts\.net/api'\s*\n\s*: 'http://localhost:3005/api'", "process.env.BACKEND_URL `n      ? ```${process.env.BACKEND_URL}/api```n      : 'http://localhost:3005/api'"
        
        $content = $content -replace "process\.env\.NODE_ENV === 'production'\s*\n\s*\? 'https://desktop-bhhs068\.tail1d9c54\.ts\.net'\s*\n\s*: 'http://localhost:3005'", "process.env.BACKEND_URL `n  ? process.env.BACKEND_URL`n  : 'http://localhost:3005'"
        
        $content = $content -replace "\`\$\{process\.env\.NODE_ENV === 'production' \? 'https://midi-charm-harvard-performed\.trycloudflare\.com' : 'http://localhost:3005'\}", "```${process.env.BACKEND_URL || 'http://localhost:3005'}"
        
        $content = $content -replace "\`\$\{process\.env\.NODE_ENV === 'production' \? 'https://desktop-bhhs068\.tail1d9c54\.ts\.net' : 'http://localhost:3005'\}", "```${process.env.BACKEND_URL || 'http://localhost:3005'}"
        
        if ($content -ne $originalContent) {
            Set-Content $file -Value $content -NoNewline
            Write-Host "✅ Fixed: $file" -ForegroundColor Green
            $totalFixed++
        } else {
            Write-Host "⏭️  Skipped (no changes): $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✅ Correction terminée! $totalFixed fichiers modifiés." -ForegroundColor Green
Write-Host "📝 N'oubliez pas de commit et push les changements!" -ForegroundColor Cyan
