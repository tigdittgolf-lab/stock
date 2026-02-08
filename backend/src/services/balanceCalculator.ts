/**
 * Balance Calculator
 * 
 * Calculates remaining balances for documents based on payments
 * Requirements: 2.1, 2.2
 */

import { Payment } from '../types/payment.js';

export class BalanceCalculator {
  /**
   * Calculate the remaining balance for a document
   * @param documentTotalAmount - The total amount due on the document
   * @param payments - Array of payments made against the document
   * @returns The remaining balance (positive = owed, negative = overpaid, zero = paid)
   */
  calculateBalance(documentTotalAmount: number, payments: Payment[]): number {
    const totalPaid = this.calculateTotalPaid(payments);
    return documentTotalAmount - totalPaid;
  }
  
  /**
   * Calculate total amount paid from payments
   * @param payments - Array of payments
   * @returns Total amount paid
   */
  calculateTotalPaid(payments: Payment[]): number {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }
}
