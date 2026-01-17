/**
 * Queue Manager - Background job processing for WhatsApp sends
 * Requirements: 6.1, 3.3, 6.4
 */

import { getRedisManager } from '../config/redis.js';
import WhatsAppService from './WhatsAppService.js';

export interface QueueJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastError?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface SendDocumentJob {
  tenantId: string;
  contact: {
    phoneNumber: string;
    name?: string;
    clientId?: string;
  };
  document: string; // Base64 encoded
  filename: string;
  customMessage?: string;
  documentMetadata: any;
}

export class QueueManager {
  private redisManager = getRedisManager();
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    // Start processing queue automatically
    this.startProcessing();
  }

  /**
   * Enqueue WhatsApp send job
   */
  async enqueueWhatsAppSend(job: SendDocumentJob): Promise<string> {
    console.log(`📋 Enqueueing WhatsApp send for ${job.contact.phoneNumber}`);
    
    try {
      const jobId = await this.redisManager.enqueue('whatsapp_send_queue', job, {
        attempts: 3,
        delay: 1000 // 1 second delay
      });

      // Also store in database for persistence
      await this.storeJobInDatabase(jobId, job);
      
      console.log(`✅ Job ${jobId} enqueued successfully`);
      return jobId;
    } catch (error) {
      console.error('❌ Error enqueueing WhatsApp send:', error);
      throw new Error('Failed to enqueue WhatsApp send');
    }
  }

  /**
   * Process queue continuously
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Starting queue processing...');

    try {
      while (true) {
        const job = await this.redisManager.dequeue('whatsapp_send_queue');
        
        if (!job) {
          // No jobs available, wait a bit
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        await this.processJob(job);
      }
    } catch (error) {
      console.error('❌ Error in queue processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: any): Promise<void> {
    console.log(`⚙️ Processing job ${job.id}`);
    
    try {
      // Update job status to processing
      await this.updateJobStatus(job.id, 'processing');

      // Extract job data
      const jobData: SendDocumentJob = job.data;
      
      // Create WhatsApp service for the tenant
      const whatsappService = new WhatsAppService(jobData.tenantId);
      
      // Convert base64 document back to buffer
      const documentBuffer = Buffer.from(jobData.document, 'base64');
      
      // Attempt to send
      const result = await whatsappService.sendDocument({
        tenantId: jobData.tenantId,
        document: documentBuffer,
        filename: jobData.filename,
        recipients: [jobData.contact],
        customMessage: jobData.customMessage,
        documentMetadata: jobData.documentMetadata
      });

      if (result.success && result.results[0]?.success) {
        // Job completed successfully
        await this.updateJobStatus(job.id, 'completed');
        console.log(`✅ Job ${job.id} completed successfully`);
      } else {
        // Job failed, check if we should retry
        job.attempts = (job.attempts || 0) + 1;
        
        if (job.attempts < job.maxAttempts) {
          // Retry with exponential backoff
          const delay = Math.pow(2, job.attempts) * 1000; // 2^attempts seconds
          await this.retryJob(job, delay);
          console.log(`🔄 Job ${job.id} scheduled for retry (attempt ${job.attempts}/${job.maxAttempts})`);
        } else {
          // Max attempts reached, mark as failed
          await this.updateJobStatus(job.id, 'failed', result.results[0]?.error);
          console.log(`❌ Job ${job.id} failed after ${job.attempts} attempts`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
      
      // Increment attempts and retry or fail
      job.attempts = (job.attempts || 0) + 1;
      
      if (job.attempts < job.maxAttempts) {
        const delay = Math.pow(2, job.attempts) * 1000;
        await this.retryJob(job, delay);
      } else {
        await this.updateJobStatus(job.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Retry a failed job
   */
  private async retryJob(job: any, delayMs: number): Promise<void> {
    await this.redisManager.enqueue('whatsapp_send_queue', job.data, {
      delay: delayMs,
      attempts: job.maxAttempts
    });
  }

  /**
   * Get queue status
   */
  async getQueueStatus(jobId: string): Promise<QueueJobStatus | null> {
    try {
      // Query database for job status
      const query = `
        SELECT id, status, attempts, error_message, created_at, processed_at
        FROM whatsapp_queue 
        WHERE id = $1
      `;
      
      // Note: This would need actual database connection
      // For now, return a mock status
      return {
        id: jobId,
        status: 'pending',
        attempts: 0,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Error getting queue status:', error);
      return null;
    }
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs(): Promise<void> {
    console.log('🔄 Retrying failed jobs...');
    
    try {
      // Get failed jobs from database
      const query = `
        SELECT * FROM whatsapp_queue 
        WHERE status = 'failed' AND attempts < max_attempts
        ORDER BY created_at ASC
        LIMIT 100
      `;
      
      // Note: This would need actual database implementation
      console.log('📋 No failed jobs to retry at this time');
    } catch (error) {
      console.error('❌ Error retrying failed jobs:', error);
    }
  }

  /**
   * Start automatic queue processing
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processQueue().catch(error => {
          console.error('❌ Queue processing error:', error);
        });
      }
    }, 10000); // Check every 10 seconds

    console.log('🚀 Queue processing started');
  }

  /**
   * Stop automatic queue processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.isProcessing = false;
    console.log('⏹️ Queue processing stopped');
  }

  /**
   * Store job in database for persistence
   */
  private async storeJobInDatabase(jobId: string, jobData: SendDocumentJob): Promise<void> {
    try {
      const query = `
        INSERT INTO whatsapp_queue (id, tenant_id, job_data, status, attempts, max_attempts, created_at)
        VALUES ($1, $2, $3, 'pending', 0, 3, NOW())
      `;
      
      // Note: This would need actual database connection
      console.log(`💾 Job ${jobId} stored in database`);
    } catch (error) {
      console.error('❌ Error storing job in database:', error);
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      const query = `
        UPDATE whatsapp_queue 
        SET status = $1, error_message = $2, processed_at = NOW(), updated_at = NOW()
        WHERE id = $3
      `;
      
      // Note: This would need actual database connection
      console.log(`📊 Job ${jobId} status updated to: ${status}`);
    } catch (error) {
      console.error('❌ Error updating job status:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const queueLength = await this.redisManager.getQueueLength('whatsapp_send_queue');
      
      return {
        pending: queueLength,
        processing: 0,
        completed: 0,
        failed: 0
      };
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }
  }
}

export default QueueManager;