/**
 * Payment Tracking System - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the client payment tracking system.
 * Requirements: 1.1, 2.2, 3.1, 3.2, 3.3, 3.4
 */

/**
 * Document type - either a delivery note or invoice
 */
export type DocumentType = 'delivery_note' | 'invoice';

/**
 * Payment status classification
 */
export type PaymentStatus = 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';

/**
 * Payment entity - represents a single payment transaction
 */
export interface Payment {
  id: number;
  tenantId: number;
  documentType: DocumentType;
  documentId: number;
  paymentDate: Date;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  createdBy?: number;
  updatedAt: Date;
  updatedBy?: number;
}

/**
 * Payment summary for dashboard display
 */
export interface PaymentSummary {
  documentType: DocumentType;
  documentId: number;
  documentNumber: string;
  clientName: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  paymentCount: number;
  lastPaymentDate?: Date;
}

/**
 * Document balance information
 */
export interface DocumentBalance {
  totalAmount: number;
  totalPaid: number;
  balance: number;
  status: PaymentStatus;
}

/**
 * Validation result for payment operations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Payment creation input (without auto-generated fields)
 */
export type PaymentCreateInput = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Payment update input (partial fields)
 */
export type PaymentUpdateInput = Partial<Pick<Payment, 'paymentDate' | 'amount' | 'paymentMethod' | 'notes'>>;
