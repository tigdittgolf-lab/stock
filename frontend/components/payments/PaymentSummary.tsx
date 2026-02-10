// Feature: client-payment-tracking
// Task: 12.1 - Create PaymentSummary component

'use client';

import React, { useState, useEffect } from 'react';
import styles from './PaymentSummary.module.css';

interface PaymentSummaryProps {
    documentType: 'delivery_note' | 'invoice';
    documentId: number;
    totalAmount: number;
    onViewHistory?: () => void;
    refreshTrigger?: number; // Used to trigger refresh from parent
}

interface DocumentBalance {
    totalAmount: number;
    totalPaid: number;
    balance: number;
    status: 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
}

const STATUS_LABELS: Record<string, string> = {
    'paid': 'Payé',
    'partially_paid': 'Partiellement payé',
    'unpaid': 'Non payé',
    'overpaid': 'Trop-perçu'
};

const STATUS_COLORS: Record<string, string> = {
    'paid': '#10b981',
    'partially_paid': '#f59e0b',
    'unpaid': '#ef4444',
    'overpaid': '#3b82f6'
};

export default function PaymentSummary({
    documentType,
    documentId,
    totalAmount,
    onViewHistory,
    refreshTrigger
}: PaymentSummaryProps) {
    const [balance, setBalance] = useState<DocumentBalance | null>(null);
    const [paymentCount, setPaymentCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBalance();
        fetchPaymentCount();
    }, [documentType, documentId, refreshTrigger]);

    const fetchBalance = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Récupérer la config de la base de données active
            const dbConfig = localStorage.getItem('activeDbConfig');
            const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
            
            const response = await fetch(
                `/api/payments/balance?documentType=${documentType}&documentId=${documentId}`,
                {
                    headers: {
                        'X-Database-Type': dbType
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setBalance(data.data);
            } else {
                setError('Erreur lors du chargement du solde');
            }
        } catch (err) {
            console.error('Error fetching balance:', err);
            setError('Erreur de connexion');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPaymentCount = async () => {
        try {
            // Récupérer la config de la base de données active
            const dbConfig = localStorage.getItem('activeDbConfig');
            const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
            
            const response = await fetch(
                `/api/payments?documentType=${documentType}&documentId=${documentId}`,
                {
                    headers: {
                        'X-Database-Type': dbType
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPaymentCount(data.data?.length || 0);
            }
        } catch (err) {
            console.error('Error fetching payment count:', err);
        }
    };

    const formatAmount = (amount: number) => {
        return amount.toFixed(2) + ' DA';
    };

    const getStatusColor = (status: string) => {
        return STATUS_COLORS[status] || '#6b7280';
    };

    const getStatusLabel = (status: string) => {
        return STATUS_LABELS[status] || status;
    };

    if (isLoading) {
        return (
            <div className={styles.paymentSummary}>
                <div className={styles.loading}>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    if (error || !balance) {
        return (
            <div className={styles.paymentSummary}>
                <div className={styles.error}>
                    <p>❌ {error || 'Données non disponibles'}</p>
                </div>
            </div>
        );
    }

    const percentage = totalAmount > 0 
        ? ((balance.totalPaid / totalAmount) * 100).toFixed(1)
        : '0';

    return (
        <div className={styles.paymentSummary}>
            <div className={styles.header}>
                <h4 className={styles.title}>💰 Statut de paiement</h4>
                <div 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(balance.status) }}
                >
                    {getStatusLabel(balance.status)}
                </div>
            </div>

            <div className={styles.progressBar}>
                <div 
                    className={styles.progressFill}
                    style={{ 
                        width: `${Math.min(parseFloat(percentage), 100)}%`,
                        backgroundColor: getStatusColor(balance.status)
                    }}
                />
            </div>

            <div className={styles.amounts}>
                <div className={styles.amountRow}>
                    <span className={styles.label}>Montant total:</span>
                    <span className={styles.value}>
                        {formatAmount(balance.totalAmount)}
                    </span>
                </div>

                <div className={styles.amountRow}>
                    <span className={styles.label}>Montant payé:</span>
                    <span className={styles.value} style={{ color: '#059669' }}>
                        {formatAmount(balance.totalPaid)}
                        <span className={styles.percentage}>({percentage}%)</span>
                    </span>
                </div>

                <div className={`${styles.amountRow} ${styles.balanceRow}`}>
                    <span className={styles.label}>Solde restant:</span>
                    <span 
                        className={styles.balanceValue}
                        style={{ color: getStatusColor(balance.status) }}
                    >
                        {formatAmount(balance.balance)}
                    </span>
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.paymentInfo}>
                    <span className={styles.icon}>📝</span>
                    <span>{paymentCount} paiement{paymentCount !== 1 ? 's' : ''} enregistré{paymentCount !== 1 ? 's' : ''}</span>
                </div>

                {onViewHistory && (
                    <button 
                        onClick={onViewHistory}
                        className={styles.historyButton}
                    >
                        Voir l'historique →
                    </button>
                )}
            </div>
        </div>
    );
}
