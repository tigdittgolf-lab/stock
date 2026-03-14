'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../page.module.css';

interface Payment {
  id: number;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  notes: string;
  createdAt: string;
}

export default function PaymentHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const documentType = searchParams.get('type') || 'delivery_note';
  const documentId = searchParams.get('id') || '';
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (documentId) {
      fetchPayments();
    }
  }, [documentId, documentType]);

  const fetchPayments = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
      
      const response = await fetch(`/api/payments?documentType=${documentType}&documentId=${documentId}`, {
        headers: {
          'X-Tenant': tenant
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setPayments(data.data || []);
        const total = (data.data || []).reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
        setTotalPaid(total);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'delivery_note': return 'BL Client';
      case 'invoice': return 'Facture Client';
      case 'purchase_delivery_note': return 'BL Fournisseur';
      case 'purchase_invoice': return 'Facture Fournisseur';
      default: return 'Document';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'check': return 'Chèque';
      case 'bank_transfer': return 'Virement';
      case 'credit_card': return 'Carte';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1>Chargement...</h1>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>📜 Historique des Paiements</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => router.push(`/payments/add?type=${documentType}&id=${documentId}`)}
              className={styles.primaryButton}
            >
              + Ajouter un paiement
            </button>
            <button onClick={() => router.back()} className={styles.secondaryButton}>
              ← Retour
            </button>
          </div>
        </div>

        {/* En-tête */}
        <div className={styles.formSection} style={{ marginBottom: '2rem', background: '#f8f9fa' }}>
          <h2>📄 {getDocumentTypeLabel()} N° {documentId}</h2>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Total payé</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
              {totalPaid.toFixed(2)} DA
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              {payments.length} paiement{payments.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <p>❌ {error}</p>
          </div>
        )}

        {/* Liste des paiements */}
        <div className={styles.formSection}>
          <h2>💳 Détail des Paiements</h2>
          
          {payments.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Aucun paiement enregistré pour ce document
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Notes</th>
                  <th>Enregistré le</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</td>
                    <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                      {parseFloat(payment.amount.toString()).toFixed(2)} DA
                    </td>
                    <td>{getPaymentMethodLabel(payment.paymentMethod)}</td>
                    <td>{payment.notes || '-'}</td>
                    <td style={{ fontSize: '0.85rem', color: '#666' }}>
                      {new Date(payment.createdAt).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                  <td>TOTAL</td>
                  <td style={{ color: '#28a745' }}>{totalPaid.toFixed(2)} DA</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
