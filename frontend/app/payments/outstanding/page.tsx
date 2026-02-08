// Feature: client-payment-tracking
// Task: 13.1 - Create OutstandingBalancesDashboard component

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface PaymentSummary {
    documentType: 'delivery_note' | 'invoice';
    documentId: number;
    documentNumber: string;
    clientName: string;
    totalAmount: number;
    totalPaid: number;
    balance: number;
    paymentStatus: 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
    paymentCount: number;
    lastPaymentDate?: string;
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

export default function OutstandingBalancesPage() {
    const router = useRouter();
    const [balances, setBalances] = useState<PaymentSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('');
    const [clientFilter, setClientFilter] = useState<string>('');

    // Sorting
    const [sortBy, setSortBy] = useState<string>('balance');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchOutstandingBalances();
    }, [documentTypeFilter, sortBy, sortOrder]);

    const fetchOutstandingBalances = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (documentTypeFilter) params.append('documentType', documentTypeFilter);
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);

            const response = await fetch(`/api/payments/outstanding?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();
                setBalances(data.data || []);
            } else {
                setError('Erreur lors du chargement des soldes');
            }
        } catch (err) {
            console.error('Error fetching outstanding balances:', err);
            setError('Erreur de connexion au serveur');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const handleRowClick = (summary: PaymentSummary) => {
        const path = summary.documentType === 'delivery_note' 
            ? `/delivery-notes/${summary.documentId}`
            : `/invoices/${summary.documentId}`;
        router.push(path);
    };

    const formatAmount = (amount: number) => {
        return amount.toFixed(2) + ' DA';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    const getStatusColor = (status: string) => {
        return STATUS_COLORS[status] || '#6b7280';
    };

    const getStatusLabel = (status: string) => {
        return STATUS_LABELS[status] || status;
    };

    const filteredBalances = balances.filter(balance => {
        if (clientFilter && !balance.clientName.toLowerCase().includes(clientFilter.toLowerCase())) {
            return false;
        }
        return true;
    });

    const totalOutstanding = filteredBalances.reduce((sum, b) => sum + b.balance, 0);
    const totalAmount = filteredBalances.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalPaid = filteredBalances.reduce((sum, b) => sum + b.totalPaid, 0);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>💰 Soldes impayés</h1>
                    <p className={styles.subtitle}>
                        Suivi des paiements en attente pour les bons de livraison et factures
                    </p>
                </div>
            </div>

            <div className={styles.statsCards}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Documents impayés</div>
                    <div className={styles.statValue}>{filteredBalances.length}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Montant total</div>
                    <div className={styles.statValue}>{formatAmount(totalAmount)}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Montant payé</div>
                    <div className={styles.statValue} style={{ color: '#059669' }}>
                        {formatAmount(totalPaid)}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Solde restant</div>
                    <div className={styles.statValue} style={{ color: '#ef4444' }}>
                        {formatAmount(totalOutstanding)}
                    </div>
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label htmlFor="documentType">Type de document:</label>
                    <select
                        id="documentType"
                        value={documentTypeFilter}
                        onChange={(e) => setDocumentTypeFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Tous</option>
                        <option value="delivery_note">Bons de livraison</option>
                        <option value="invoice">Factures</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label htmlFor="client">Rechercher un client:</label>
                    <input
                        type="text"
                        id="client"
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        placeholder="Nom du client..."
                        className={styles.input}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loading}>
                    <p>Chargement des données...</p>
                </div>
            ) : error ? (
                <div className={styles.error}>
                    <p>❌ {error}</p>
                    <button onClick={fetchOutstandingBalances} className={styles.retryButton}>
                        Réessayer
                    </button>
                </div>
            ) : filteredBalances.length === 0 ? (
                <div className={styles.empty}>
                    <p>✅ Aucun solde impayé trouvé</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th 
                                    onClick={() => handleSort('document_number')}
                                    className={styles.sortable}
                                >
                                    N° Document {sortBy === 'document_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th 
                                    onClick={() => handleSort('client_name')}
                                    className={styles.sortable}
                                >
                                    Client {sortBy === 'client_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th 
                                    onClick={() => handleSort('total_amount')}
                                    className={styles.sortable}
                                >
                                    Montant total {sortBy === 'total_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Montant payé</th>
                                <th 
                                    onClick={() => handleSort('balance')}
                                    className={styles.sortable}
                                >
                                    Solde {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Statut</th>
                                <th>Paiements</th>
                                <th>Dernier paiement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBalances.map((balance) => (
                                <tr 
                                    key={`${balance.documentType}-${balance.documentId}`}
                                    onClick={() => handleRowClick(balance)}
                                    className={styles.clickableRow}
                                >
                                    <td>
                                        <span className={styles.docType}>
                                            {balance.documentType === 'delivery_note' ? '📦 BL' : '📄 Facture'}
                                        </span>
                                    </td>
                                    <td className={styles.docNumber}>{balance.documentNumber}</td>
                                    <td>{balance.clientName}</td>
                                    <td className={styles.amount}>{formatAmount(balance.totalAmount)}</td>
                                    <td className={styles.amountPaid}>{formatAmount(balance.totalPaid)}</td>
                                    <td className={styles.balance}>{formatAmount(balance.balance)}</td>
                                    <td>
                                        <span 
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: getStatusColor(balance.paymentStatus) }}
                                        >
                                            {getStatusLabel(balance.paymentStatus)}
                                        </span>
                                    </td>
                                    <td className={styles.paymentCount}>{balance.paymentCount}</td>
                                    <td className={styles.lastPayment}>{formatDate(balance.lastPaymentDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
