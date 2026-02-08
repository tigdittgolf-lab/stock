// Feature: client-payment-tracking
// Task: 3.5 - Implement PaymentStatusClassifier class

import { PaymentStatus } from '../types/payment.types';

/**
 * Classifies payment status based on balance
 */
export class PaymentStatusClassifier {
    /**
     * Determine the payment status based on balance
     * @param balance - The remaining balance (from BalanceCalculator)
     * @param totalAmount - The total amount due
     * @returns Payment status classification
     */
    classifyStatus(balance: number, totalAmount: number): PaymentStatus {
        // Round to 2 decimal places for comparison to handle floating point precision
        const roundedBalance = Math.round(balance * 100) / 100;
        const roundedTotal = Math.round(totalAmount * 100) / 100;

        if (roundedBalance === roundedTotal) {
            return 'unpaid';
        } else if (roundedBalance === 0) {
            return 'paid';
        } else if (roundedBalance < 0) {
            return 'overpaid';
        } else {
            // 0 < balance < totalAmount
            return 'partially_paid';
        }
    }

    /**
     * Get a human-readable status label
     * @param status - Payment status
     * @returns Localized status label
     */
    getStatusLabel(status: PaymentStatus): string {
        const labels: Record<PaymentStatus, string> = {
            'paid': 'Payé',
            'partially_paid': 'Partiellement payé',
            'unpaid': 'Non payé',
            'overpaid': 'Trop-perçu'
        };

        return labels[status];
    }

    /**
     * Get status color for UI display
     * @param status - Payment status
     * @returns Color code for status
     */
    getStatusColor(status: PaymentStatus): string {
        const colors: Record<PaymentStatus, string> = {
            'paid': '#10b981', // green
            'partially_paid': '#f59e0b', // yellow/orange
            'unpaid': '#ef4444', // red
            'overpaid': '#3b82f6' // blue
        };

        return colors[status];
    }
}
