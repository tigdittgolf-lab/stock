#!/usr/bin/env bun
/**
 * WhatsApp Infrastructure Setup Script
 * Sets up all necessary infrastructure for WhatsApp Document Sharing
 * Requirements: 7.1, 5.3
 */

import { runMigrations } from './migrations/run-whatsapp-migrations';
import { getRedisManager } from './src/config/redis';
import { WhatsAppManager } from './src/config/whatsapp';

async function setupInfrastructure() {
  console.log('🚀 Setting up WhatsApp Document Sharing infrastructure...\n');

  try {
    // Step 1: Run database migrations
    console.log('📊 Step 1: Running database migrations...');
    await runMigrations();
    console.log('✅ Database migrations completed\n');

    // Step 2: Test Redis connection
    console.log('🔴 Step 2: Testing Redis connection...');
    const redisManager = getRedisManager();
    const redisConnected = await redisManager.testConnection();
    
    if (redisConnected) {
      console.log('✅ Redis connection successful');
      
      // Test queue operations
      const testQueueName = 'test_whatsapp_queue';
      await redisManager.enqueue(testQueueName, { test: 'data' });
      const queueLength = await redisManager.getQueueLength(testQueueName);
      console.log(`📤 Test queue created with ${queueLength} job(s)`);
      
      // Clean up test queue
      await redisManager.clearQueue(testQueueName);
      console.log('🧹 Test queue cleaned up');
    } else {
      console.warn('⚠️  Redis connection failed - queue functionality will not work');
    }
    console.log('');

    // Step 3: Test WhatsApp configuration (if credentials are provided)
    console.log('📱 Step 3: Testing WhatsApp configuration...');
    
    const requiredEnvVars = [
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      'WHATSAPP_PHONE_NUMBER_ID', 
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️  WhatsApp credentials not configured. Missing environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('   WhatsApp functionality will not work until these are configured.');
    } else {
      try {
        const whatsappManager = WhatsAppManager.getDefaultInstance();
        console.log('✅ WhatsApp configuration loaded successfully');
        
        // Test connection (this might fail if credentials are not valid)
        const whatsappConnected = await whatsappManager.testConnection();
        if (whatsappConnected) {
          console.log('✅ WhatsApp API connection successful');
        } else {
          console.log('⚠️  WhatsApp API connection failed - check your credentials');
        }
      } catch (error) {
        console.log('⚠️  WhatsApp configuration error:', (error as Error).message);
      }
    }
    console.log('');

    // Step 4: Verify file structure
    console.log('📁 Step 4: Verifying file structure...');
    const requiredFiles = [
      'migrations/001_create_whatsapp_tables.sql',
      'migrations/001_create_whatsapp_tables_mysql.sql',
      'src/config/redis.ts',
      'src/config/whatsapp.ts'
    ];

    let allFilesExist = true;
    for (const file of requiredFiles) {
      try {
        await Bun.file(file).text();
        console.log(`✅ ${file}`);
      } catch {
        console.log(`❌ ${file} - Missing!`);
        allFilesExist = false;
      }
    }

    if (allFilesExist) {
      console.log('✅ All required files are present');
    } else {
      console.log('⚠️  Some required files are missing');
    }
    console.log('');

    // Step 5: Summary
    console.log('📋 Setup Summary:');
    console.log('================');
    console.log(`✅ Database migrations: Completed`);
    console.log(`${redisConnected ? '✅' : '⚠️ '} Redis connection: ${redisConnected ? 'Working' : 'Failed'}`);
    console.log(`${missingVars.length === 0 ? '✅' : '⚠️ '} WhatsApp config: ${missingVars.length === 0 ? 'Complete' : 'Incomplete'}`);
    console.log(`${allFilesExist ? '✅' : '⚠️ '} File structure: ${allFilesExist ? 'Complete' : 'Incomplete'}`);
    
    console.log('\n🎉 WhatsApp infrastructure setup completed!');
    
    if (missingVars.length > 0 || !redisConnected) {
      console.log('\n⚠️  Next steps:');
      if (missingVars.length > 0) {
        console.log('   1. Configure WhatsApp Business API credentials in your .env file');
      }
      if (!redisConnected) {
        console.log('   2. Start Redis server or configure REDIS_URL in your .env file');
      }
    }

    // Clean up Redis connection
    if (redisConnected) {
      await redisManager.disconnect();
    }

  } catch (error) {
    console.error('💥 Infrastructure setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (import.meta.main) {
  setupInfrastructure();
}

export { setupInfrastructure };