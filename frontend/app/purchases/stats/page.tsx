'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface StatsOverview {
  period: {
    start_date: string;
    end_date: string;
  };
  totals: {
    invoices: {
      count: number;
      montant_ht: number;
      tva: number;
      ttc: number;
    };
    delivery_notes: {
      count: number;
      montant_ht: number;
      tva: number;
      ttc: number;
    };
    combined: {
      count: number;
      montant_ht: number;
      tva: number;
      ttc: number;
    };
  };
  counts: {
    suppliers: number;
    articles_purchased: number;
    total_documents: number;
  };
}

interface SupplierStats {
  nfournisseur: string;
  supplier_name: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  total_documents: number;
  invoices_count: number;
  bl_count: number;
  average_per_doc: number;
}

interface ArticleStats {
  narticle: string;
  designation: string;
  total_quantity: number;
  total_amount: number;
  total_purchases: number;
  average_price: number;
}

interface MonthlyTrend {
  month: number;
  month_name: string;
  invoices_amount: number;
  invoices_count: number;
  bl_amount: number;
  bl_count: number;
  total_amount: number;
  total_count: number;
}

interface RecentActivity {
  doc_type: string;
  doc_number: number;
  supplier_doc_number: string;
  nfournisseur: string;
  doc_date: string;
  total_ttc: number;
  created_at: string;
}

export default function PurchaseStats() {
  const router = useRouter();
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [supplierStats, setSupplierStats] = useState<SupplierStats[]>([]);
  const [articleStats, setArticleStats] = useState<ArticleStats[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(new Date().getFullYear() + '-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAllStats();
  }, [selectedYear, startDate, endDate]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      
      // Fetch all stats in parallel
      const [overviewRes, suppliersRes, articlesRes, trendsRes, recentRes] = await Promise.all([
        fetch(getApiUrl(`purchases/stats/overview?start_date=${startDate}&end_date=${endDate}`), {
          headers: { 'X-Tenant': tenant }
        }),
        fetch(getApiUrl(`purchases/stats/suppliers?start_date=${startDate}&end_date=${endDate}`), {
          headers: { 'X-Tenant': tenant }
        }),
        fetch(getApiUrl(`purchases/stats/articles?start_date=${startDate}&end_date=${endDate}`), {
          headers: { 'X-Tenant': tenant }
        }),
        fetch(getApiUrl(`purchases/stats/trends?year=${selectedYear}`), {
          headers: { 'X-Tenant': tenant }
        }),
        fetch(getApiUrl('purchases/stats/recent?limit=10'), {
          headers: { 'X-Tenant': tenant }
        })
      ]);

      const [overviewData, suppliersData, articlesData, trendsData, recentData] = await Promise.all([
        overviewRes.json(),
        suppliersRes.json(),
        articlesRes.json(),
        trendsRes.json(),
        recentRes.json()
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (suppliersData.success) setSupplierStats(suppliersData.data);
      if (articlesData.success) setArticleStats(articlesData.data);
      if (trendsData.success) setMonthlyTrends(trendsData.data.data || []);
      if (recentData.success) setRecentActivity(recentData.data);

    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0.00';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>📊 Statistiques Achats</h1>
        <div>
          <button onClick={() => router.push('/purchases')} className={styles.secondaryButton}>
            Retour aux Achats
          </button>
          <button onClick={() => router.push('/')} className={styles.secondaryButton}>
            Dashboard
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {error && (
          <div className={styles.error}>
            <h2>❌ Erreur</h2>
            <p>{error}</p>
            <button onClick={fetchAllStats} className={styles.primaryButton}>
              Réessayer
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* Filtres de période */}
            <div className={styles.formSection}>
              <h2>🔍 Filtres</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Année (tendances)</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vue d'ensemble */}
            {overview && (
              <div className={styles.formSection}>
                <h2>📈 Vue d'Ensemble</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{overview.totals.combined.count}</div>
                    <div className={styles.statLabel}>Total Documents</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatNumber(overview.totals.combined.ttc)} DA</div>
                    <div className={styles.statLabel}>Total TTC</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{overview.counts.suppliers}</div>
                    <div className={styles.statLabel}>Fournisseurs Actifs</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{overview.counts.articles_purchased}</div>
                    <div className={styles.statLabel}>Articles Achetés</div>
                  </div>
                </div>

                <div className={styles.formGrid} style={{ marginTop: '2rem' }}>
                  <div className={styles.formGroup}>
                    <h3>📄 Factures d'Achat</h3>
                    <p><strong>Nombre :</strong> {overview.totals.invoices.count}</p>
                    <p><strong>Montant HT :</strong> {formatNumber(overview.totals.invoices.montant_ht)} DA</p>
                    <p><strong>TVA :</strong> {formatNumber(overview.totals.invoices.tva)} DA</p>
                    <p><strong>Total TTC :</strong> {formatNumber(overview.totals.invoices.ttc)} DA</p>
                  </div>
                  <div className={styles.formGroup}>
                    <h3>📦 Bons de Livraison</h3>
                    <p><strong>Nombre :</strong> {overview.totals.delivery_notes.count}</p>
                    <p><strong>Montant HT :</strong> {formatNumber(overview.totals.delivery_notes.montant_ht)} DA</p>
                    <p><strong>TVA :</strong> {formatNumber(overview.totals.delivery_notes.tva)} DA</p>
                    <p><strong>Total TTC :</strong> {formatNumber(overview.totals.delivery_notes.ttc)} DA</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Fournisseurs */}
            <div className={styles.formSection}>
              <h2>🏆 Top Fournisseurs</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fournisseur</th>
                      <th style={{ textAlign: 'right' }}>Total TTC</th>
                      <th style={{ textAlign: 'right' }}>Documents</th>
                      <th style={{ textAlign: 'right' }}>Factures</th>
                      <th style={{ textAlign: 'right' }}>BL</th>
                      <th style={{ textAlign: 'right' }}>Moyenne/Doc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierStats.slice(0, 5).map((supplier, index) => (
                      <tr key={`${supplier.nfournisseur}-${index}`}>
                        <td>
                          <strong>{supplier.supplier_name}</strong>
                          <br />
                          <small style={{ color: 'var(--text-secondary)' }}>{supplier.nfournisseur}</small>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{formatNumber(supplier.total_ttc)} DA</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>{supplier.total_documents}</td>
                        <td style={{ textAlign: 'right' }}>{supplier.invoices_count}</td>
                        <td style={{ textAlign: 'right' }}>{supplier.bl_count}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(supplier.average_per_doc)} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Articles */}
            <div className={styles.formSection}>
              <h2>📦 Top Articles Achetés</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th style={{ textAlign: 'right' }}>Quantité Totale</th>
                      <th style={{ textAlign: 'right' }}>Montant Total</th>
                      <th style={{ textAlign: 'right' }}>Nb Achats</th>
                      <th style={{ textAlign: 'right' }}>Prix Moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articleStats.slice(0, 10).map((article) => (
                      <tr key={article.narticle}>
                        <td>
                          <strong>{article.designation}</strong>
                          <br />
                          <small style={{ color: 'var(--text-secondary)' }}>{article.narticle}</small>
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(article.total_quantity)}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(article.total_amount)} DA</td>
                        <td style={{ textAlign: 'right' }}>{article.total_purchases}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(article.average_price)} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Évolution mensuelle */}
            <div className={styles.formSection}>
              <h2>📈 Évolution Mensuelle {selectedYear}</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th style={{ textAlign: 'right' }}>Factures (Montant)</th>
                      <th style={{ textAlign: 'right' }}>BL (Montant)</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTrends.map((trend) => (
                      <tr key={trend.month}>
                        <td><strong>{trend.month_name}</strong></td>
                        <td style={{ textAlign: 'right' }}>
                          {formatNumber(trend.invoices_amount)} DA
                          <br />
                          <small style={{ color: 'var(--text-secondary)' }}>({trend.invoices_count} docs)</small>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {formatNumber(trend.bl_amount)} DA
                          <br />
                          <small style={{ color: 'var(--text-secondary)' }}>({trend.bl_count} docs)</small>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{formatNumber(trend.total_amount)} DA</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>{trend.total_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activité récente */}
            <div className={styles.formSection}>
              <h2>🕒 Activité Récente</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>N° Document</th>
                      <th>Fournisseur</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Montant TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity, index) => (
                      <tr key={index}>
                        <td>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem',
                            backgroundColor: activity.doc_type === 'invoice' ? 'var(--info-bg)' : 'var(--success-bg)',
                            color: activity.doc_type === 'invoice' ? 'var(--info-text)' : 'var(--success-text)',
                            border: activity.doc_type === 'invoice' ? '1px solid var(--info-border)' : '1px solid var(--success-border)'
                          }}>
                            {activity.doc_type === 'invoice' ? 'Facture' : 'BL'}
                          </span>
                        </td>
                        <td>
                          <strong>{activity.supplier_doc_number}</strong>
                          <br />
                          <small style={{ color: 'var(--text-secondary)' }}>ID: {activity.doc_number}</small>
                        </td>
                        <td>{activity.nfournisseur}</td>
                        <td>{formatDate(activity.doc_date)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{formatNumber(activity.total_ttc)} DA</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}