# WhatsApp Document Sharing Infrastructure Setup

This document describes the infrastructure setup for the WhatsApp Document Sharing feature.

## Overview

The WhatsApp Document Sharing feature allows users to send generated documents (invoices, delivery notes, proformas) directly via WhatsApp Business API during the printing process.

## Requirements

- **Requirements**: 7.1, 5.3
- Node.js/Bun runtime
- Redis server (for queue management)
- PostgreSQL or MySQL database
- WhatsApp Business API credentials

## Infrastructure Components

### 1. Dependencies Installed

- `whatsapp-mdf`: WhatsApp Business API SDK (fork of the official archived SDK)
- `redis`: Redis client for Node.js
- `ioredis`: Advanced Redis client with additional features
- `@types/redis`: TypeScript definitions for Redis

### 2. Database Tables Created

#### PostgreSQL Tables
- `whatsapp_configs`: WhatsApp Business API configuration per tenant
- `whatsapp_sends`: History of all WhatsApp document sends with status tracking
- `whatsapp_contacts`: WhatsApp contact information linked to clients
- `whatsapp_queue`: Background job queue for WhatsApp message processing

#### MySQL Tables
- Same structure as PostgreSQL but with MySQL-specific syntax and data types

### 3. Configuration Files

#### Environment Variables (`.env`)
```bash
# WhatsApp Business API Configuration
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
WHATSAPP_API_VERSION=v18.0

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Queue Configuration
WHATSAPP_QUEUE_NAME=whatsapp_send_queue
WHATSAPP_MAX_RETRIES=3
WHATSAPP_RETRY_DELAY=5000
```

#### Configuration Modules
- `src/config/redis.ts`: Redis connection and queue management
- `src/config/whatsapp.ts`: WhatsApp SDK initialization and configuration

### 4. Migration Files

- `migrations/001_create_whatsapp_tables.sql`: PostgreSQL migration
- `migrations/001_create_whatsapp_tables_mysql.sql`: MySQL migration
- `migrations/run-whatsapp-migrations.ts`: Migration runner script

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed via npm/bun. If you need to reinstall:

```bash
cd backend
npm install whatsapp-mdf redis ioredis @types/redis
```

### 2. Configure Environment Variables

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your WhatsApp Business API credentials:

```bash
# Get these from your Meta Business Manager
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

# Configure Redis (default: localhost:6379)
REDIS_URL=redis://localhost:6379
```

### 3. Start Redis Server

Make sure Redis is running on your system:

```bash
# On macOS with Homebrew
brew services start redis

# On Ubuntu/Debian
sudo systemctl start redis-server

# On Windows (if using Redis for Windows)
redis-server
```

### 4. Run Database Migrations

Execute the WhatsApp table migrations:

```bash
# Run migrations for both PostgreSQL and MySQL (if configured)
bun run migrate-whatsapp

# Or run the full setup (includes testing)
bun run setup-whatsapp
```

### 5. Test the Setup

Run the infrastructure test to verify everything is working:

```bash
bun run test-whatsapp
```

This will:
- Run database migrations
- Test Redis connection
- Test WhatsApp API configuration
- Verify file structure
- Provide a setup summary

## WhatsApp Business API Setup

### 1. Create a Meta Business Account

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Create a business account if you don't have one
3. Add your WhatsApp Business phone number

### 2. Set up WhatsApp Business API

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create a new app and select "Business" type
3. Add WhatsApp product to your app
4. Configure your phone number and get credentials:
   - Business Account ID
   - Phone Number ID
   - Access Token
   - Webhook Verify Token

### 3. Configure Webhooks (Optional)

For receiving delivery status updates:

1. Set up a webhook endpoint in your app
2. Configure the webhook URL in Meta Developer Console
3. Subscribe to message status events

## File Structure

```
backend/
├── migrations/
│   ├── 001_create_whatsapp_tables.sql
│   ├── 001_create_whatsapp_tables_mysql.sql
│   └── run-whatsapp-migrations.ts
├── src/
│   └── config/
│       ├── redis.ts
│       └── whatsapp.ts
├── setup-whatsapp-infrastructure.ts
├── WHATSAPP_SETUP.md
└── package.json (updated with new dependencies and scripts)
```

## Usage Examples

### Redis Queue Manager

```typescript
import { getRedisManager } from './src/config/redis';

const redis = getRedisManager();

// Add job to queue
await redis.enqueue('whatsapp_send_queue', {
  tenantId: 'tenant-123',
  documentId: 'doc-456',
  recipients: ['+1234567890']
});

// Process queue
const job = await redis.dequeue('whatsapp_send_queue');
```

### WhatsApp Manager

```typescript
import { WhatsAppManager } from './src/config/whatsapp';

// Get instance for tenant
const whatsapp = WhatsAppManager.getInstance('tenant-123', {
  businessAccountId: 'your-business-id',
  phoneNumberId: 'your-phone-id',
  accessToken: 'your-token',
  webhookVerifyToken: 'your-webhook-token'
});

// Test connection
const isConnected = await whatsapp.testConnection();

// Validate phone number
const validation = WhatsAppManager.validatePhoneNumber('+1234567890');
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis server is running
   - Check REDIS_URL configuration
   - Verify Redis is accessible from your application

2. **WhatsApp API Connection Failed**
   - Verify your credentials in Meta Developer Console
   - Check if your access token is valid and not expired
   - Ensure your phone number is verified in Meta Business Manager

3. **Database Migration Failed**
   - Check database connection settings
   - Ensure you have proper permissions to create tables
   - Verify the database exists

### Logs and Debugging

The setup script provides detailed logging:
- ✅ Success indicators
- ⚠️ Warning indicators  
- ❌ Error indicators

Check the console output for specific error messages and follow the suggested next steps.

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with real credentials
2. **Access Tokens**: Rotate WhatsApp access tokens regularly
3. **Database**: Use encrypted connections for production databases
4. **Redis**: Configure Redis authentication in production
5. **Multi-tenant**: Ensure proper tenant isolation in all operations

## Next Steps

After completing the infrastructure setup:

1. Implement the WhatsApp service layer (Task 2)
2. Create the contact management system (Task 3)
3. Set up the queue processing system (Task 5)
4. Integrate with the existing print system (Task 6)

## Support

For issues with this setup:
1. Check the troubleshooting section above
2. Review the console output from `bun run test-whatsapp`
3. Verify all environment variables are correctly configured
4. Ensure all required services (Redis, Database) are running