// Feature: client-payment-tracking
// Task: 10.1 - Create PaymentForm component

'use client';

import React, { useState, useEffect } from 'react';
import styles from './PaymentForm.module.css';

interface PaymentFormProps {
    documentType: 'delivery_note' | 'invoice';
    documentId: number;
    documentNumber: string;
    documentTotalAmount: number | string; // MySQL peut retourner DECIMAL comme string
    currentBalance?: number | string;
    onSuccess: () => void;
    onCancel: () => void;
}

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Espèces' },
    { value: 'check', label: 'Chèque' },
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'credit_card', label: 'Carte de crédit' },
    { value: 'mobile_payment', label: 'Paiement mobile' },
    { value: 'other', label: 'Autre' }
];

export default function PaymentForm({
    documentType,
    documentId,
    documentNumber,
    documentTotalAmount,
    currentBalance,
    onSuccess,
    onCancel
}: PaymentFormProps) {
    // Helper pour convertir les montants de manière sûre (MySQL retourne DECIMAL comme string)
    const toNumber = (value: number | string | undefined): number => {
        if (value === undefined || value === null) return 0;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? 0 : num;
    };

    const totalAmount = toNumber(documentTotalAmount);
    const initialBalance = toNumber(currentBalance !== undefined ? currentBalance : documentTotalAmount);

    const [paymentDate, setPaymentDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [amount, setAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [balance, setBalance] = useState<number>(initialBalance);

    useEffect(() => {
        // Fetch current balance if not provided
        if (currentBalance === undefined) {
            fetchBalance();
        }
    }, [documentType, documentId]);

    const fetchBalance = async () => {
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
                setBalance(data.data.balance);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        // Validate amount
        const amountNum = parseFloat(amount);
        if (!amount || isNaN(amountNum)) {
            newErrors.push('Le montant est requis');
        } else if (amountNum <= 0) {
            newErrors.push('Le montant doit être supérieur à zéro');
        }

        // Validate payment date
        if (!paymentDate) {
            newErrors.push('La date de paiement est requise');
        } else {
            const selectedDate = new Date(paymentDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            
            if (selectedDate > today) {
                newErrors.push('La date de paiement ne peut pas être dans le futur');
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors([]);

        try {
            // Récupérer la config de la base de données active
            const dbConfig = localStorage.getItem('activeDbConfig');
            const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
            
            console.log('🔍 PaymentForm - Submitting payment:', {
                dbConfig: dbConfig ? JSON.parse(dbConfig) : null,
                dbType,
                documentType,
                documentId
            });
            
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Database-Type': dbType
                },
                body: JSON.stringify({
                    documentType,
                    documentId,
                    paymentDate,
                    amount: parseFloat(amount),
                    paymentMethod,
                    notes: notes.trim() || undefined
                })
            });

            const data = await response.json();
            
            console.log('📡 PaymentForm - Response:', { status: response.status, data });

            if (response.ok && data.success) {
                onSuccess();
            } else {
                setErrors([data.error?.message || 'Erreur lors de l\'enregistrement du paiement']);
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            setErrors(['Erreur de connexion au serveur']);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDocumentLabel = () => {
        return documentType === 'delivery_note' ? 'Bon de Livraison' : 'Facture';
    };

    return (
        <div className={styles.paymentForm}>
            <div className={styles.header}>
                <h3>💰 Enregistrer un paiement</h3>
                <p className={styles.documentInfo}>
                    {getDocumentLabel()} N° {documentNumber}
                </p>
            </div>

            <div className={styles.balanceInfo}>
                <div className={styles.balanceRow}>
                    <span>Montant total:</span>
                    <strong>{totalAmount.toFixed(2)} DA</strong>
                </div>
                <div className={styles.balanceRow}>
                    <span>Solde restant:</span>
                    <strong className={styles.balanceAmount}>
                        {balance.toFixed(2)} DA
                    </strong>
                </div>
            </div>

            {errors.length > 0 && (
                <div className={styles.errorBox}>
                    {errors.map((error, index) => (
                        <p key={index}>❌ {error}</p>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="paymentDate">
                        Date de paiement <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="date"
                        id="paymentDate"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="amount">
                        Montant <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.amountInput}>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0.01"
                            required
                            className={styles.input}
                        />
                        <span className={styles.currency}>DA</span>
                    </div>
                    {amount && parseFloat(amount) > balance && (
                        <p className={styles.warning}>
                            ⚠️ Le montant dépasse le solde restant
                        </p>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="paymentMethod">Mode de paiement</label>
                    <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={styles.select}
                    >
                        {PAYMENT_METHODS.map((method) => (
                            <option key={method.value} value={method.value}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="notes">Notes (optionnel)</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Informations complémentaires..."
                        rows={3}
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={onCancel}
                        className={styles.cancelButton}
                        disabled={isSubmitting}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer le paiement'}
                    </button>
                </div>
            </form>
        </div>
    );
}
