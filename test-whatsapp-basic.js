// Simple WhatsApp API test using built-in fetch (Node.js 18+)
const WHATSAPP_ACCESS_TOKEN = 'EABAt72ZAXWokBQcngxb3oO4u7Oiony89weZBAqlEEA8H6b86M8ZCX71TpsU5LZAHtJeL6yXdx57es4vZCI5lYrk4Rt8tTZB7mPHzprhilI1WtCmpkKXV8JiJCIOil4AD4N7RhrMWVY2N95C0yDyVZCqW5L18wjr2UbSSdQa5SPT3CC0Ka92jZCJHSKizkfcx21WI6D3BnHlBhBWTnAnuCa0GssFlNINcrh8J5tIDPmUgXpjZB3XAmZAx668ZCjpCKZAc5oFj07XB3VQKFLJaoFGeyCpN';
const WHATSAPP_PHONE_NUMBER_ID = '1003772659482663';
const WHATSAPP_API_VERSION = 'v18.0';

async function testWhatsApp() {
  console.log('🔍 Testing WhatsApp Business API...\n');
  
  // Test 1: Check access token
  console.log('1️⃣ Testing Access Token...');
  try {
    const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/me?access_token=${WHATSAPP_ACCESS_TOKEN}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Access Token is valid');
      console.log('📊 App info:', data);
    } else {
      console.log('❌ Access Token invalid:', data);
      return;
    }
  } catch (error) {
    console.log('❌ Token test failed:', error.message);
    return;
  }
  
  console.log('\n2️⃣ Testing Phone Number...');
  try {
    const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}?access_token=${WHATSAPP_ACCESS_TOKEN}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Phone Number accessible');
      console.log('📊 Phone info:', data);
    } else {
      console.log('❌ Phone Number error:', data);
    }
  } catch (error) {
    console.log('❌ Phone test failed:', error.message);
  }
  
  console.log('\n3️⃣ Sending test message to +213674768390...');
  try {
    const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '213674768390',
        type: 'text',
        text: {
          body: `🧪 Test message from Stock Management - ${new Date().toLocaleString()}`
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Message sent successfully!');
      console.log('📱 Message ID:', data.messages[0].id);
      console.log('📱 WhatsApp ID:', data.contacts[0].wa_id);
      console.log('📊 Full response:', data);
    } else {
      console.log('❌ Message failed:', data);
      
      if (data.error) {
        console.log('\n🔍 Error Analysis:');
        console.log('Code:', data.error.code);
        console.log('Type:', data.error.type);
        console.log('Message:', data.error.message);
        
        switch (data.error.code) {
          case 131026:
            console.log('💡 Solution: Add +213674768390 to test phone numbers in Facebook Developers');
            break;
          case 131047:
            console.log('💡 Solution: Recipient needs to message your business number first');
            break;
          case 131051:
            console.log('💡 Solution: Check if the phone number is a valid WhatsApp number');
            break;
          case 100:
            console.log('💡 Solution: Check access token permissions and expiry');
            break;
        }
      }
    }
  } catch (error) {
    console.log('❌ Message send failed:', error.message);
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Go to https://developers.facebook.com/apps');
  console.log('2. Select your WhatsApp Business app');
  console.log('3. Go to WhatsApp > Configuration');
  console.log('4. Add +213674768390 to "Test phone numbers"');
  console.log('5. Make sure your WhatsApp Business account is verified');
}

testWhatsApp().catch(console.error);