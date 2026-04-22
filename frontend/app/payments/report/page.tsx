'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface PaymentSummary {
  count: number;
  amount: number;
}

interface Statistics {
  total_payments: number;
  total_amount: number;
  total_avoirs?: number;
  total_avoirs_amount?: number;
  net_amount?: number;
  by_type: Record<string, PaymentSummary>;
  by_method: Record<string, PaymentSummary>;
  by_month: Record<string, PaymentSummary>;
}

interface Payment {
  id: number;
  document_type: string;
  document_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  notes: string;
}

export default function PaymentsReport() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [documentType, setDocumentType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Date par défaut: début du mois
    const firstDay = new Date();
    firstDay.setDate(1);
    setDateFrom(firstDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchReport();
    }
  }, [dateFrom, dateTo, documentType]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2009_bu02';
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      let url = `/api/sales/payments/report?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      if (documentType) {
        url += `&documentType=${documentType}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'X-Tenant': tenant,
          'X-Database-Type': dbType
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setStatistics(result.data.statistics);
        setPayments(result.data.payments);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
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

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'check': return 'Chèque';
      case 'bank_transfer': return 'Virement';
      case 'credit_card': return 'Carte';
      case 'non_specifie': return 'Non spécifié';
      default: return method;
    }
  };

  const exportToCSV = () => {
    if (!payments || payments.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = ['Date', 'Type Document', 'N° Document', 'Montant', 'Méthode', 'Notes'];
    const rows = payments.map(p => [
      p.payment_date,
      getDocumentTypeLabel(p.document_type),
      p.document_id,
      p.amount,
      getPaymentMethodLabel(p.payment_method),
      p.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_paiements_${dateFrom}_${dateTo}.csv`;
    link.click();
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>📊 Rapport des Paiements</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={exportToCSV}
              disabled={!payments || payments.length === 0}
              className={styles.primaryButton}
              style={{ opacity: (!payments || payments.length === 0) ? 0.5 : 1 }}
            >
              📥 Exporter CSV
            </button>
            <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
              ← Retour
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <p>❌ {error}</p>
          </div>
        )}

        {/* Filtres */}
        <div className={styles.formSection} style={{ marginBottom: '2rem' }}>
          <h2>🔍 Filtres</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Du:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Au:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Type de document:</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="delivery_note">BL Client</option>
                <option value="invoice">Facture Client</option>
                <option value="purchase_delivery_note">BL Fournisseur</option>
                <option value="purchase_invoice">Facture Fournisseur</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Chargement...</p>
          </div>
        ) : statistics ? (
          <>
            {/* Résumé global */}
            <div className={styles.formSection} style={{ marginBottom: '2rem' }}>
              <h2>📈 Résumé Global</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'var(--background-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total encaissé</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                    {(statistics.total_amount || 0).toFixed(2)} DA
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--background-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre de paiements</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {statistics.total_payments}
                  </div>
                </div>
                {(statistics as any).total_avoirs_amount > 0 && (
                  <div style={{ padding: '1rem', background: 'var(--error-bg)', borderRadius: '8px', border: '1px solid var(--error-border)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--error-text)' }}>Avoirs / Retours ({(statistics as any).total_avoirs})</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error-color)' }}>
                      -{(statistics as any).total_avoirs_amount.toFixed(2)} DA
                    </div>
                  </div>
                )}
                <div style={{ padding: '1rem', background: 'var(--primary-color)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Net (paiements - avoirs)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                    {((statistics as any).net_amount ?? statistics.total_amount).toFixed(2)} DA
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--background-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Paiement moyen</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {statistics.total_payments > 0 
                      ? (statistics.total_amount / statistics.total_payments).toFixed(2)
                      : '0.00'} DA
                  </div>
                </div>
              </div>
            </div>

            {/* Par type de document */}
            <div className={styles.formSection} style={{ marginBottom: '2rem' }}>
              <h2>📋 Par Type de Document</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type de Document</th>
                    <th>Nombre de Paiements</th>
                    <th>Montant Total</th>
                    <th>Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statistics.by_type).map(([type, data]) => (
                    <tr key={type}>
                      <td>{getDocumentTypeLabel(type)}</td>
                      <td>{data.count}</td>
                      <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                        {data.amount.toFixed(2)} DA
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            flex: 1,
                            height: '20px',
                            background: '#e0e0e0',
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${(data.amount / statistics.total_amount) * 100}%`,
                              height: '100%',
                              background: '#28a745',
                              transition: 'width 0.3s'
                            }}></div>
                          </div>
                          <span style={{ fontWeight: 'bold' }}>
                            {((data.amount / statistics.total_amount) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Par méthode de paiement */}
            <div className={styles.formSection} style={{ marginBottom: '2rem' }}>
              <h2>💳 Par Méthode de Paiement</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Méthode</th>
                    <th>Nombre de Paiements</th>
                    <th>Montant Total</th>
                    <th>Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statistics.by_method).map(([method, data]) => (
                    <tr key={method}>
                      <td>{getPaymentMethodLabel(method)}</td>
                      <td>{data.count}</td>
                      <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                        {data.amount.toFixed(2)} DA
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            flex: 1,
                            height: '20px',
                            background: '#e0e0e0',
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${(data.amount / statistics.total_amount) * 100}%`,
                              height: '100%',
                              background: '#17a2b8',
                              transition: 'width 0.3s'
                            }}></div>
                          </div>
                          <span style={{ fontWeight: 'bold' }}>
                            {((data.amount / statistics.total_amount) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Par mois */}
            {Object.keys(statistics.by_month).length > 0 && (
              <div className={styles.formSection}>
                <h2>📅 Évolution Mensuelle</h2>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th>Nombre de Paiements</th>
                      <th>Montant Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(statistics.by_month)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([month, data]) => (
                      <tr key={month}>
                        <td>{new Date(month + '-01').toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</td>
                        <td>{data.count}</td>
                        <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                          {data.amount.toFixed(2)} DA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {/* Note */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#e7f3ff', 
          border: '1px solid #2196F3',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, color: '#1976D2' }}>
            ℹ️ Ce rapport affiche tous les paiements enregistrés sur la période sélectionnée.
            Utilisez les filtres pour affiner votre analyse.
          </p>
        </div>
      </main>
    </div>
  );
}
