/**
 * Payment Repository
 * 
 * Data access layer for payment operations with tenant isolation
 * Requirements: 1.1, 1.2, 1.5, 4.1, 5.1, 5.4, 8.1, 8.2
 */

import { Payment, PaymentSummary, PaymentCreateInput, PaymentUpdateInput } from '../types/payment.js';
import { BackendDatabaseService } from './databaseService.js';

export interface PaymentRepository {
  create(payment: PaymentCreateInput, userId: number): Promise<Payment>;
  findById(id: number, tenantId: number): Promise<Payment | null>;
  findByDocument(documentType: string, documentId: number, tenantId: number): Promise<Payment[]>;
  update(id: number, updates: PaymentUpdateInput, userId: number, tenantId: number): Promise<Payment>;
  delete(id: number, tenantId: number): Promise<void>;
  getOutstandingBalances(
    tenantId: number,
    filters?: {
      documentType?: string;
      clientId?: number;
    },
    sorting?: {
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<PaymentSummary[]>;
}

export class PaymentRepositoryImpl implements PaymentRepository {
  private dbService: BackendDatabaseService;

  constructor() {
    this.dbService = BackendDatabaseService.getInstance();
  }

  /**
   * Create a new payment
   * Requirements: 1.1, 1.2, 1.5, 1.6
   */
  async create(payment: PaymentCreateInput, userId: number): Promise<Payment> {
    const dbType = this.dbService.getActiveDatabaseType();
    
    if (dbType === 'supabase') {
      return this.createSupabase(payment, userId);
    } else if (dbType === 'mysql') {
      return this.createMySQL(payment, userId);
    } else {
      return this.createPostgreSQL(payment, userId);
    }
  }

  private async createSupabase(payment: PaymentCreateInput, userId: number): Promise<Payment> {
    const result = await this.dbService.executeRPC('create_payment', {
      p_tenant_id: payment.tenantId,
      p_document_type: payment.documentType,
      p_document_id: payment.documentId,
      p_payment_date: payment.paymentDate.toISOString().split('T')[0],
      p_amount: payment.amount,
      p_payment_method: payment.paymentMethod || null,
      p_notes: payment.notes || null,
      p_created_by: userId
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create payment');
    }

    return result.data;
  }

  private async createMySQL(payment: PaymentCreateInput, userId: number): Promise<Payment> {
    const sql = `
      INSERT INTO payments (
        tenant_id, document_type, document_id, payment_date, 
        amount, payment_method, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const params = [
      payment.tenantId,
      payment.documentType,
      payment.documentId,
      payment.paymentDate.toISOString().split('T')[0],
      payment.amount,
      payment.paymentMethod || null,
      payment.notes || null,
      userId
    ];

    const result = await this.dbService.executeQuery(sql, params);
    
    // Fetch the created payment
    return this.findById(result.insertId, payment.tenantId);
  }

  private async createPostgreSQL(payment: PaymentCreateInput, userId: number): Promise<Payment> {
    const sql = `
      INSERT INTO payments (
        tenant_id, document_type, document_id, payment_date, 
        amount, payment_method, notes, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const params = [
      payment.tenantId,
      payment.documentType,
      payment.documentId,
      payment.paymentDate.toISOString().split('T')[0],
      payment.amount,
      payment.paymentMethod || null,
      payment.notes || null,
      userId
    ];

    const result = await this.dbService.executeQuery(sql, params);
    return this.mapRowToPayment(result.rows[0]);
  }

  /**
   * Find payment by ID with tenant isolation
   * Requirements: 8.2
   */
  async findById(id: number, tenantId: number): Promise<Payment | null> {
    const dbType = this.dbService.getActiveDatabaseType();
    
    if (dbType === 'supabase') {
      return this.findByIdSupabase(id, tenantId);
    } else if (dbType === 'mysql')