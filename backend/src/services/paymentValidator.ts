/**
 * Payment Validator
 * 
 * Validates payment data before creation or update
 * Requirements: 1.3, 1.4, 5.2, 5.3
 */

import { Payment, ValidationResult } from '../types/payment.js';

export class PaymentValidator {
  /**
   * Validate payment data before creation or update
   * @param payment - Partial payment data to validate
   * @returns ValidationResult with isValid flag and error messages
   */
  validatePayment(payment: Partial<Payment>): ValidationResult {
    const errors: string[] = [];
    
    // Amount must be positive
    if (payment.amount !== undefined && payment.amount <= 0) {
      errors.push('Payment amount must be greater than zero');
    }
    
    // Payment date cannot be in the future
    if (payment.paymentDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paymentDate = new Date(payment.paymentDate);
      paymentDate.setHours(0, 0, 0, 0);
      
      if (paymentDate > today) {
        errors.push('Payment date cannot be in the future');
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
   * @returns ValidationResult with isValid flag and error messages
   */
  validateRequiredFields(payment: Partial<Payment>): ValidationResult {
    const errors: string[] = [];
    
    if (!payment.documentType) {
      errors.push('Missing required field: documentType');
    }
    
    if (!payment.documentId) {
      errors.push('Missing required field: documentId');
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
}
