/**
 * Payment Status Classifier
 * 
 * Determines payment status based on balance calculations
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { PaymentStatus } from '../types/payment.js';

export class PaymentStatusClassifier {
  /**
   * Determine the payment status based on balance
   * @param balance - The remaining balance (from BalanceCalculator)
   * @param totalAmount - The total amount due
   * @returns Payment status classification
   */
  classifyStatus(balance: number, totalAmount: number): PaymentStatus {
    if (balance === totalAmount) {
      return 'unpaid';
    } else if (balance === 0) {
      return 'paid';
    } else if (balance < 0) {
      return 'overpaid';
    } else {
      return 'partially_paid';
    }
  }
}
