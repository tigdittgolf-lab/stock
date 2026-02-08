// Feature: client-payment-tracking
// Task: 11.1 - Create PaymentHistory component

'use client';

import React, { useState, useEffect } from 'react';
import styles from './PaymentHistory.module.css';

interface Payment {
    id: number;
    paymentDate: string;
    amount: number;
    paymentMethod?: string;
    notes?: string;
    createdAt: string;
}

interface PaymentHistoryProps {
    documentType: 'delivery_note' | 'invoice';
    documentId: number;
    onPaymentChange?: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
    'cash': 'Espèces',
    'check': 'Chèque',
    'bank_transfer': 'Virement bancaire',
    'credit_card': 'Carte de crédit',
    'mobile_payment': 'Paiement mobile',
    'other': 'Autre'
};

export default function PaymentHistory({
    documentType,
    documentId,
    onPaymentChange
}: PaymentHistoryProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Payment>>({});

    useEffect(() => {
        fetchPayments();
    }, [documentType, documentId]);

    const fetchPayments = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/payments?documentType=${documentType}&documentId=${documentId}`
            );

            if (response.ok) {
                const data = await response.json();
                setPayments(data.data || []);
            } else {
                setError('Erreur lors du chargement des paiements');
            }
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError('Erreur de connexion au serveur');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (payment: Payment) => {
        setEditingId(payment.id);
        setEditForm({
            paymentDate: payment.paymentDate.split('T')[0],
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            notes: payment.notes
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = async (paymentId: number) => {
        try {
            const response = await fetch(`/api/payments/${paymentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                await fetchPayments();
                setEditingId(null);
                setEditForm({});
                onPaymentChange?.();
            } else {
                const data = await response.json();
                alert(`Erreur: ${data.error?.message || 'Échec de la mise à jour'}`);
            }
        } catch (err) {
            console.error('Error updating payment:', err);
            alert('Erreur de connexion au serveur');
        }
    };

    const handleDelete = async (paymentId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/payments/${paymentId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchPayments();
                onPaymentChange?.();
            } else {
                const data = await response.json();
                alert(`Erreur: ${data.error?.message || 'Échec de la suppression'}`);
            }
        } catch (err) {
            console.error('Error deleting payment:', err);
            alert('Erreur de connexion au serveur');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatAmount = (amount: number) => {
        return amount.toFixed(2) + ' DA';
    };

    const getPaymentMethodLabel = (method?: string) => {
        if (!method) return '-';
        return PAYMENT_METHOD_LABELS[method] || method;
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <p>Chargement de l'historique des paiements...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>❌ {error}</p>
                <button onClick={fetchPayments} className={styles.retryButton}>
                    Réessayer
                </button>
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className={styles.empty}>
                <p>📭 Aucun paiement enregistré pour ce document</p>
            </div>
        );
    }

    return (
        <div className={styles.paymentHistory}>
            <h4 className={styles.title}>📜 Historique des paiements</h4>
            
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Montant</th>
                            <th>Mode de paiement</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id}>
                                {editingId === payment.id ? (
                                    <>
                                        <td>
                                            <input
                                                type="date"
                                                value={editForm.paymentDate || ''}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    paymentDate: e.target.value
                                                })}
                                                className={styles.editInput}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={editForm.amount || ''}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    amount: parseFloat(e.target.value)
                                                })}
                                                step="0.01"
                                                className={styles.editInput}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                value={editForm.paymentMethod || ''}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    paymentMethod: e.target.value
                                                })}
                                                className={styles.editSelect}
                                            >
                                                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editForm.notes || ''}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    notes: e.target.value
                                                })}
                                                className={styles.editInput}
                                            />
                                        </td>
                                        <td>
                                            <div className={styles.editActions}>
                                                <button
                                                    onClick={() => handleSaveEdit(payment.id)}
                                                    className={styles.saveButton}
                                                    title="Enregistrer"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className={styles.cancelButton}
                                                    title="Annuler"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{formatDate(payment.paymentDate)}</td>
                                        <td className={styles.amount}>
                                            {formatAmount(payment.amount)}
                                        </td>
                                        <td>{getPaymentMethodLabel(payment.paymentMethod)}</td>
                                        <td className={styles.notes}>
                                            {payment.notes || '-'}
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    onClick={() => handleEdit(payment)}
                                                    className={styles.editButton}
                                                    title="Modifier"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(payment.id)}
                                                    className={styles.deleteButton}
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.summary}>
                <strong>Total des paiements:</strong>
                <span className={styles.totalAmount}>
                    {formatAmount(payments.reduce((sum, p) => sum + p.amount, 0))}
                </span>
            </div>
        </div>
    );
}
