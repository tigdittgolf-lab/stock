# WhatsApp Business API Test Script
$WHATSAPP_ACCESS_TOKEN = "EABAt72ZAXWokBQcngxb3oO4u7Oiony89weZBAqlEEA8H6b86M8ZCX71TpsU5LZAHtJeL6yXdx57es4vZCI5lYrk4Rt8tTZB7mPHzprhilI1WtCmpkKXV8JiJCIOil4AD4N7RhrMWVY2N95C0yDyVZCqW5L18wjr2UbSSdQa5SPT3CC0Ka92jZCJHSKizkfcx21WI6D3BnHlBhBWTnAnuCa0GssFlNINcrh8J5tIDPmUgXpjZB3XAmZAx668ZCjpCKZAc5oFj07XB3VQKFLJaoFGeyCpN"
$WHATSAPP_PHONE_NUMBER_ID = "1003772659482663"
$WHATSAPP_BUSINESS_ACCOUNT_ID = "726078073628981"
$WHATSAPP_API_VERSION = "v18.0"

Write-Host "🔍 Testing WhatsApp Business API Configuration..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Check access token validity
Write-Host "1️⃣ Testing Access Token..." -ForegroundColor Cyan
try {
    $tokenUrl = "https://graph.facebook.com/$WHATSAPP_API_VERSION/me?access_token=$WHATSAPP_ACCESS_TOKEN"
    $tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Method Get
    Write-Host "✅ Access Token is valid" -ForegroundColor Green
    Write-Host "📊 Token info: $($tokenResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Access Token is invalid: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check Phone Number
Write-Host "2️⃣ Testing Phone Number..." -ForegroundColor Cyan
try {
    $phoneUrl = "https://graph.facebook.com/$WHATSAPP_API_VERSION/$WHATSAPP_PHONE_NUMBER_ID?access_token=$WHATSAPP_ACCESS_TOKEN"
    $phoneResponse = Invoke-RestMethod -Uri $phoneUrl -Method Get
    Write-Host "✅ Phone Number accessible" -ForegroundColor Green
    Write-Host "📊 Phone info: $($phoneResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Phone Number error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Send test message
Write-Host "3️⃣ Sending test message to +213792901660..." -ForegroundColor Cyan
try {
    $messageUrl = "https://graph.facebook.com/$WHATSAPP_API_VERSION/$WHATSAPP_PHONE_NUMBER_ID/messages"
    $headers = @{
        'Authorization' = "Bearer $WHATSAPP_ACCESS_TOKEN"
        'Content-Type' = 'application/json'
    }
    
    $body = @{
        messaging_product = 'whatsapp'
        to = '213792901660'
        type = 'text'
        text = @{
            body = "🧪 Test message from Stock Management System - $(Get-Date)"
        }
    } | ConvertTo-Json
    
    $messageResponse = Invoke-RestMethod -Uri $messageUrl -Method Post -Headers $headers -Body $body
    Write-Host "✅ Test message sent successfully!" -ForegroundColor Green
    Write-Host "📊 Message info: $($messageResponse | ConvertTo-Json)" -ForegroundColor Gray
    Write-Host "📱 Message ID: $($messageResponse.messages[0].id)" -ForegroundColor Green
    Write-Host "📱 WhatsApp ID: $($messageResponse.contacts[0].wa_id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Test message failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more detailed error info
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "🔍 Detailed error: $errorBody" -ForegroundColor Yellow
        
        # Parse error for common issues
        if ($errorBody -like "*131026*") {
            Write-Host "💡 Error 131026: The recipient number is not in your test phone numbers list." -ForegroundColor Yellow
            Write-Host "💡 Go to Facebook Developers > WhatsApp > Configuration > Add +213792901660 to test numbers." -ForegroundColor Yellow
        }
        
        if ($errorBody -like "*131047*") {
            Write-Host "💡 Error 131047: The recipient has not accepted your message request." -ForegroundColor Yellow
            Write-Host "💡 The recipient needs to send a message to your WhatsApp Business number first." -ForegroundColor Yellow
        }
        
        if ($errorBody -like "*131051*") {
            Write-Host "💡 Error 131051: The recipient number is not a valid WhatsApp number." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "📋 DIAGNOSTIC COMPLETE" -ForegroundColor Yellow
Write-Host "🔍 If messages are being sent successfully but not received:" -ForegroundColor Cyan
Write-Host "   1. Check that +213792901660 is added to test phone numbers in Facebook Developers" -ForegroundColor Gray
Write-Host "   2. Make sure the WhatsApp Business account is verified" -ForegroundColor Gray
Write-Host "   3. The recipient might need to send a message to your business number first" -ForegroundColor Gray
Write-Host "   4. Check if the phone number is correctly formatted and is a valid WhatsApp number" -ForegroundColor Gray