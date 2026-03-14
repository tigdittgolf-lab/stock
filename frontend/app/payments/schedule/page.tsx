'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface ScheduledPayment {
  id: number;
  document_type: string;
  document_id: number;
  payment_date: string;
  due_date: string;
  amount: number;
  payment_method: string;
  notes: string;
  status: 'upcoming' | 'due_today' | 'overdue';
  days_until_due?: number;
}

export default function PaymentSchedule() {
  const router = useRouter();
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'due_today' | 'overdue'>('all');

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      // Récupérer tous les paiements avec échéance
      const response = await fetch('/api/sales/payments/report', {
        headers: {
          'X-Tenant': tenant,
          'X-Database-Type': dbType
        }
      });

      const result = await response.json();
      
      if (result.success) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const paymentsWithStatus = result.data.payments
          .filter((p: any) => p.due_date) // Seulement les paiements avec échéance
          .map((p: any) => {
            const dueDate = new Date(p.due_date);
            dueDate.setHours(0, 0, 0, 0);
            
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let status: 'upcoming' | 'due_today' | 'overdue';
            if (diffDays < 0) {
              status = 'overdue';
            } else if (diffDays === 0) {
              status = 'due_today';
            } else {
              status = 'upcoming';
            }
            
            return {
              ...p,
              status,
              days_until_due: diffDays
            };
          });
        
        setPayments(paymentsWithStatus);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return '#dc3545';
      case 'due_today': return '#ffc107';
      case 'upcoming': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'overdue': return 'En retard';
      case 'due_today': return 'Aujourd\'hui';
      case 'upcoming': return 'À venir';
      default: return status;
    }
  };

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.status === filter);

  const stats = {
    total: payments.length,
    upcoming: payments.filter(p => p.status === 'upcoming').length,
    due_today: payments.filter(p => p.status === 'due_today').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    total_amount: payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
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
          <h1>📅 Échéancier des Paiements</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => fetchSchedule()}
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

        {/* Statistiques */}
        <div className={styles.formSection} style={{ marginBottom: '2rem' }}>
          <h2>📊 Vue d'ensemble</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', cursor: 'pointer' }}
                 onClick={() => setFilter('all')}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Total échéances</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {stats.total}
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#d4edda', borderRadius: '8px', cursor: 'pointer' }}
                 onClick={() => setFilter('upcoming')}>
              <div style={{ fontSize: '0.9rem', color: '#155724' }}>À venir</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {stats.upcoming}
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '8px', cursor: 'pointer' }}
                 onClick={() => setFilter('due_today')}>
              <div style={{ fontSize: '0.9rem', color: '#856404' }}>Aujourd'hui</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
                {stats.due_today}
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#f8d7da', borderRadius: '8px', cursor: 'pointer' }}
                 onClick={() => setFilter('overdue')}>
              <div style={{ fontSize: '0.9rem', color: '#721c24' }}>En retard</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {stats.overdue}
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              background: filter === 'all' ? '#007bff' : 'white',
              color: filter === 'all' ? 'white' : '#333',
              border: '1px solid #007bff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            style={{
              padding: '8px 16px',
              background: filter === 'upcoming' ? '#28a745' : 'white',
              color: filter === 'upcoming' ? 'white' : '#333',
              border: '1px solid #28a745',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            À venir ({stats.upcoming})
          </button>
          <button
            onClick={() => setFilter('due_today')}
            style={{
              padding: '8px 16px',
              background: filter === 'due_today' ? '#ffc107' : 'white',
              color: filter === 'due_today' ? '#333' : '#333',
              border: '1px solid #ffc107',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Aujourd'hui ({stats.due_today})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            style={{
              padding: '8px 16px',
              background: filter === 'overdue' ? '#dc3545' : 'white',
              color: filter === 'overdue' ? 'white' : '#333',
              border: '1px solid #dc3545',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            En retard ({stats.overdue})
          </button>
        </div>

        {/* Liste des échéances */}
        <div className={styles.formSection}>
          <h2>📋 Échéances {filter !== 'all' && `- ${getStatusLabel(filter)}`}</h2>
          
          {filteredPayments.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <h3 style={{ margin: 0 }}>Aucune échéance</h3>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>
                {filter === 'all' 
                  ? 'Aucun paiement avec échéance définie'
                  : `Aucun paiement ${getStatusLabel(filter).toLowerCase()}`}
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Statut</th>
                  <th>Document</th>
                  <th>N° Document</th>
                  <th>Date Échéance</th>
                  <th>Jours</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                  .map((payment) => (
                  <tr key={payment.id} style={{ 
                    background: `${getStatusColor(payment.status)}10` 
                  }}>
                    <td>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: getStatusColor(payment.status),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getStatusLabel(payment.status)}
                      </span>
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
                        fontWeight: 'bold',
                        color: payment.status === 'overdue' ? '#dc3545' : 
                               payment.status === 'due_today' ? '#ffc107' : '#28a745'
                      }}>
                        {payment.days_until_due !== undefined && (
                          payment.days_until_due < 0 
                            ? `${Math.abs(payment.days_until_due)} jours de retard`
                            : payment.days_until_due === 0
                            ? 'Aujourd\'hui'
                            : `Dans ${payment.days_until_due} jours`
                        )}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#28a745' }}>
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
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#e7f3ff', 
          border: '1px solid #2196F3',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976D2' }}>💡 Conseils</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1976D2' }}>
            <li>Vérifiez régulièrement les échéances à venir pour anticiper les paiements</li>
            <li>Traitez en priorité les paiements dus aujourd'hui</li>
            <li>Contactez les clients/fournisseurs pour les paiements en retard</li>
            <li>Définissez des échéances lors de la création des documents pour un meilleur suivi</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
