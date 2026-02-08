// Feature: client-payment-tracking
// Task: 3.3 - Implement BalanceCalculator class

import { Payment } from '../types/payment.types';

/**
 * Calculates payment balances for documents
 */
export class BalanceCalculator {
    /**
     * Calculate the remaining balance for a document
     * @param documentTotalAmount - The total amount due on the document
     * @param payments - Array of payments made against the document
     * @returns The remaining balance (positive = owed, negative = overpaid, zero = paid)
     */
    calculateBalance(documentTotalAmount: number, payments: Payment[]): number {
        const totalPaid = this.calculateTotalPaid(payments);
        
        // Round to 2 decimal places to handle floating point precision
        return Math.round((documentTotalAmount - totalPaid) * 100) / 100;
    }

    /**
     * Calculate total amount paid from payments
     * @param payments - Array of payments
     * @returns Total amount paid
     */
    calculateTotalPaid(payments: Payment[]): number {
        if (!payments || payments.length === 0) {
            return 0;
        }

        const total = payments.reduce((sum, payment) => {
            return sum + (payment.amount || 0);
        }, 0);

        // Round to 2 decimal places to handle floating point precision
        return Math.round(total * 100) / 100;
    }

    /**
     * Calculate payment statistics for a document
     * @param documentTotalAmount - The total amount due on the document
     * @param payments - Array of payments made against the document
     * @returns Object with totalPaid, balance, and paymentCount
     */
    calculateStatistics(documentTotalAmount: number, payments: Payment[]): {
        totalPaid: number;
        balance: number;
        paymentCount: number;
    } {
        const totalPaid = this.calculateTotalPaid(payments);
        const balance = this.calculateBalance(documentTotalAmount, payments);

        return {
            totalPaid,
            balance,
            paymentCount: payments.length
        };
    }
}
