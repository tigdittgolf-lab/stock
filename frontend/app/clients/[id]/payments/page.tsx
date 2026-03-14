'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from '../../../page.module.css';

interface Payment {
  id: number;
  document_type: string;
  document_id: number;
  document_number?: number;
  document_date?: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  notes: string;
  created_at: string;
}

interface ClientPaymentData {
  client_id: string;
  payments: Payment[];
  total_paid: number;
  count: number;
  documents: {
    delivery_notes: number;
    invoices: number;
  };
}

export default function ClientPayments() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  
  const [data, setData] = useState<ClientPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clientId) {
      fetchClientPayments();
    }
  }, [clientId]);

  const fetchClientPayments = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      const response = await fetch(`/api/sales/clients/${clientId}/payments`, {
        headers: {
          'X-Tenant': tenant,
          'X-Database-Type': dbType
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching client payments:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'delivery_note': return 'BL';
      case 'invoice': return 'Facture';
      default: return type;
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
          <h1>💰 Historique des Paiements - Client {clientId}</h1>
          <button onClick={() => router.back()} className={styles.secondaryButton}>
            ← Retour
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <p>❌ {error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Résumé */}
            <div className={styles.formSection} style={{ marginBottom: '2rem', background: '#f8f9fa' }}>
              <h2>📊 Résumé</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Total payé</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                    {data.total_paid.toFixed(2)} DA
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Nombre de paiements</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {data.count}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>BL</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {data.documents.delivery_notes}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Factures</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {data.documents.invoices}
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des paiements */}
            <div className={styles.formSection}>
              <h2>📜 Détail des Paiements</h2>
              
              {data.payments.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Aucun paiement enregistré pour ce client
                </p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date Paiement</th>
                      <th>Document</th>
                      <th>N° Document</th>
                      <th>Montant</th>
                      <th>Méthode</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.payment_date).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: payment.document_type === 'invoice' ? '#28a745' : '#17a2b8',
                            color: 'white'
                          }}>
                            {getDocumentTypeLabel(payment.document_type)}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              const path = payment.document_type === 'invoice' 
                                ? `/invoices/details/${payment.document_id}`
                                : `/delivery-notes/${payment.document_id}`;
                              router.push(path);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            #{payment.document_id}
                          </button>
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                          {parseFloat(payment.amount.toString()).toFixed(2)} DA
                        </td>
                        <td>{getPaymentMethodLabel(payment.payment_method)}</td>
                        <td>{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                      <td colSpan={3}>TOTAL</td>
                      <td style={{ color: '#28a745' }}>{data.total_paid.toFixed(2)} DA</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
