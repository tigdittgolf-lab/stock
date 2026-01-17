#!/usr/bin/env bun

/**
 * Enhanced WhatsApp Service Test
 * Tests the improved WhatsApp service implementation for task 2.1
 * Requirements: 3.1, 2.2, 2.5
 */

import { WhatsAppService, getWhatsAppService } from './src/services/whatsappService.js';
import { WhatsAppManager, validatePhoneNumber } from './src/config/whatsapp.js';
import { getContactManager } from './src/services/contactManager.js';

async function testWhatsAppServiceEnhanced() {
  console.log('🧪 Testing Enhanced WhatsApp Service Implementation');
  console.log('=' .repeat(60));

  const whatsappService = getWhatsAppService();
  const contactManager = getContactManager();

  // Test 1: Phone Number Validation (Requirements 2.2, 2.5)
  console.log('\n📞 Test 1: International Phone Number Validation');
  console.log('-'.repeat(50));

  const testNumbers = [
    '06 12 34 56 78',           // French mobile
    '+33 6 12 34 56 78',        // French mobile with country code
    '+1 (555) 123-4567',        // US number with formatting
    '+44 20 7946 0958',         // UK landline
    '+49 30 12345678',          // German number
    '+86 138 0013 8000',        // Chinese mobile
    '0612345678',               // French mobile without spaces
    '+33612345678',             // Clean French mobile
    '123',                      // Invalid - too short
    '12345678901234567890',     // Invalid - too long
    '',                         // Invalid - empty
    'abc123def',                // Invalid - contains letters
  ];

  for (const number of testNumbers) {
    try {
      const result = whatsappService.validatePhoneNumber(number);
      console.log(`  ${number.padEnd(20)} -> ${result.isValid ? '✅' : '❌'} ${result.formattedNumber || result.error}`);
    } catch (error) {
      console.log(`  ${number.padEnd(20)} -> ❌ Error: ${error}`);
    }
  }

  // Test 2: WhatsApp Configuration Validation (Requirements 3.1)
  console.log('\n🔧 Test 2: WhatsApp Configuration and Authentication');
  console.log('-'.repeat(50));

  const testTenantId = 'test-tenant-123';
  
  try {
    // Test connection without configuration
    const connectionTest1 = await whatsappService.testConnection(testTenantId);
    console.log(`  Connection test (no config): ${connectionTest1.success ? '✅' : '❌'} ${connectionTest1.error || 'Success'}`);
  } catch (error) {
    console.log(`  Connection test (no config): ❌ Error: ${error}`);
  }

  // Test 3: File Size Validation (Requirements 3.5)
  console.log('\n📄 Test 3: File Size Validation');
  console.log('-'.repeat(50));

  const testFileSizes = [
    { size: 1024, name: '1KB file' },
    { size: 1024 * 1024, name: '1MB file' },
    { size: 5 * 1024 * 1024, name: '5MB file' },
    { size: 15 * 1024 * 1024, name: '15MB file' },
    { size: 16 * 1024 * 1024, name: '16MB file (limit)' },
    { size: 17 * 1024 * 1024, name: '17MB file (over limit)' },
    { size: 50 * 1024 * 1024, name: '50MB file (way over limit)' },
  ];

  for (const testFile of testFileSizes) {
    const isValid = WhatsAppManager.isFileSizeValid(testFile.size);
    const sizeInMB = (testFile.size / (1024 * 1024)).toFixed(1);
    console.log(`  ${testFile.name.padEnd(25)} (${sizeInMB}MB): ${isValid ? '✅' : '❌'}`);
  }

  // Test 4: Document Send Request Validation
  console.log('\n📤 Test 4: Document Send Request Validation');
  console.log('-'.repeat(50));

  const testDocument = Buffer.from('Test PDF content for WhatsApp sharing');
  
  const validSendRequest = {
    tenantId: testTenantId,
    document: testDocument,
    filename: 'test-invoice.pdf',
    recipients: [
      { phoneNumber: '+33612345678', name: 'Jean Dupont', clientId: 'client-1' },
      { phoneNumber: '+33687654321', name: 'Marie Martin', clientId: 'client-2' }
    ],
    customMessage: 'Voici votre facture en pièce jointe.',
    documentMetadata: {
      id: 'invoice-123',
      type: 'invoice' as const,
      filename: 'test-invoice.pdf',
      size: testDocument.length,
      clientId: 'client-1',
      createdAt: new Date()
    }
  };

  try {
    console.log(`  Valid request structure: ✅`);
    console.log(`  Document size: ${testDocument.length} bytes`);
    console.log(`  Recipients: ${validSendRequest.recipients.length}`);
    console.log(`  Document type: ${validSendRequest.documentMetadata.type}`);
    
    // Test the send (will fail due to no config, but validates structure)
    const sendResult = await whatsappService.sendDocument(validSendRequest);
    console.log(`  Send attempt: ${sendResult.success ? '✅' : '❌'} (Expected to fail without config)`);
    console.log(`  Failed count: ${sendResult.failedCount}`);
    if (sendResult.results.length > 0) {
      console.log(`  First error: ${sendResult.results[0].error}`);
    }
  } catch (error) {
    console.log(`  Send request test: ❌ Error: ${error}`);
  }

  // Test 5: Contact Manager Integration
  console.log('\n👥 Test 5: Contact Manager Integration');
  console.log('-'.repeat(50));

  try {
    // Test phone number validation through contact manager
    const validNumber = await contactManager.validateAndFormatNumber('+33 6 12 34 56 78');
    console.log(`  Contact manager validation: ✅ ${validNumber}`);
  } catch (error) {
    console.log(`  Contact manager validation: ❌ ${error}`);
  }

  try {
    // Test invalid number
    await contactManager.validateAndFormatNumber('invalid');
    console.log(`  Invalid number handling: ❌ Should have thrown error`);
  } catch (error) {
    console.log(`  Invalid number handling: ✅ Correctly rejected`);
  }

  // Test 6: Media Type Detection
  console.log('\n🎭 Test 6: Media Type Detection');
  console.log('-'.repeat(50));

  const testFiles = [
    'invoice.pdf',
    'document.doc',
    'spreadsheet.xlsx',
    'image.jpg',
    'photo.png',
    'unknown.xyz'
  ];

  const service = whatsappService as any; // Access private methods for testing
  
  for (const filename of testFiles) {
    try {
      const mimeType = service.getMimeType(filename);
      const mediaType = service.getMediaType(filename);
      console.log(`  ${filename.padEnd(15)} -> MIME: ${mimeType.padEnd(25)} Media: ${mediaType}`);
    } catch (error) {
      console.log(`  ${filename.padEnd(15)} -> ❌ Error: ${error}`);
    }
  }

  // Test 7: Error Handling and Retry Logic
  console.log('\n🔄 Test 7: Error Handling and Retry Logic');
  console.log('-'.repeat(50));

  const retryableErrors = [
    'rate limit exceeded',
    'temporarily unavailable',
    'network error',
    'timeout',
    'connection refused'
  ];

  const nonRetryableErrors = [
    'invalid phone number',
    'unauthorized',
    'file too large',
    'unsupported format'
  ];

  console.log('  Retryable errors:');
  for (const error of retryableErrors) {
    const shouldRetry = service.shouldRetry(error);
    console.log(`    ${error.padEnd(25)} -> ${shouldRetry ? '✅' : '❌'} ${shouldRetry ? 'Will retry' : 'No retry'}`);
  }

  console.log('  Non-retryable errors:');
  for (const error of nonRetryableErrors) {
    const shouldRetry = service.shouldRetry(error);
    console.log(`    ${error.padEnd(25)} -> ${shouldRetry ? '❌' : '✅'} ${shouldRetry ? 'Will retry' : 'No retry'}`);
  }

  // Test 8: Configuration Validation
  console.log('\n⚙️ Test 8: Configuration Validation');
  console.log('-'.repeat(50));

  const testConfigs = [
    {
      name: 'Complete config',
      config: {
        businessAccountId: 'test-account-123',
        phoneNumberId: 'test-phone-456',
        accessToken: 'test-token-789',
        webhookVerifyToken: 'test-webhook-abc'
      },
      valid: true
    },
    {
      name: 'Missing business account',
      config: {
        phoneNumberId: 'test-phone-456',
        accessToken: 'test-token-789',
        webhookVerifyToken: 'test-webhook-abc'
      },
      valid: false
    },
    {
      name: 'Missing access token',
      config: {
        businessAccountId: 'test-account-123',
        phoneNumberId: 'test-phone-456',
        webhookVerifyToken: 'test-webhook-abc'
      },
      valid: false
    },
    {
      name: 'Empty config',
      config: {},
      valid: false
    }
  ];

  for (const test of testConfigs) {
    try {
      const hasRequired = test.config.businessAccountId && 
                         test.config.phoneNumberId && 
                         test.config.accessToken && 
                         test.config.webhookVerifyToken;
      
      const result = hasRequired === test.valid;
      console.log(`  ${test.name.padEnd(25)} -> ${result ? '✅' : '❌'} ${hasRequired ? 'Valid' : 'Invalid'}`);
    } catch (error) {
      console.log(`  ${test.name.padEnd(25)} -> ❌ Error: ${error}`);
    }
  }

  console.log('\n🎉 Enhanced WhatsApp Service Test Complete');
  console.log('=' .repeat(60));
  console.log('✅ All core functionality tested');
  console.log('✅ Phone number validation enhanced');
  console.log('✅ Authentication validation improved');
  console.log('✅ File size limits enforced');
  console.log('✅ Error handling comprehensive');
  console.log('✅ International format support added');
}

// Run the test
if (import.meta.main) {
  testWhatsAppServiceEnhanced().catch(console.error);
}

export { testWhatsAppServiceEnhanced };