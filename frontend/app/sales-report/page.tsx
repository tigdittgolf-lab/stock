'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

interface SaleItem {
  type: 'BL' | 'FACTURE';
  numero: number;
  date: string;
  client_code: string;
  client_name: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  marge: number;
  marge_percentage: number;
  created_at: string;
}

interface SalesTotals {
  count_bl: number;
  count_factures: number;
  total_count: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  total_marge: number;
  marge_percentage_avg: number;
}

export default function SalesReport() {
  const router = useRouter();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [totals, setTotals] = useState<SalesTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtres
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    clientCode: '',
    type: 'ALL', // ALL, BL, FACTURE
    todayOnly: false
  });

  useEffect(() => {
    // Initialiser les dates par défaut
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      dateFrom: today,
      dateTo: today,
      todayOnly: true
    }));
  }, []);

  useEffect(() => {
    if (filters.dateFrom && filters.dateTo) {
      fetchSalesData();
    }
  }, [filters]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      
      // Construire les paramètres de requête
      const params = new URLSearchParams({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        type: filters.type,
        ...(filters.clientCode && { clientCode: filters.clientCode })
      });

      console.log('🔍 Fetching sales data with filters:', filters);
      
      const response = await fetch(`http://localhost:3005/api/sales/report?${params}`, {
        headers: {
          'X-Tenant': tenant
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSales(result.data.sales || []);
        setTotals(result.data.totals || null);
        console.log('✅ Sales data loaded:', result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('❌ Error fetching sales data:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Si "Aujourd'hui seulement" est coché, mettre les dates à aujourd'hui
      if (field === 'todayOnly' && value) {
        const today = new Date().toISOString().split('T')[0];
        newFilters.dateFrom = today;
        newFilters.dateTo = today;
      }
      
      return newFilters;
    });
  };

  const resetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({
      dateFrom: today,
      dateTo: today,
      clientCode: '',
      type: 'ALL',
      todayOnly: true
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getTypeColor = (type: string) => {
    return type === 'BL' ? '#17a2b8' : '#28a745';
  };

  const getTypeIcon = (type: string) => {
    return type === 'BL' ? '📦' : '🧾';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>📊 Rapport des Ventes</h1>
        <div>
          <button onClick={() => router.push('/dashboard')} className={styles.secondaryButton}>
            Retour
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Filtres */}
        <div className={styles.formSection} style={{ marginBottom: '20px' }}>
          <h2>🔍 Filtres</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Type de document
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="ALL">Tous les documents</option>
                <option value="BL">Bons de livraison seulement</option>
                <option value="FACTURE">Factures seulement</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Code client (optionnel)
              </label>
              <input
                type="text"
                value={filters.clientCode}
                onChange={(e) => handleFilterChange('clientCode', e.target.value)}
                placeholder="Ex: CL01"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.todayOnly}
                  onChange={(e) => handleFilterChange('todayOnly', e.target.checked)}
                />
                <span style={{ fontWeight: 'bold' }}>Aujourd'hui seulement</span>
              </label>
            </div>

            <div>
              <button
                onClick={resetFilters}
                className={styles.secondaryButton}
                style={{ width: '100%' }}
              >
                🔄 Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Totaux */}
        {totals && (
          <div className={styles.formSection} style={{ marginBottom: '20px', background: '#f8f9fa' }}>
            <h2>📈 Résumé</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '5px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8' }}>{totals.count_bl}</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Bons de livraison</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '5px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>{totals.count_factures}</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Factures</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '5px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>{totals.total_count}</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Total documents</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '5px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>{formatAmount(totals.total_ttc)} DA</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Chiffre d'affaires TTC</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '5px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>{formatAmount(totals.total_marge)} DA</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Marge totale</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', background: 'white', borderRadius: '5px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6f42c1' }}>{totals.marge_percentage_avg.toFixed(1)}%</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Marge moyenne</div>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des ventes */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Chargement des données...</p>
          </div>
        ) : error ? (
          <div className={styles.formSection} style={{ background: '#f8d7da', color: '#721c24' }}>
            <h2>❌ Erreur</h2>
            <p>{error}</p>
          </div>
        ) : sales.length === 0 ? (
          <div className={styles.formSection} style={{ textAlign: 'center' }}>
            <h2>📭 Aucune vente trouvée</h2>
            <p>Aucune vente ne correspond aux critères sélectionnés.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <h2>📋 Détail des Ventes ({sales.length} documents)</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>N°</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th style={{ textAlign: 'right' }}>Montant HT</th>
                  <th style={{ textAlign: 'right' }}>TVA</th>
                  <th style={{ textAlign: 'right' }}>Montant TTC</th>
                  <th style={{ textAlign: 'right' }}>Marge</th>
                  <th style={{ textAlign: 'right' }}>Marge %</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={`${sale.type}-${sale.numero}`}>
                    <td>
                      <span style={{ 
                        color: getTypeColor(sale.type), 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {getTypeIcon(sale.type)} {sale.type}
                      </span>
                    </td>
                    <td><strong>{sale.numero}</strong></td>
                    <td>{new Date(sale.date).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div>
                        <strong>{sale.client_code}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{sale.client_name}</small>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatAmount(sale.montant_ht)} DA</td>
                    <td style={{ textAlign: 'right' }}>{formatAmount(sale.tva)} DA</td>
                    <td style={{ textAlign: 'right' }}><strong>{formatAmount(sale.montant_ttc)} DA</strong></td>
                    <td style={{ textAlign: 'right', color: '#ffc107', fontWeight: 'bold' }}>
                      {formatAmount(sale.marge)} DA
                    </td>
                    <td style={{ textAlign: 'right', color: '#6f42c1', fontWeight: 'bold' }}>
                      {sale.marge_percentage.toFixed(1)}%
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          const path = sale.type === 'BL' ? 'delivery-notes' : 'invoices';
                          router.push(`/${path}/${sale.numero}`);
                        }}
                        className={styles.viewButton}
                        style={{ fontSize: '0.8rem' }}
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}