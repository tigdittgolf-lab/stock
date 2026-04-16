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

      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      const headers = {
        'Content-Type': 'application/json',
        'X-Tenant': tenant.schema,
        'X-Database-Type': dbType
      };

      // Charger les articles d'abord, puis calculer les stats
      const artRes = await fetch('/api/sales/articles', { headers });
      const artData = await artRes.json();
      const arts = artData.success ? (artData.data || []) : [];

      // Calculer overview et alertes depuis les articles réels
      computeStockFromArticles(arts);
      computeAlertsFromArticles(arts);

    } catch (err) {
      console.error('Error loading stock data:', err);
      setError('Erreur lors du chargement des données de stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockOverview = async (headers: any) => {
    // Kept for potential backend API use in future
  };

  const computeStockFromArticles = (arts: any[]) => {
    const total = arts.length;
    let inStock = 0, lowStock = 0, zeroStock = 0;
    let totalStockBL = 0, totalStockF = 0;
    let totalCostBL = 0, totalSaleBL = 0;
    let totalCostF = 0, totalSaleF = 0;

    for (const a of arts) {
      const sbl = parseFloat(a.stock_bl ?? 0);
      const sf = parseFloat(a.stock_f ?? 0);
      const seuil = parseFloat(a.seuil ?? 0);
      const pu = parseFloat(a.prix_unitaire ?? 0);
      const pv = parseFloat(a.prix_vente ?? 0);
      const combined = sbl + sf;

      totalStockBL += sbl;
      totalStockF += sf;
      totalCostBL += sbl * pu;
      totalSaleBL += sbl * pv;
      totalCostF += sf * pu;
      totalSaleF += sf * pv;

      if (combined === 0) zeroStock++;
      else if (seuil > 0 && combined <= seuil) lowStock++;
      else inStock++;
    }

    const totalCost = totalCostBL + totalCostF;
    const totalSale = totalSaleBL + totalSaleF;
    const margin = totalSale - totalCost;
    const marginPct = totalSale > 0 ? Math.round((margin / totalSale) * 100) : 0;

    setStockOverview({
      overview: {
        total_articles: total,
        articles_in_stock: inStock,
        articles_low_stock: lowStock,
        articles_zero_stock: zeroStock,
        stock_health_percentage: total > 0 ? Math.round(((total - zeroStock) / total) * 100) : 0
      },
      stock_quantities: {
        total_stock_bl: Math.round(totalStockBL),
        total_stock_f: Math.round(totalStockF),
        total_combined: Math.round(totalStockBL + totalStockF)
      },
      stock_value: {
        total_cost_value: Math.round(totalCost),
        total_sale_value: Math.round(totalSale),
        potential_margin: Math.round(margin),
        margin_percentage: marginPct,
        average_cost_per_article: total > 0 ? Math.round(totalCost / total) : 0,
        average_sale_per_article: total > 0 ? Math.round(totalSale / total) : 0
      },
      stock_value_by_type: {
        bl_cost_value: Math.round(totalCostBL),
        bl_sale_value: Math.round(totalSaleBL),
        bl_margin: Math.round(totalSaleBL - totalCostBL),
        bl_margin_percentage: totalSaleBL > 0 ? Math.round(((totalSaleBL - totalCostBL) / totalSaleBL) * 100) : 0,
        f_cost_value: Math.round(totalCostF),
        f_sale_value: Math.round(totalSaleF),
        f_margin: Math.round(totalSaleF - totalCostF),
        f_margin_percentage: totalSaleF > 0 ? Math.round(((totalSaleF - totalCostF) / totalSaleF) * 100) : 0
      }
    });
  };

  const fetchStockAlerts = async (headers: any) => {
    // Kept for potential backend API use in future
  };

  const computeAlertsFromArticles = (arts: any[]) => {
    const rupture: any[] = [], faible: any[] = [], surstock: any[] = [];
    for (const a of arts) {
      const combined = (parseFloat(a.stock_bl ?? 0)) + (parseFloat(a.stock_f ?? 0));
      const seuil = parseFloat(a.seuil ?? 0);
      const item = { narticle: a.narticle, designation: a.designation, famille: a.famille, nfournisseur: a.nfournisseur, stock_total: combined, seuil };
      if (combined === 0) rupture.push(item);
      else if (seuil > 0 && combined <= seuil) faible.push(item);
      else if (seuil > 0 && combined > seuil * 5) surstock.push(item);
    }
    setStockAlerts({ rupture, faible, surstock, counts: { rupture: rupture.length, faible: faible.length, surstock: surstock.length } });
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
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', marginTop: '5px' }}>
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
                      background: 'var(--card-background)', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      margin: '20px 0',
                      border: '1px solid var(--border-color)'
                    }}>
                      <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>📊 Quantités de Stock</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--info-color)' }}>
                            {stockOverview.stock_quantities.total_stock_bl.toLocaleString('fr-FR')}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>Stock BL</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                            {stockOverview.stock_quantities.total_stock_f.toLocaleString('fr-FR')}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>Stock Factures</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            {stockOverview.stock_quantities.total_combined.toLocaleString('fr-FR')}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>Stock Total</div>
                        </div>
                      </div>
                    </div>

                    {/* Valorisation Globale */}
                    <div style={{ 
                      background: 'var(--card-background)', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      margin: '20px 0',
                      border: '1px solid var(--border-color)'
                    }}>
                      <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>💰 Valorisation Globale du Stock</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--error-color)' }}>
                            {(stockOverview.stock_value.total_cost_value || 0).toLocaleString('fr-FR')} DA
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>Valeur Prix d'Achat</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                            {(stockOverview.stock_value.total_sale_value || 0).toLocaleString('fr-FR')} DA
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>Valeur Prix de Vente</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                            {(stockOverview.stock_value.potential_margin || 0).toLocaleString('fr-FR')} DA
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>Marge Potentielle</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--info-color)' }}>
                            {(stockOverview.stock_value.margin_percentage || 0)}%
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>Taux de Marge</div>
                        </div>
                      </div>
                    </div>

                    {/* Valorisation par Type de Stock */}
                    {stockOverview.stock_value_by_type && (
                      <div style={{ 
                        background: 'var(--card-background)', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        margin: '20px 0',
                        border: '1px solid var(--border-color)'
                      }}>
                        <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>📊 Valorisation par Type de Stock</h3>
                      
                      {/* Stock BL */}
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ color: 'var(--info-color)', marginBottom: '10px' }}>📦 Stock Bons de Livraison</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--error-color)' }}>
                              {(stockOverview.stock_value_by_type?.bl_cost_value || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prix d'Achat</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                              {(stockOverview.stock_value_by_type?.bl_sale_value || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prix de Vente</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                              {(stockOverview.stock_value_by_type?.bl_margin || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Marge</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--info-color)' }}>
                              {stockOverview.stock_value_by_type?.bl_margin_percentage || 0}%
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Taux</div>
                          </div>
                        </div>
                      </div>

                      {/* Stock Factures */}
                      <div>
                        <h4 style={{ color: 'var(--success-color)', marginBottom: '10px' }}>📄 Stock Factures</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--error-color)' }}>
                              {(stockOverview.stock_value_by_type?.f_cost_value || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prix d'Achat</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                              {(stockOverview.stock_value_by_type?.f_sale_value || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Prix de Vente</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                              {(stockOverview.stock_value_by_type?.f_margin || 0).toLocaleString('fr-FR')} DA
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Marge</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: 'var(--background-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--info-color)' }}>
                              {stockOverview.stock_value_by_type?.f_margin_percentage || 0}%
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Taux</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Actions rapides */}
                    <div style={{ 
                      background: 'var(--background-secondary)', 
                      padding: '20px', 
                      borderRadius: '8px', 
                      margin: '20px 0'
                    }}>
                      <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>🚀 Actions Rapides</h3>
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
                    background: 'var(--warning-color-light)', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    margin: '20px 0',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>📊 Résumé des Alertes</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-primary)' }}>
                        <strong>❌ Ruptures:</strong> {stockAlerts.counts.rupture}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        <strong>⚠️ Stock Faible:</strong> {stockAlerts.counts.faible}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        <strong>📈 Surstock:</strong> {stockAlerts.counts.surstock}
                      </span>
                    </div>
                  </div>
                )}

                {/* Articles en surstock */}
                {stockAlerts && stockAlerts.surstock && stockAlerts.surstock.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: 'var(--info-color)' }}>📈 Articles en Surstock</h3>
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
                            <tr key={alert.narticle} style={{ backgroundColor: 'var(--info-color-light)' }}>
                              <td style={{ fontWeight: 'bold' }}>{alert.narticle}</td>
                              <td>{alert.designation}</td>
                              <td>{alert.famille}</td>
                              <td>{alert.nfournisseur}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--info-color)' }}>
                                {alert.stock_total}
                              </td>
                              <td style={{ textAlign: 'center' }}>{alert.seuil}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--info-color)' }}>
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
                    background: 'var(--success-color-light)',
                    color: 'var(--text-primary)',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h3>✅ Aucune Alerte de Stock</h3>
                    <p>Tous les articles sont dans des niveaux de stock normaux.</p>
                  </div>
                )}

                {/* Message d'information système */}
                <div style={{
                  background: 'var(--info-color-light)',
                  color: 'var(--text-primary)',
                  padding: '20px',
                  borderRadius: '8px',
                  margin: '20px 0',
                  border: '1px solid var(--border-color)'
                }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>ℹ️ Système d'Alertes</h3>
                  <p style={{ margin: '0 0 15px 0', color: 'var(--text-secondary)' }}>
                    Le système d'alertes surveille automatiquement votre stock et vous avertit en cas de :
                  </p>
                  <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                    <li><strong>❌ Ruptures de stock</strong> - Articles avec quantité = 0</li>
                    <li><strong>⚠️ Stock faible</strong> - Articles sous le seuil minimum</li>
                    <li><strong>📈 Surstock</strong> - Articles avec stock excessif (&gt; seuil x 5)</li>
                  </ul>
                  <p style={{ margin: '0', fontSize: '14px', color: 'var(--text-secondary)' }}>
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