// Feature: client-payment-tracking
// Task: 2.1 - Create TypeScript interfaces for Payment, PaymentSummary, and DocumentBalance

/**
 * Payment status types
 */
export type PaymentStatus = 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';

/**
 * Document types that can have payments
 */
export type DocumentType = 'delivery_note' | 'invoice';

/**
 * Payment entity representing a single payment transaction
 */
export interface Payment {
    id: number;
    tenantId: string;
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
 * Payment creation data (without auto-generated fields)
 */
export interface CreatePaymentData {
    tenantId: string;
    documentType: DocumentType;
    documentId: number;
    paymentDate: Date;
    amount: number;
    paymentMethod?: string;
    notes?: string;
    createdBy?: number;
}

/**
 * Payment update data (all fields optional)
 */
export interface UpdatePaymentData {
    paymentDate?: Date;
    amount?: number;
    paymentMethod?: string;
    notes?: string;
    updatedBy?: number;
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
 * Validation result
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Payment method options (can be extended)
 */
export const PAYMENT_METHODS = [
    'cash',
    'check',
    'bank_transfer',
    'credit_card',
    'mobile_payment',
    'other'
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
