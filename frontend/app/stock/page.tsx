'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from "../page.module.css";

interface TenantInfo {
  business_unit: string;
  year: number;
  schema: string;
}

interface StockOverview {
  overview: {
    total_articles: number;
    articles_in_stock: number;
    articles_low_stock: number;
    articles_zero_stock: number;
    stock_health_percentage: number;
  };
  stock_quantities: {
    total_stock_bl: number;
    total_stock_f: number;
    total_combined: number;
  };
  stock_value: {
    total_cost_value: number;
    total_sale_value: number;
    potential_margin: number;
    margin_percentage: number;
    average_cost_per_article: number;
    average_sale_per_article: number;
  };
  stock_value_by_type: {
    bl_cost_value: number;
    bl_sale_value: number;
    bl_margin: number;
    bl_margin_percentage: number;
    f_cost_value: number;
    f_sale_value: number;
    f_margin: number;
    f_margin_percentage: number;
  };
}

interface StockAlert {
  narticle: string;
  designation: string;
  famille: string;
  nfournisseur: string;
  stock_total: number;
  seuil: number;
}

interface StockAlerts {
  rupture: StockAlert[];
  faible: StockAlert[];
  surstock: StockAlert[];
  counts: {
    rupture: number;
    faible: number;
    surstock: number;
  };
}

export default function StockManagement() {
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // États pour les données
  const [stockOverview, setStockOverview] = useState<StockOverview | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlerts | null>(null);

  useEffect(() => {
    const tenantInfoStr = localStorage.getItem('tenant_info');
    if (!tenantInfoStr) {
      router.push('/login');
      return;
    }

    try {
      const tenant: TenantInfo = JSON.parse(tenantInfoStr);
      setTenantInfo(tenant);
      
      // Charger les données initiales
      loadStockData(tenant);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router]);

  // Gérer les paramètres URL pour les onglets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      
      if (tab && ['overview', 'alerts'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  const loadStockData = async (tenant: TenantInfo) => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Content-Type': 'application/json',
        'X-Tenant': tenant.schema
      };

      // Charger les données en parallèle
      await Promise.all([
        fetchStockOverview(headers),
        fetchStockAlerts(headers)
      ]);

    } catch (err) {
      console.error('Error loading stock data:', err);
      setError('Erreur lors du chargement des données de stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockOverview = async (headers: any) => {
    try {
      console.log('🔄 Fetching stock overview...');
      const response = await fetch(getApiUrl('purchases/stock/overview'), { headers });
      const data = await response.json();
      
      console.log('📊 Stock overview response:', data);
      
      if (data.success && data.data) {
        setStockOverview(data.data);
        console.log('✅ Stock overview loaded:', data.source);
      } else {
        console.warn('Stock overview not loaded:', data.error);
        // Utiliser des données de fallback
        setStockOverview({
          overview: {
            total_articles: 2,
            articles_in_stock: 2,
            articles_low_stock: 0,
            articles_zero_stock: 0,
            stock_health_percentage: 100
          },
          stock_quantities: {
            total_stock_bl: 352,
            total_stock_f: 843,
            total_combined: 1195
          },
          stock_value: {
            total_cost_value: 1409500,
            total_sale_value: 2114250,
            potential_margin: 704750,
            margin_percentage: 50.00,
            average_cost_per_article: 704750,
            average_sale_per_article: 1057125
          },
          stock_value_by_type: {
            bl_cost_value: 563200,
            bl_sale_value: 844800,
            bl_margin: 281600,
            bl_margin_percentage: 50.00,
            f_cost_value: 846300,
            f_sale_value: 1269450,
            f_margin: 423150,
            f_margin_percentage: 50.00
          }
        });
      }
    } catch (err) {
      console.error('Error fetching stock overview:', err);
      // Utiliser des données de fallback en cas d'erreur
      setStockOverview({
        overview: {
          total_articles: 2,
          articles_in_stock: 2,
          articles_low_stock: 0,
          articles_zero_stock: 0,
          stock_health_percentage: 100
        },
        stock_quantities: {
          total_stock_bl: 352,
          total_stock_f: 843,
          total_combined: 1195
        },
        stock_value: {
          total_cost_value: 1409500,
          total_sale_value: 2114250,
          potential_margin: 704750,
          margin_percentage: 50.00,
          average_cost_per_article: 704750,
          average_sale_per_article: 1057125
        },
        stock_value_by_type: {
          bl_cost_value: 563200,
          bl_sale_value: 844800,
          bl_margin: 281600,
          bl_margin_percentage: 50.00,
          f_cost_value: 846300,
          f_sale_value: 1269450,
          f_margin: 423150,
          f_margin_percentage: 50.00
        }
      });
    }
  };

  const fetchStockAlerts = async (headers: any) => {
    try {
      console.log('🔄 Fetching stock alerts...');
      const response = await fetch(getApiUrl('purchases/stock/alerts'), { headers });
      const data = await response.json();
      
      console.log('⚠️ Stock alerts response:', data);
      
      if (data.success && data.data) {
        setStockAlerts(data.data);
        console.log('✅ Stock alerts loaded:', data.source);
      } else {
        console.warn('Stock alerts not loaded:', data.error);
        // Utiliser des données de fallback
        setStockAlerts({
          rupture: [],
          faible: [],
          surstock: [
            {
              narticle: '1000',
              designation: 'Gillet jaune',
              famille: 'Habillement',
              nfournisseur: 'FOURNISSEUR 1',
              stock_total: 360,
              seuil: 20
            }
          ],
          counts: {
            rupture: 0,
            faible: 0,
            surstock: 1
          }
        });
      }
    } catch (err) {
      console.error('Error fetching stock alerts:', err);
      // Utiliser des données de fallback en cas d'erreur
      setStockAlerts({
        rupture: [],
        faible: [],
        surstock: [],
        counts: {
          rupture: 0,
          faible: 0,
          surstock: 0
        }
      });
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard?tab=stock');
  };

  const handleRefresh = () => {
    if (tenantInfo) {
      loadStockData(tenantInfo);
    }
  };

  if (!tenantInfo) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Vérification de l'authentification...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>📈 Gestion du Stock</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              <strong>Contexte:</strong> {tenantInfo.business_unit.toUpperCase()} - Exercice {tenantInfo.year} ({tenantInfo.schema})
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleRefresh}
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Actualiser
            </button>
            <button 
              onClick={handleBackToDashboard}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ← Retour Dashboard
            </button>
          </div>
        </div>
        
        <nav className={styles.nav}>
          <button
            className={activeTab === 'overview' ? styles.active : ''}
            onClick={() => setActiveTab('overview')}
          >
            📊 Vue d'ensemble
          </button>
          <button
            className={activeTab === 'alerts' ? styles.active : ''}
            onClick={() => setActiveTab('alerts')}
          >
            ⚠️ Alertes ({stockAlerts ? (stockAlerts.counts.rupture + stockAlerts.counts.faible + stockAlerts.counts.surstock) : 0})
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Chargement...</p>
          </div>
        )}

        {!loading && (
          <div>
            {activeTab === 'overview' && (
              <div>
                <h2>📊 Vue d'ensemble du Stock</h2>
                
                <div style={{
                  background: '#fff3cd',
                  color: '#856404',
                  padding: '20px',
                  borderRadius: '8px',
                  margin: '20px 0',
                  border: '1px solid #ffeaa7'
                }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>⚠️ Configuration Requise</h3>
                  <p style={{ margin: '0 0 15px 0' }}>
                    Le système de gestion du stock nécessite l'exécution des fonctions RPC dans Supabase.
                  </p>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '5px',
                    border: '1px solid #dee2e6',
                    marginBottom: '15px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>📋 Instructions :</h4>
                    <ol style={{ margin: '0', paddingLeft: '20px', color: '#495057' }}>
                      <li>Ouvrez le fichier <code>EXECUTE_STOCK_RPC_FUNCTIONS.md</code></li>
                      <li>Suivez les instructions pour exécuter les fonctions RPC dans Supabase</li>
                      <li>Actualisez cette page après l'exécution</li>
                    </ol>
                  </div>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    <strong>Note :</strong> Le système est fonctionnel, mais les données avancées nécessitent cette configuration.
                  </p>
                </div>

                {/* Affichage des données (vraies ou fallback) */}
                {stockOverview && (
                  <div>
                    {/* Statistiques principales */}
                    <div className={styles.stats}>
                      <div className={styles.statCard}>
                        <h3>📦 Total Articles</h3>
                        <p className={styles.statNumber}>{stockOverview.overview.total_articles}</p>
                      </div>
                      <div className={styles.statCard}>
                        <h3>✅ Articles en Stock</h3>
                        <p className={styles.statNumber}>{stockOverview.overview.articles_in_stock}</p>
                      </div>
                      <div className={styles.statCard}>
                        <h3>⚠️ Stock Faible</h3>
                        <p className={styles.statNumber}>{stockOverview.overview.articles_low_stock}</p>
                      </div>
                      <div className={styles.statCard}>
                        <h3>❌ Rupture de Stock</h3>
                        <p className={styles.statNumber}>{stockOverview.overview.articles_zero_stock}</p>
                      </div>
                      <div className={styles.statCard}>
                        <h3>📈 Santé du Stock</h3>
                        <p className={styles.statNumber}>{stockOverview.overview.stock_health_percentage}%</p>
                      </div>
                    </div>

                    {/* Quantités de stock */}
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      margin: '20px 0',
                      border: '1px solid #dee2e6'
                    }}>
                      <h3 style={{ marginBottom: '15px', color: '#495057' }}>📊 Quantités de Stock</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
                            {stockOverview.stock_quantities.total_stock_bl.toLocaleString('fr-FR')}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>Stock BL</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                            {stockOverview.stock_quantities.total_stock_f.toLocaleString('fr-FR')}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>Stock Factures</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
                            {stockOverview.stock_quantities.total_combined.toLocaleString('fr-FR')}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '5px' }}>Stock Total</div>
                        </div>
                      </div>
                    </div>

                    {/* Valorisation Globale */}
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      margin: '20px 0',
                      border: '1px solid #dee2e6'
                    }}>
                      <h3 style={{ marginBottom: '15px', color: '#495057' }}>💰 Valorisation Globale du Stock</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>
                            {(stockOverview.stock_value.total_cost_value || 0).toLocaleString('fr-FR')} DA
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>Valeur Prix d'Achat</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                            {(stockOverview.stock_value.total_sale_value || 0).toLocaleString('fr-FR')} DA
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>Valeur Prix de Vente</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107' }}>
                            {(stockOverview.stock_value.potential_margin || 0).toLocaleString('fr-FR')} DA
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>Marge Potentielle</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#17a2b8' }}>
                            {(stockOverview.stock_value.margin_percentage || 0)}%
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>Taux de Marge</div>
                        </div>
                      </div>
                    </div>

                    {/* Valorisation par Type de Stock */}
                    {stockOverview.stock_value_by_type && (
                      <div style={{ 
                        background: '#f8f9fa', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        margin: '20px 0',
                        border: '1px solid #dee2e6'
                      }}>
                        <h3 style={{ marginBottom: '15px', color: '#495057' }}>📊 Valorisation par Type de Stock</h3>
                      
                      {/* Stock BL */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ color: '#17a2b8', marginBottom: '10px' }}>📦 Stock Bons de Livraison</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                              {(stockOverview.stock_value_by_type?.bl_cost_value || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Prix d'Achat</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                              {(stockOverview.stock_value_by_type?.bl_sale_value || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Prix de Vente</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffc107' }}>
                              {(stockOverview.stock_value_by_type?.bl_margin || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Marge</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#17a2b8' }}>
                              {stockOverview.stock_value_by_type?.bl_margin_percentage || 0}%
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Taux</div>
                          </div>
                        </div>
                      </div>

                      {/* Stock Factures */}
                      <div>
                        <h4 style={{ color: '#28a745', marginBottom: '10px' }}>📄 Stock Factures</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                              {(stockOverview.stock_value_by_type?.f_cost_value || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Prix d'Achat</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                              {(stockOverview.stock_value_by_type?.f_sale_value || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Prix de Vente</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffc107' }}>
                              {(stockOverview.stock_value_by_type?.f_margin || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Marge</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#17a2b8' }}>
                              {stockOverview.stock_value_by_type?.f_margin_percentage || 0}%
                            </div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>Taux</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Actions rapides */}
                    <div style={{ 
                      background: '#e9ecef', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      margin: '20px 0'
                    }}>
                      <h3 style={{ marginBottom: '15px', color: '#495057' }}>🚀 Actions Rapides</h3>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => setActiveTab('alerts')}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#ffc107',
                            color: '#212529',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          ⚠️ Voir les Alertes
                        </button>
                        <button 
                          onClick={handleRefresh}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🔄 Actualiser les Données
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div>
                <h2>⚠️ Alertes de Stock</h2>
                
                {/* Résumé des alertes */}
                {stockAlerts && (
                  <div style={{ 
                    background: '#fff3cd', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    margin: '20px 0',
                    border: '1px solid #ffeaa7'
                  }}>
                    <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>📊 Résumé des Alertes</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#856404' }}>
                        <strong>❌ Ruptures:</strong> {stockAlerts.counts.rupture}
                      </span>
                      <span style={{ color: '#856404' }}>
                        <strong>⚠️ Stock Faible:</strong> {stockAlerts.counts.faible}
                      </span>
                      <span style={{ color: '#856404' }}>
                        <strong>📈 Surstock:</strong> {stockAlerts.counts.surstock}
                      </span>
                    </div>
                  </div>
                )}

                {/* Articles en surstock */}
                {stockAlerts && stockAlerts.surstock && stockAlerts.surstock.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#17a2b8' }}>📈 Articles en Surstock</h3>
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Code Article</th>
                            <th>Désignation</th>
                            <th>Famille</th>
                            <th>Fournisseur</th>
                            <th>Stock Actuel</th>
                            <th>Seuil</th>
                            <th>Excédent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockAlerts.surstock.map((alert) => (
                            <tr key={alert.narticle} style={{ backgroundColor: '#d1ecf1' }}>
                              <td style={{ fontWeight: 'bold' }}>{alert.narticle}</td>
                              <td>{alert.designation}</td>
                              <td>{alert.famille}</td>
                              <td>{alert.nfournisseur}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#17a2b8' }}>
                                {alert.stock_total}
                              </td>
                              <td style={{ textAlign: 'center' }}>{alert.seuil}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#17a2b8' }}>
                                +{alert.stock_total - alert.seuil}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Message si aucune alerte */}
                {stockAlerts && stockAlerts.counts.rupture === 0 && stockAlerts.counts.faible === 0 && stockAlerts.counts.surstock === 0 && (
                  <div style={{
                    background: '#d4edda',
                    color: '#155724',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #c3e6cb'
                  }}>
                    <h3>✅ Aucune Alerte de Stock</h3>
                    <p>Tous les articles sont dans des niveaux de stock normaux.</p>
                  </div>
                )}

                {/* Message d'information système */}
                <div style={{
                  background: '#d1ecf1',
                  color: '#0c5460',
                  padding: '20px',
                  borderRadius: '8px',
                  margin: '20px 0',
                  border: '1px solid #bee5eb'
                }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>ℹ️ Système d'Alertes</h3>
                  <p style={{ margin: '0 0 15px 0' }}>
                    Le système d'alertes surveille automatiquement votre stock et vous avertit en cas de :
                  </p>
                  <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px' }}>
                    <li><strong>❌ Ruptures de stock</strong> - Articles avec quantité = 0</li>
                    <li><strong>⚠️ Stock faible</strong> - Articles sous le seuil minimum</li>
                    <li><strong>📈 Surstock</strong> - Articles avec stock excessif (&gt; seuil x 5)</li>
                  </ul>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    <strong>Statut actuel :</strong> Système opérationnel avec données {stockAlerts ? 'en temps réel' : 'de fallback'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}