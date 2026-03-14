'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface OverduePayment {
  id: number;
  document_type: string;
  document_id: number;
  payment_date: string;
  due_date: string;
  amount: number;
  payment_method: string;
  notes: string;
  days_overdue?: number;
}

export default function OverduePayments() {
  const router = useRouter();
  const [payments, setPayments] = useState<OverduePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchOverduePayments();
  }, []);

  const fetchOverduePayments = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      const response = await fetch('/api/sales/payments/overdue', {
        headers: {
          'X-Tenant': tenant,
          'X-Database-Type': dbType
        }
      });

      const result = await response.json();
      
      if (result.success) {
        const paymentsWithDays = result.data.overdue_payments.map((p: OverduePayment) => {
          const dueDate = new Date(p.due_date);
          const today = new Date();
          const diffTime = today.getTime() - dueDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...p, days_overdue: diffDays };
        });
        
        setPayments(paymentsWithDays);
        setTotalAmount(result.data.total_amount);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'delivery_note': return 'BL Client';
      case 'invoice': return 'Facture Client';
      case 'purchase_delivery_note': return 'BL Fournisseur';
      case 'purchase_invoice': return 'Facture Fournisseur';
      default: return type;
    }
  };

  const getUrgencyColor = (daysOverdue: number) => {
    if (daysOverdue > 30) return '#dc3545'; // Rouge
    if (daysOverdue > 15) return '#fd7e14'; // Orange
    return '#ffc107'; // Jaune
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
          <h1>⚠️ Paiements en Retard</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => fetchOverduePayments()}
              className={styles.primaryButton}
            >
              🔄 Actualiser
            </button>
            <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
              ← Retour Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <p>❌ {error}</p>
          </div>
        )}

        {/* Résumé des alertes */}
        <div className={styles.formSection} style={{ marginBottom: '2rem', background: '#fff3cd', border: '2px solid #ffc107' }}>
          <h2>⚠️ Résumé des Retards</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#856404' }}>Paiements en retard</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {payments.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#856404' }}>Montant total</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {totalAmount.toFixed(2)} DA
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#856404' }}>Retard moyen</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {payments.length > 0 
                  ? Math.round(payments.reduce((sum, p) => sum + (p.days_overdue || 0), 0) / payments.length)
                  : 0} jours
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#856404' }}>Retard maximum</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {payments.length > 0 
                  ? Math.max(...payments.map(p => p.days_overdue || 0))
                  : 0} jours
              </div>
            </div>
          </div>
        </div>

        {/* Légende */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', background: '#ffc107', borderRadius: '4px' }}></div>
            <span>1-15 jours</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', background: '#fd7e14', borderRadius: '4px' }}></div>
            <span>16-30 jours</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', background: '#dc3545', borderRadius: '4px' }}></div>
            <span>+30 jours</span>
          </div>
        </div>

        {/* Liste des paiements en retard */}
        <div className={styles.formSection}>
          <h2>📋 Détail des Retards</h2>
          
          {payments.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              background: '#d4edda',
              borderRadius: '8px',
              border: '2px solid #28a745'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: '#155724', margin: 0 }}>Aucun paiement en retard!</h3>
              <p style={{ color: '#155724', marginTop: '0.5rem' }}>
                Tous les paiements sont à jour.
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Urgence</th>
                  <th>Document</th>
                  <th>N° Document</th>
                  <th>Date Échéance</th>
                  <th>Retard (jours)</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments
                  .sort((a, b) => (b.days_overdue || 0) - (a.days_overdue || 0))
                  .map((payment) => (
                  <tr key={payment.id} style={{ 
                    background: `${getUrgencyColor(payment.days_overdue || 0)}20` 
                  }}>
                    <td>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: getUrgencyColor(payment.days_overdue || 0),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}>
                        ⚠️
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: payment.document_type.includes('invoice') ? '#28a745' : '#17a2b8',
                        color: 'white'
                      }}>
                        {getDocumentTypeLabel(payment.document_type)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>#{payment.document_id}</td>
                    <td>{new Date(payment.due_date).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: getUrgencyColor(payment.days_overdue || 0),
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {payment.days_overdue} jours
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#dc3545' }}>
                      {parseFloat(payment.amount.toString()).toFixed(2)} DA
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            router.push(`/payments/add?type=${payment.document_type}&id=${payment.document_id}`);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          💰 Payer
                        </button>
                        <button
                          onClick={() => {
                            router.push(`/payments/history?type=${payment.document_type}&id=${payment.document_id}`);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          📜 Historique
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Conseils */}
        {payments.length > 0 && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: '#e7f3ff', 
            border: '1px solid #2196F3',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976D2' }}>💡 Conseils</h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1976D2' }}>
              <li>Contactez les clients/fournisseurs avec des retards de plus de 30 jours</li>
              <li>Proposez des plans de paiement échelonnés pour les montants importants</li>
              <li>Envoyez des rappels automatiques pour les retards de 15-30 jours</li>
              <li>Mettez à jour les dates d'échéance si des accords ont été conclus</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
