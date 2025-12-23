'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface TenantInfo {
  tenant: string;
  businessUnit: string;
  year: string;
}

interface DashboardData {
  totalArticles: number;
  totalClients: number;
  totalSuppliers: number;
  lowStockArticles: number;
  totalSales: number;
  totalPurchases: number;
}

export default function ImprovedDashboard() {
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalArticles: 0,
    totalClients: 0,
    totalSuppliers: 0,
    lowStockArticles: 0,
    totalSales: 0,
    totalPurchases: 0
  });

  useEffect(() => {
    const tenantInfoStr = localStorage.getItem('tenantInfo');
    if (!tenantInfoStr) {
      router.push('/login');
      return;
    }

    try {
      const tenant: TenantInfo = JSON.parse(tenantInfoStr);
      setTenantInfo(tenant);
      loadDashboardData(tenant);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router]);

  const loadDashboardData = async (tenant: TenantInfo) => {
    try {
      // Charger les données du dashboard
      const [articlesRes, clientsRes, suppliersRes] = await Promise.all([
        fetch(getApiUrl('sales/articles'), {
          headers: { 'X-Tenant': tenant.tenant }
        }),
        fetch(getApiUrl('sales/clients'), {
          headers: { 'X-Tenant': tenant.tenant }
        }),
        fetch(getApiUrl('sales/suppliers'), {
          headers: { 'X-Tenant': tenant.tenant }
        })
      ]);

      const [articlesData, clientsData, suppliersData] = await Promise.all([
        articlesRes.json(),
        clientsRes.json(),
        suppliersRes.json()
      ]);

      const lowStock = articlesData.success 
        ? articlesData.data.filter((article: any) => (article.stock_f || 0) < (article.seuil || 10)).length
        : 0;

      setDashboardData({
        totalArticles: articlesData.success ? articlesData.data.length : 0,
        totalClients: clientsData.success ? clientsData.data.length : 0,
        totalSuppliers: suppliersData.success ? suppliersData.data.length : 0,
        lowStockArticles: lowStock,
        totalSales: 0, // À implémenter
        totalPurchases: 0 // À implémenter
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenantInfo');
    router.push('/login');
  };

  if (!tenantInfo) {
    return <div>Chargement...</div>;
  }

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.dashboardContainer}>
        {/* Header */}
        <div className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <h1>Système de Gestion de Stock</h1>
            <p>Plateforme intégrée de gestion commerciale et de stock</p>
          </div>
          
          <div className={styles.contextInfo}>
            <div className={styles.contextDetails}>
              <div className={styles.contextItem}>
                <span>🏢</span>
                <span><strong>{tenantInfo.businessUnit}</strong></span>
              </div>
              <div className={styles.contextItem}>
                <span>📅</span>
                <span>Exercice <strong>{tenantInfo.year}</strong></span>
              </div>
              <div className={styles.contextItem}>
                <span>🔧</span>
                <span>Tenant: <strong>{tenantInfo.tenant}</strong></span>
              </div>
            </div>
            
            <div className={styles.contextActions}>
              <button onClick={() => router.push('/tenant-selection')} className={styles.contextButton}>
                ➕ Nouvel Exercice
              </button>
              <button onClick={() => router.push('/tenant-selection')} className={styles.contextButton}>
                🔄 Changer Contexte
              </button>
              <button onClick={handleLogout} className={styles.contextButton}>
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className={styles.tabNavigation}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Tableau de Bord
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'articles' ? styles.active : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            📦 Articles ({dashboardData.totalArticles})
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'clients' ? styles.active : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            👥 Clients ({dashboardData.totalClients})
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'suppliers' ? styles.active : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            🏭 Fournisseurs ({dashboardData.totalSuppliers})
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'sales' ? styles.active : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            💰 Ventes
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'purchases' ? styles.active : ''}`}
            onClick={() => setActiveTab('purchases')}
          >
            🛒 Achats
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'stock' ? styles.active : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            📈 Stock
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Réglages
          </button>
        </div>

        {/* Content */}
        <div className={styles.contentArea}>
          {activeTab === 'dashboard' && (
            <>
              <div className={styles.sectionHeader}>
                <h2>📊 Vue d'Ensemble</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{dashboardData.totalArticles}</span>
                    <span className={styles.statLabel}>Articles</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{dashboardData.totalClients}</span>
                    <span className={styles.statLabel}>Clients</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>{dashboardData.totalSuppliers}</span>
                    <span className={styles.statLabel}>Fournisseurs</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue} style={{ color: dashboardData.lowStockArticles > 0 ? '#dc3545' : '#28a745' }}>
                      {dashboardData.lowStockArticles}
                    </span>
                    <span className={styles.statLabel}>Stock Faible</span>
                  </div>
                </div>

                <div className={styles.moduleGrid}>
                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>📦</div>
                    <h3>Gestion des Articles</h3>
                    <p>Créer, modifier et gérer votre catalogue d'articles avec suivi des stocks en temps réel.</p>
                    <div className={styles.moduleActions}>
                      <button onClick={() => router.push('/articles/create')} className={styles.primaryButton}>
                        Nouvel Article
                      </button>
                      <button onClick={() => setActiveTab('articles')} className={styles.secondaryButton}>
                        Voir Tous
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>💰</div>
                    <h3>Gestion des Ventes</h3>
                    <p>Bons de livraison, factures et proformas avec calculs automatiques et génération PDF.</p>
                    <div className={styles.moduleActions}>
                      <button onClick={() => router.push('/delivery-notes')} className={styles.primaryButton}>
                        Nouveau BL
                      </button>
                      <button onClick={() => setActiveTab('sales')} className={styles.secondaryButton}>
                        Module Ventes
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>🛒</div>
                    <h3>Gestion des Achats</h3>
                    <p>Factures et bons de livraison d'achats avec entrée automatique en stock.</p>
                    <div className={styles.moduleActions}>
                      <button onClick={() => router.push('/purchases/delivery-notes')} className={styles.primaryButton}>
                        Nouveau BL Achat
                      </button>
                      <button onClick={() => setActiveTab('purchases')} className={styles.secondaryButton}>
                        Module Achats
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>👥</div>
                    <h3>Gestion Clients</h3>
                    <p>Base de données clients complète avec historique des transactions.</p>
                    <div className={styles.moduleActions}>
                      <button onClick={() => router.push('/clients/create')} className={styles.primaryButton}>
                        Nouveau Client
                      </button>
                      <button onClick={() => setActiveTab('clients')} className={styles.secondaryButton}>
                        Voir Tous
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'purchases' && (
            <>
              <div className={styles.sectionHeader}>
                <h2>🛒 Gestion des Achats</h2>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.moduleGrid}>
                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>📦</div>
                    <h3>Bons de Livraison d'Achat</h3>
                    <p>Réceptions fournisseurs avec entrée automatique en stock BL et validation fournisseur-articles.</p>
                    <div className={styles.moduleActions}>
                      <button onClick={() => router.push('/purchases/delivery-notes')} className={styles.primaryButton}>
                        Nouveau BL
                      </button>
                      <button onClick={() => router.push('/purchases/delivery-notes/list')} className={styles.secondaryButton}>
                        Liste des BL
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>📄</div>
                    <h3>Factures d'Achat</h3>
                    <p>Gestion des factures fournisseurs avec entrée automatique en stock facture et numéros manuels.</p>
                    <div className={styles.moduleActions}>
                      <button onClick={() => router.push('/purchases')} className={styles.primaryButton}>
                        Nouvelle Facture
                      </button>
                      <button onClick={() => router.push('/purchases/invoices/list')} className={styles.secondaryButton}>
                        Liste des Factures
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>📊</div>
                    <h3>Statistiques Achats</h3>
                    <p>Analyse des achats, performance fournisseurs et rapports détaillés.</p>
                    <div className={styles.moduleActions}>
                      <button className={styles.disabledButton} disabled>
                        Bientôt disponible
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <h4>💡 Fonctionnalités Achats</h4>
                  <ul>
                    <li>✅ <strong>Bons de livraison d'achat</strong> - Entrée de stock BL automatique</li>
                    <li>✅ <strong>Factures d'achat</strong> - Entrée de stock facture automatique</li>
                    <li>✅ <strong>Validation fournisseur-articles</strong> - Cohérence métier garantie</li>
                    <li>✅ <strong>Numéros manuels</strong> - Numéros fournisseur personnalisés</li>
                    <li>✅ <strong>Calculs automatiques</strong> - HT, TVA, TTC</li>
                    <li>⏳ <strong>Rapports d'achats</strong> - En développement</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Autres onglets... */}
        </div>
      </div>
    </div>
  );
}