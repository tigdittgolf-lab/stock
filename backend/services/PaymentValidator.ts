// Feature: client-payment-tracking
// Task: 3.1 - Implement PaymentValidator class

import { Payment, CreatePaymentData, UpdatePaymentData, ValidationResult } from '../types/payment.types';

/**
 * Validates payment data before creation or update
 */
export class PaymentValidator {
    /**
     * Validate payment data for creation
     * @param payment - Payment data to validate
     * @returns Validation result with errors if any
     */
    validatePayment(payment: Partial<CreatePaymentData | UpdatePaymentData>): ValidationResult {
        const errors: string[] = [];

        // Validate amount if provided
        if (payment.amount !== undefined) {
            if (typeof payment.amount !== 'number') {
                errors.push('Payment amount must be a number');
            } else if (payment.amount <= 0) {
                errors.push('Payment amount must be greater than zero');
            } else if (!Number.isFinite(payment.amount)) {
                errors.push('Payment amount must be a finite number');
            }
        }

        // Validate payment date if provided
        if (payment.paymentDate !== undefined) {
            const paymentDate = new Date(payment.paymentDate);
            
            // Check if date is valid
            if (isNaN(paymentDate.getTime())) {
                errors.push('Payment date must be a valid date');
            } else {
                // Check if date is not in the future
                const today = new Date();
                today.setHours(23, 59, 59, 999); // End of today
                
                if (paymentDate > today) {
                    errors.push('Payment date cannot be in the future');
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate required fields for payment creation
     * @param payment - Payment data to validate
     * @returns Validation result with errors if any
     */
    validateRequiredFields(payment: Partial<CreatePaymentData>): ValidationResult {
        const errors: string[] = [];

        if (!payment.tenantId) {
            errors.push('Missing required field: tenantId');
        }

        if (!payment.documentType) {
            errors.push('Missing required field: documentType');
        } else if (!['delivery_note', 'invoice'].includes(payment.documentType)) {
            errors.push('Invalid document type. Must be "delivery_note" or "invoice"');
        }

        if (!payment.documentId) {
            errors.push('Missing required field: documentId');
        } else if (typeof payment.documentId !== 'number' || payment.documentId <= 0) {
            errors.push('Document ID must be a positive number');
        }

        if (!payment.paymentDate) {
            errors.push('Missing required field: paymentDate');
        }

        if (payment.amount === undefined || payment.amount === null) {
            errors.push('Missing required field: amount');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate complete payment data for creation
     * @param payment - Payment data to validate
     * @returns Validation result with errors if any
     */
    validateCreate(payment: Partial<CreatePaymentData>): ValidationResult {
        const requiredFieldsResult = this.validateRequiredFields(payment);
        const paymentDataResult = this.validatePayment(payment);

        return {
            isValid: requiredFieldsResult.isValid && paymentDataResult.isValid,
            errors: [...requiredFieldsResult.errors, ...paymentDataResult.errors]
        };
    }

    /**
     * Validate payment data for update
     * @param payment - Payment data to validate
     * @returns Validation result with errors if any
     */
    validateUpdate(payment: UpdatePaymentData): ValidationResult {
        return this.validatePayment(payment);
    }
}
