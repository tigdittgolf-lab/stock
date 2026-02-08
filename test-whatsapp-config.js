const fetch = require('node-fetch');

// WhatsApp configuration from backend/.env
const WHATSAPP_ACCESS_TOKEN = 'EABAt72ZAXWokBQcngxb3oO4u7Oiony89weZBAqlEEA8H6b86M8ZCX71TpsU5LZAHtJeL6yXdx57es4vZCI5lYrk4Rt8tTZB7mPHzprhilI1WtCmpkKXV8JiJCIOil4AD4N7RhrMWVY2N95C0yDyVZCqW5L18wjr2UbSSdQa5SPT3CC0Ka92jZCJHSKizkfcx21WI6D3BnHlBhBWTnAnuCa0GssFlNINcrh8J5tIDPmUgXpjZB3XAmZAx668ZCjpCKZAc5oFj07XB3VQKFLJaoFGeyCpN';
const WHATSAPP_PHONE_NUMBER_ID = '1003772659482663';
const WHATSAPP_BUSINESS_ACCOUNT_ID = '726078073628981';
const WHATSAPP_API_VERSION = 'v18.0';

async function testWhatsAppConfiguration() {
  console.log('🔍 Testing WhatsApp Business API Configuration...\n');
  
  // Test 1: Check access token validity
  console.log('1️⃣ Testing Access Token...');
  try {
    const tokenResponse = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/me?access_token=${WHATSAPP_ACCESS_TOKEN}`);
    const tokenData = await tokenResponse.json();
    
    if (tokenResponse.ok) {
      console.log('✅ Access Token is valid');
      console.log('📊 Token info:', tokenData);
    } else {
      console.log('❌ Access Token is invalid:', tokenData);
      return;
    }
  } catch (error) {
    console.log('❌ Error testing access token:', error.message);
    return;
  }
  
  console.log('\n');
  
  // Test 2: Check WhatsApp Business Account
  console.log('2️⃣ Testing WhatsApp Business Account...');
  try {
    const accountResponse = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}?access_token=${WHATSAPP_ACCESS_TOKEN}`);
    const accountData = await accountResponse.json();
    
    if (accountResponse.ok) {
      console.log('✅ WhatsApp Business Account accessible');
      console.log('📊 Account info:', accountData);
    } else {
      console.log('❌ WhatsApp Business Account error:', accountData);
    }
  } catch (error) {
    console.log('❌ Error testing business account:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: Check Phone Number
  console.log('3️⃣ Testing Phone Number...');
  try {
    const phoneResponse = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}?access_token=${WHATSAPP_ACCESS_TOKEN}`);
    const phoneData = await phoneResponse.json();
    
    if (phoneResponse.ok) {
      console.log('✅ Phone Number accessible');
      console.log('📊 Phone info:', phoneData);
    } else {
      console.log('❌ Phone Number error:', phoneData);
    }
  } catch (error) {
    console.log('❌ Error testing phone number:', error.message);
  }
  
  console.log('\n');
  
  // Test 4: Send test message
  console.log('4️⃣ Sending test message to +213792901660...');
  try {
    const messageResponse = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '213792901660', // Remove + prefix
        type: 'text',
        text: {
          body: '🧪 Test message from Stock Management System - ' + new Date().toLocaleString()
        }
      })
    });

    const messageData = await messageResponse.json();
    
    if (messageResponse.ok) {
      console.log('✅ Test message sent successfully!');
      console.log('📊 Message info:', messageData);
      console.log('📱 Message ID:', messageData.messages[0].id);
      console.log('📱 WhatsApp ID:', messageData.contacts[0].wa_id);
    } else {
      console.log('❌ Test message failed:', messageData);
      
      // Analyze common errors
      if (messageData.error) {
        const error = messageData.error;
        console.log('\n🔍 Error Analysis:');
        console.log('Error Code:', error.code);
        console.log('Error Type:', error.type);
        console.log('Error Message:', error.message);
        
        if (error.code === 131026) {
          console.log('💡 This error usually means the recipient number is not in your test phone numbers list.');
          console.log('💡 Go to Facebook Developers > WhatsApp > Configuration > Add +213792901660 to test numbers.');
        }
        
        if (error.code === 131047) {
          console.log('💡 This error means the recipient has not accepted your message request.');
          console.log('💡 The recipient needs to send a message to your WhatsApp Business number first.');
        }
        
        if (error.code === 131051) {
          console.log('💡 This error means the recipient number is not a valid WhatsApp number.');
        }
      }
    }
  } catch (error) {
    console.log('❌ Error sending test message:', error.message);
  }
  
  console.log('\n');
  
  // Test 5: Check webhook configuration
  console.log('5️⃣ Checking webhook configuration...');
  try {
    const webhookResponse = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/subscribed_apps?access_token=${WHATSAPP_ACCESS_TOKEN}`);
    const webhookData = await webhookResponse.json();
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook configuration accessible');
      console.log('📊 Webhook info:', webhookData);
    } else {
      console.log('❌ Webhook configuration error:', webhookData);
    }
  } catch (error) {
    console.log('❌ Error checking webhook:', error.message);
  }
  
  console.log('\n📋 DIAGNOSTIC COMPLETE');
  console.log('🔍 If messages are being sent successfully but not received:');
  console.log('   1. Check that +213792901660 is added to test phone numbers in Facebook Developers');
  console.log('   2. Make sure the WhatsApp Business account is verified');
  console.log('   3. The recipient might need to send a message to your business number first');
  console.log('   4. Check if the phone number is correctly formatted and is a valid WhatsApp number');
}

testWhatsAppConfiguration().catch(console.error);