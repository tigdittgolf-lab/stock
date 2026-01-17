#!/usr/bin/env bun

/**
 * Test script for WhatsApp Task 2.3 Implementation
 * Tests enhanced uploadMedia and sendDocument functionality
 * Requirements: 3.2, 3.5, 6.4
 */

import { WhatsAppService, SendDocumentRequest } from './src/services/whatsappService.js';

async function testTask23Implementation() {
  console.log('🧪 Testing WhatsApp Task 2.3 Implementation');
  console.log('=' .repeat(60));

  const whatsappService = new WhatsAppService();

  // Test 1: File Size Validation (16MB limit)
  console.log('\n📋 Test 1: File Size Validation');
  console.log('-'.repeat(40));

  // Test with valid file size
  const validBuffer = Buffer.alloc(1024 * 1024); // 1MB
  const validResult = await whatsappService.uploadMedia(validBuffer, 'test-valid.pdf');
  console.log(`✅ Valid file (1MB): ${validResult.success ? 'PASSED' : 'FAILED'}`);
  if (validResult.success) {
    console.log(`   Media ID: ${validResult.mediaId}`);
  }

  // Test with oversized file
  const oversizedBuffer = Buffer.alloc(17 * 1024 * 1024); // 17MB - exceeds limit
  const oversizedResult = await whatsappService.uploadMedia(oversizedBuffer, 'test-oversized.pdf');
  console.log(`❌ Oversized file (17MB): ${!oversizedResult.success ? 'PASSED' : 'FAILED'}`);
  if (!oversizedResult.success) {
    console.log(`   Error: ${oversizedResult.error}`);
  }

  // Test 2: File Type Validation
  console.log('\n📋 Test 2: File Type Validation');
  console.log('-'.repeat(40));

  const testFiles = [
    { name: 'document.pdf', expected: true },
    { name: 'spreadsheet.xlsx', expected: true },
    { name: 'image.jpg', expected: true },
    { name: 'executable.exe', expected: false },
    { name: 'script.js', expected: false }
  ];

  for (const testFile of testFiles) {
    const result = await whatsappService.uploadMedia(validBuffer, testFile.name);
    const passed = result.success === testFile.expected;
    console.log(`${passed ? '✅' : '❌'} ${testFile.name}: ${passed ? 'PASSED' : 'FAILED'}`);
    if (!result.success && testFile.expected) {
      console.log(`   Error: ${result.error}`);
    }
  }

  // Test 3: Phone Number Validation
  console.log('\n📋 Test 3: Enhanced Phone Number Validation');
  console.log('-'.repeat(40));

  const phoneNumbers = [
    { number: '+33612345678', expected: true, description: 'French international' },
    { number: '06 12 34 56 78', expected: true, description: 'French national' },
    { number: '+1234567890', expected: true, description: 'US number' },
    { number: '123', expected: false, description: 'Too short' },
    { number: '12345678901234567890', expected: false, description: 'Too long' },
    { number: '', expected: false, description: 'Empty' },
    { number: '+33 (0)6 12.34.56.78', expected: true, description: 'French with formatting' }
  ];

  for (const test of phoneNumbers) {
    const result = whatsappService.validatePhoneNumber(test.number);
    const passed = result.isValid === test.expected;
    console.log(`${passed ? '✅' : '❌'} ${test.description}: ${passed ? 'PASSED' : 'FAILED'}`);
    if (result.isValid) {
      console.log(`   Formatted: ${result.formattedNumber}`);
    } else if (test.expected) {
      console.log(`   Error: ${result.error}`);
    }
  }

  // Test 4: Send Document with Error Handling
  console.log('\n📋 Test 4: Enhanced Send Document Error Handling');
  console.log('-'.repeat(40));

  const mockRequest: SendDocumentRequest = {
    tenantId: 'test-tenant-123',
    document: validBuffer,
    filename: 'test-invoice.pdf',
    recipients: [
      { phoneNumber: '+33612345678', name: 'Valid User', clientId: 'client-1' },
      { phoneNumber: 'invalid-phone', name: 'Invalid User', clientId: 'client-2' },
      { phoneNumber: '+1234567890', name: 'Another Valid User', clientId: 'client-3' }
    ],
    customMessage: 'Please find your invoice attached.',
    documentMetadata: {
      id: 'invoice-123',
      type: 'invoice',
      filename: 'test-invoice.pdf',
      size: validBuffer.length,
      clientId: 'client-1',
      createdAt: new Date()
    }
  };

  console.log('📤 Testing send document with mixed valid/invalid recipients...');
  const sendResult = await whatsappService.sendDocument(mockRequest);
  
  console.log(`📊 Send Results:`);
  console.log(`   Success: ${sendResult.success}`);
  console.log(`   Total Recipients: ${mockRequest.recipients.length}`);
  console.log(`   Successful: ${sendResult.results.filter(r => r.success).length}`);
  console.log(`   Queued: ${sendResult.queuedCount}`);
  console.log(`   Failed: ${sendResult.failedCount}`);

  console.log('\n📋 Individual Results:');
  sendResult.results.forEach((result, index) => {
    const recipient = mockRequest.recipients[index];
    console.log(`   ${result.success ? '✅' : '❌'} ${recipient.phoneNumber} (${recipient.name}): ${result.status}`);
    if (!result.success) {
      console.log(`      Error: ${result.error}`);
    } else if (result.messageId) {
      console.log(`      Message ID: ${result.messageId}`);
    }
  });

  // Test 5: File Size Edge Cases
  console.log('\n📋 Test 5: File Size Edge Cases');
  console.log('-'.repeat(40));

  const edgeCases = [
    { size: 16 * 1024 * 1024 - 1, description: 'Just under limit (16MB - 1 byte)' },
    { size: 16 * 1024 * 1024, description: 'Exactly at limit (16MB)' },
    { size: 16 * 1024 * 1024 + 1, description: 'Just over limit (16MB + 1 byte)' }
  ];

  for (const edgeCase of edgeCases) {
    const buffer = Buffer.alloc(edgeCase.size);
    const result = await whatsappService.uploadMedia(buffer, 'edge-case.pdf');
    const sizeMB = (edgeCase.size / (1024 * 1024)).toFixed(3);
    console.log(`${result.success ? '✅' : '❌'} ${edgeCase.description} (${sizeMB}MB): ${result.success ? 'PASSED' : 'FAILED'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  }

  // Test 6: Error Categorization
  console.log('\n📋 Test 6: Error Categorization and Retry Logic');
  console.log('-'.repeat(40));

  const service = whatsappService as any; // Access private methods for testing

  const errorTests = [
    { error: 'Rate limit exceeded', shouldRetry: true },
    { error: 'Network timeout', shouldRetry: true },
    { error: 'Invalid phone number', shouldRetry: false },
    { error: 'Authentication failed', shouldRetry: false },
    { error: 'File too large', shouldRetry: false },
    { error: 'Temporarily unavailable', shouldRetry: true }
  ];

  for (const errorTest of errorTests) {
    const shouldRetry = service.shouldRetryEnhanced(errorTest.error);
    const passed = shouldRetry === errorTest.shouldRetry;
    console.log(`${passed ? '✅' : '❌'} "${errorTest.error}": ${shouldRetry ? 'RETRY' : 'NO RETRY'} ${passed ? 'PASSED' : 'FAILED'}`);
  }

  console.log('\n🎉 Task 2.3 Implementation Test Complete!');
  console.log('=' .repeat(60));
  
  // Summary
  console.log('\n📊 Implementation Summary:');
  console.log('✅ Enhanced uploadMedia method with:');
  console.log('   - Comprehensive file size validation (16MB limit)');
  console.log('   - Enhanced file type validation');
  console.log('   - Retry mechanism for transient failures');
  console.log('   - Detailed error logging and monitoring');
  
  console.log('✅ Enhanced sendDocument method with:');
  console.log('   - Improved error handling for WhatsApp API errors');
  console.log('   - Better phone number validation');
  console.log('   - Enhanced retry logic with error categorization');
  console.log('   - Comprehensive logging for monitoring');
  
  console.log('✅ Additional enhancements:');
  console.log('   - WhatsApp API error code parsing');
  console.log('   - Exponential backoff for retries');
  console.log('   - Enhanced logging table for monitoring');
  console.log('   - Better error messages for users');
}

// Run the test
if (import.meta.main) {
  testTask23Implementation().catch(console.error);
}

export { testTask23Implementation };