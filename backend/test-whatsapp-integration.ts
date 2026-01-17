/**
 * Test WhatsApp Integration
 * Tests all WhatsApp components to ensure they work correctly
 */

import { validatePhoneNumber, WhatsAppManager } from './src/config/whatsapp.js';
import { getRedisManager } from './src/config/redis.js';
import WhatsAppService from './src/services/whatsappService.js';
import ContactManager from './src/services/contactManager.js';
import QueueManager from './src/services/queueManager.js';
import PrintService from './src/services/printService.js';

async function testWhatsAppIntegration() {
  console.log('🧪 Testing WhatsApp Integration...\n');

  // Test 1: Phone Number Validation
  console.log('📞 Test 1: Phone Number Validation');
  const testNumbers = [
    '06 12 34 56 78',
    '+33612345678',
    '0612345678',
    '+1234567890123',
    'invalid-number',
    ''
  ];

  for (const number of testNumbers) {
    const result = validatePhoneNumber(number);
    console.log(`  ${number} -> ${result.isValid ? '✅' : '❌'} ${result.formattedNumber || result.error}`);
  }

  // Test 2: Redis Connection
  console.log('\n🔄 Test 2: Redis Connection');
  try {
    const redisManager = getRedisManager();
    const isConnected = await redisManager.testConnection();
    console.log(`  Redis connection: ${isConnected ? '✅' : '❌'}`);
    
    if (isConnected) {
      // Test queue operations
      const jobId = await redisManager.enqueue('test_queue', { test: 'data' });
      console.log(`  Queue enqueue: ✅ Job ID: ${jobId}`);
      
      const job = await redisManager.dequeue('test_queue');
      console.log(`  Queue dequeue: ${job ? '✅' : '❌'} ${job ? JSON.stringify(job.data) : ''}`);
    }
  } catch (error) {
    console.log(`  Redis connection: ❌ ${error}`);
  }

  // Test 3: WhatsApp Configuration
  console.log('\n📱 Test 3: WhatsApp Configuration');
  try {
    // Test with environment variables (will fail if not configured)
    const config = {
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'test-account-id',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'test-phone-id',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'test-token',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'test-verify-token'
    };

    const whatsappManager = WhatsAppManager.getInstance('test-tenant', config);
    console.log('  WhatsApp Manager creation: ✅');
    
    // Test connection (will fail without real credentials)
    const isConnected = await whatsappManager.testConnection();
    console.log(`  WhatsApp API connection: ${isConnected ? '✅' : '❌'} (Expected to fail with test credentials)`);
    
  } catch (error) {
    console.log(`  WhatsApp configuration: ❌ ${error}`);
  }

  // Test 4: WhatsApp Service
  console.log('\n🔧 Test 4: WhatsApp Service');
  try {
    const whatsappService = new WhatsAppService('test-tenant');
    console.log('  WhatsApp Service creation: ✅');
    
    // Test phone validation through service
    const validation = whatsappService.validatePhoneNumber('+33612345678');
    console.log(`  Service phone validation: ${validation.isValid ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log(`  WhatsApp Service: ❌ ${error}`);
  }

  // Test 5: Contact Manager (requires database)
  console.log('\n👥 Test 5: Contact Manager');
  try {
    // Mock database for testing
    const mockDb = {
      query: async (query: string, params: any[]) => {
        console.log(`    Mock DB Query: ${query.substring(0, 50)}...`);
        return { rows: [], rowCount: 0 };
      }
    };

    const contactManager = new ContactManager(mockDb);
    console.log('  Contact Manager creation: ✅');
    
    // Test validation
    const validation = contactManager.validateAndFormatNumber('+33612345678');
    console.log(`  Contact validation: ${validation.isValid ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log(`  Contact Manager: ❌ ${error}`);
  }

  // Test 6: Queue Manager
  console.log('\n📋 Test 6: Queue Manager');
  try {
    const queueManager = new QueueManager();
    console.log('  Queue Manager creation: ✅');
    
    const stats = await queueManager.getQueueStats();
    console.log(`  Queue stats: ✅ Pending: ${stats.pending}`);
    
  } catch (error) {
    console.log(`  Queue Manager: ❌ ${error}`);
  }

  // Test 7: Print Service
  console.log('\n🖨️ Test 7: Print Service');
  try {
    const printService = new PrintService('test-tenant');
    console.log('  Print Service creation: ✅');
    
  } catch (error) {
    console.log(`  Print Service: ❌ ${error}`);
  }

  // Test 8: File Size Validation
  console.log('\n📁 Test 8: File Size Validation');
  const testSizes = [
    1024 * 1024,      // 1MB
    10 * 1024 * 1024, // 10MB
    16 * 1024 * 1024, // 16MB (limit)
    20 * 1024 * 1024  // 20MB (over limit)
  ];

  for (const size of testSizes) {
    const isValid = WhatsAppManager.isFileSizeValid(size);
    const sizeMB = (size / 1024 / 1024).toFixed(1);
    console.log(`  ${sizeMB}MB: ${isValid ? '✅' : '❌'}`);
  }

  console.log('\n🎉 WhatsApp Integration Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Configure real WhatsApp Business API credentials in .env file');
  console.log('2. Test with real phone numbers');
  console.log('3. Integrate with existing document generation');
  console.log('4. Test end-to-end workflow');
}

// Run the test
if (import.meta.main) {
  testWhatsAppIntegration().catch(console.error);
}

export default testWhatsAppIntegration;