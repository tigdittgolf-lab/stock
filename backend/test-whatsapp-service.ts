#!/usr/bin/env bun
/**
 * Simple test script for WhatsApp Service
 * Tests core functionality without complex mocking
 */

import { WhatsAppService } from './src/services/whatsappService.js';

async function testWhatsAppService() {
  console.log('🧪 Testing WhatsApp Service...\n');
  
  try {
    const whatsappService = new WhatsAppService();
    
    // Test 1: Phone number validation
    console.log('📞 Testing phone number validation...');
    
    const testNumbers = [
      '06 12 34 56 78',      // French mobile
      '+33612345678',        // International format
      '+1234567890',         // US format
      '123',                 // Invalid - too short
      '',                    // Invalid - empty
      '+33 (0)6 12.34.56.78' // French with trunk prefix
    ];
    
    for (const number of testNumbers) {
      const result = whatsappService.validatePhoneNumber(number);
      console.log(`  ${number.padEnd(20)} -> ${result.isValid ? '✅ ' + result.formattedNumber : '❌ ' + result.error}`);
    }
    
    // Test 2: File size validation
    console.log('\n📁 Testing file size validation...');
    
    const testSizes = [
      { size: 1024 * 1024, name: '1MB file' },
      { size: 10 * 1024 * 1024, name: '10MB file' },
      { size: 16 * 1024 * 1024, name: '16MB file (limit)' },
      { size: 20 * 1024 * 1024, name: '20MB file (too large)' }
    ];
    
    for (const test of testSizes) {
      const buffer = Buffer.alloc(test.size);
      const result = await whatsappService.uploadMedia(buffer, 'test.pdf');
      console.log(`  ${test.name.padEnd(20)} -> ${result.success ? '✅ ' + result.mediaId : '❌ ' + result.error}`);
    }
    
    // Test 3: Connection test (will fail without real config, but should handle gracefully)
    console.log('\n🔗 Testing connection (expected to fail without config)...');
    
    const connectionResult = await whatsappService.testConnection('test-tenant');
    console.log(`  Connection test -> ${connectionResult.success ? '✅ Connected' : '❌ ' + connectionResult.error}`);
    
    // Test 4: Configuration status
    console.log('\n⚙️ Testing configuration status...');
    
    const configStatus = await whatsappService.getWhatsAppConfigStatus('test-tenant');
    console.log(`  Config status -> ${configStatus.isConfigured ? '✅ Configured' : '❌ Not configured'}`);
    
    console.log('\n✅ WhatsApp Service tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testWhatsAppService();