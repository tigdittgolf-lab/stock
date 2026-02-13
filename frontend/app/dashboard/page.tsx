'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import DatabaseTypeIndicator from '@/components/DatabaseTypeIndicator';
import DatabaseSelector from '@/components/DatabaseSelector';
import styles from "../page.module.css";
import dashboardStyles from "./dashboard.module.css";

// Fonction de formatage personnalisée pour les montants: "999 999.99"
const formatAmount = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '0.00';
  
  // Convertir en string avec 2 décimales
  const fixed = amount.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');
  
  // Ajouter des espaces pour les milliers
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return `${formattedInteger}.${decimalPart}`;
};

interface TenantInfo {
  business_unit: string;
  year: number;
  schema: string;
}

interface Article {
  narticle: string;
  designation: string;
  famille: string;
  nfournisseur?: string;
  prix_unitaire: number;
  marge: number;
  tva: number;
  prix_vente: number;
  seuil: number;
  stock_f: number;
  stock_bl: number;
}

interface Client {
  nclient: string;
  raison_sociale: string;
  adresse: string;
  contact_person: string;
  tel: string;
  email: string;
  c_affaire_fact: number;
  c_affaire_bl: number;
  nrc: string;
  i_fiscal: string;
}

interface Supplier {
  nfournisseur: string;
  nom_fournisseur: string;
  resp_fournisseur: string;
  adresse_fourni: string;
  tel: string;
  email: string;
  caf: number;
  cabl: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  
  // États pour les filtres clients
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientStatus, setSelectedClientStatus] = useState('');

  useEffect(() => {
    // Vérifier l'authentification et les informations de tenant
    const tenantInfoStr = localStorage.getItem('tenant_info');
    if (!tenantInfoStr) {
      router.push('/login');
      return;
    }

    try {
      const tenant: TenantInfo = JSON.parse(tenantInfoStr);
      setTenantInfo(tenant);
      
      // Charger les données initiales
      loadDashboardData(tenant);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router]);

  // Gérer les paramètres URL pour les messages et onglets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      const message = urlParams.get('message');
      
      if (tab) {
        setActiveTab(tab);
      }
      
      if (message) {
        // Afficher le message de succès temporairement
        setError(null);
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #d4edda;
          color: #155724;
          padding: 15px 20px;
          border-radius: 5px;
          border: 1px solid #c3e6cb;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        successDiv.textContent = decodeURIComponent(message);
        document.body.appendChild(successDiv);
        
        // Supprimer le message après 3 secondes
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
        
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Recharger les données quand tenantInfo change ou quand on revient avec un message
  useEffect(() => {
    if (tenantInfo && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get('message');
      const refresh = urlParams.get('refresh');
      
      // Si on a un paramètre refresh, vider le cache
      if (refresh) {
        localStorage.removeItem('cached_suppliers');
        localStorage.removeItem('cached_articles');
        localStorage.removeItem('cached_clients');
        console.log('🧹 Cache cleared due to refresh parameter');
      }
      
      if (message) {
        // Recharger les données immédiatement et plusieurs fois pour s'assurer
        loadDashboardData(tenantInfo);
        
        setTimeout(() => {
          loadDashboardData(tenantInfo);
        }, 1000);
        
        setTimeout(() => {
          loadDashboardData(tenantInfo);
        }, 3000);
      }
    }
  }, [tenantInfo]);

  // Auto-reload supprimé - rechargement manuel uniquement

  const loadDashboardData = async (tenant: TenantInfo) => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer le type de base de données depuis localStorage
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'mysql';

      const headers = {
        'Content-Type': 'application/json',
        'X-Tenant': tenant.schema,
        'X-Database-Type': dbType
      };

      // Charger les données en parallèle
      await Promise.all([
        fetchArticles(headers),
        fetchClients(headers),
        fetchSuppliers(headers),
        fetchCompanyInfo(headers)
      ]);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (headers: any) => {
    try {
      console.log('🔄 Fetching articles...');
      
      // Utiliser la route frontend qui fonctionne
      const response = await fetch('/api/sales/articles', { headers });
      const data = await response.json();
      
      console.log('📊 Articles response:', { success: data.success, dataLength: data.data?.length || 0 });
      
      if (data.success && data.data && data.data.length > 0) {
        setArticles(data.data);
        console.log('✅ Articles loaded from database:', data.data.length);
        return;
      }
      
      // Si pas de données, utiliser localStorage comme fallback
      console.log('⚠️ No articles from API, using localStorage fallback');
      const localArticles = JSON.parse(localStorage.getItem('created_articles') || '[]');
      setArticles(localArticles);
      console.log('📦 Using localStorage data:', localArticles.length, 'articles');
      
    } catch (err) {
      console.error('Error fetching articles:', err);
      // En cas d'erreur totale, au moins afficher les articles créés localement
      const localArticles = JSON.parse(localStorage.getItem('created_articles') || '[]');
      setArticles(localArticles);
      console.log('🔧 Using only localStorage:', localArticles.length, 'articles');
    }
  };

  const fetchClients = async (headers: any) => {
    try {
      // Utiliser la route frontend qui fonctionne
      const response = await fetch('/api/sales/clients', { headers });
      const data = await response.json();
      
      if (data.success) {
        setClients(data.data || []);
        console.log(`📦 Clients loaded: ${data.data?.length || 0}`);
      } else {
        console.warn('Clients not loaded:', data.error);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchSuppliers = async (headers: any) => {
    try {
      // Ajouter cache-busting pour forcer le refresh
      const cacheBuster = Date.now();
      // Utiliser la route frontend qui fonctionne (confirmé par le debug)
      const apiUrl = `/api/sales/suppliers?t=${cacheBuster}`;
      
      console.log('🔍 Fetching suppliers via frontend route:', {
        apiUrl,
        headers,
        cacheBuster
      });
      
      const response = await fetch(apiUrl, { 
        method: 'GET',
        headers: {
          ...headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('📡 Suppliers response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuppliers(data.data || []);
        console.log(`📦 Suppliers loaded: ${data.data?.length || 0} from ${data.database_type || 'unknown'}`);
      } else {
        console.warn('Suppliers not loaded:', data.error);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchCompanyInfo = async (headers: any) => {
    try {
      console.log('🏢 Fetching company info...');
      const response = await fetch('/api/company/info', { headers });
      const data = await response.json();
      
      if (data.success && data.data) {
        setCompanyInfo(data.data);
        console.log('✅ Company info loaded:', data.data.nom_entreprise);
      } else {
        console.warn('Company info not loaded:', data.error);
      }
    } catch (err) {
      console.error('Error fetching company info:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant_info');
    router.push('/login');
  };

  const handleChangeTenant = () => {
    router.push('/tenant-selection');
  };

  const handleNewExercise = () => {
    router.push('/new-exercise');
  };

  const getLowStockArticles = () => {
    return articles.filter(article => {
      const stockTotal = (article.stock_f || 0) + (article.stock_bl || 0);
      return stockTotal <= article.seuil;
    });
  };

  const getTotalValue = () => {
    return articles.reduce((total, article) => total + (article.stock_f * article.prix_vente), 0);
  };

  // Fonctions de filtrage
  const getUniqueFamily = () => {
    const families = articles.map(article => article.famille).filter(Boolean);
    return [...new Set(families)].sort();
  };

  const getUniqueSuppliers = () => {
    const supplierCodes = articles.map(article => article.nfournisseur).filter(Boolean);
    const uniqueCodes = [...new Set(supplierCodes)].sort();
    
    // Mapper les codes avec les noms des fournisseurs
    return uniqueCodes.map(code => {
      const supplier = suppliers.find(s => s.nfournisseur === code);
      return {
        code: code,
        name: supplier ? supplier.nom_fournisseur : code
      };
    });
  };

  const getFilteredArticles = () => {
    return articles.filter(article => {
      // Filtre par recherche (code ou désignation)
      const matchesSearch = searchTerm === '' || 
        article.narticle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.designation.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtre par famille
      const matchesFamily = selectedFamily === '' || article.famille === selectedFamily;

      // Filtre par fournisseur
      const matchesSupplier = selectedSupplier === '' || 
        article.nfournisseur === selectedSupplier ||
        (selectedSupplier === 'none' && (!article.nfournisseur || article.nfournisseur === null));

      // Filtre par statut de stock (stock total = stock_f + stock_bl)
      const stockTotal = (article.stock_f || 0) + (article.stock_bl || 0);
      const matchesStatus = selectedStatus === '' || 
        (selectedStatus === 'low' && stockTotal <= article.seuil) ||
        (selectedStatus === 'normal' && stockTotal > article.seuil) ||
        (selectedStatus === 'zero' && stockTotal === 0);

      return matchesSearch && matchesFamily && matchesSupplier && matchesStatus;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFamily('');
    setSelectedStatus('');
    setSelectedSupplier('');
  };

  // Fonctions de filtrage pour les clients
  const getFilteredClients = () => {
    return clients.filter(client => {
      // Filtre par recherche (code, raison sociale, contact)
      const matchesSearch = clientSearchTerm === '' || 
        client.nclient.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.raison_sociale.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        (client.contact_person && client.contact_person.toLowerCase().includes(clientSearchTerm.toLowerCase()));

      // Filtre par statut (basé sur le chiffre d'affaires total: Factures + BL)
      const totalCA = (client.c_affaire_fact || 0) + (client.c_affaire_bl || 0);
      const matchesStatus = selectedClientStatus === '' || 
        (selectedClientStatus === 'active' && totalCA > 0) ||
        (selectedClientStatus === 'inactive' && totalCA === 0);

      return matchesSearch && matchesStatus;
    });
  };

  const clearClientFilters = () => {
    setClientSearchTerm('');
    setSelectedClientStatus('');
  };

  // États pour les filtres fournisseurs
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [selectedSupplierStatus, setSelectedSupplierStatus] = useState('');

  // Fonctions de filtrage pour les fournisseurs
  const getFilteredSuppliers = () => {
    return suppliers.filter(supplier => {
      // Filtre par recherche (code, nom, responsable)
      const matchesSearch = supplierSearchTerm === '' || 
        supplier.nfournisseur.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
        supplier.nom_fournisseur.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
        (supplier.resp_fournisseur && supplier.resp_fournisseur.toLowerCase().includes(supplierSearchTerm.toLowerCase()));

      // Filtre par statut (basé sur le chiffre d'affaires)
      const matchesStatus = selectedSupplierStatus === '' || 
        (selectedSupplierStatus === 'active' && (supplier.caf || 0) > 0) ||
        (selectedSupplierStatus === 'inactive' && (supplier.caf || 0) === 0);

      return matchesSearch && matchesStatus;
    });
  };

  const clearSupplierFilters = () => {
    setSupplierSearchTerm('');
    setSelectedSupplierStatus('');
  };

  // Fonctions pour les actions sur les fournisseurs
  const handleEditSupplier = (supplier: Supplier) => {
    router.push(`/dashboard/edit-supplier/${supplier.nfournisseur}`);
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!tenantInfo) return;

    const confirmDelete = window.confirm(
      `⚠️ ATTENTION ⚠️\n\n` +
      `Êtes-vous sûr de vouloir supprimer le fournisseur "${supplier.nfournisseur}" ?\n\n` +
      `Fournisseur: ${supplier.nom_fournisseur}\n\n` +
      `⚠️ IMPORTANT : Cette action est irréversible !\n\n` +
      `Avant de supprimer, assurez-vous que ce fournisseur :\n` +
      `• N'a aucune commande en cours\n` +
      `• N'a aucun article associé\n` +
      `• N'a aucune transaction en cours\n\n` +
      `Tapez "SUPPRIMER" pour confirmer :`
    );

    if (!confirmDelete) return;

    const finalConfirm = window.prompt(
      `Dernière confirmation !\n\n` +
      `Pour supprimer définitivement le fournisseur "${supplier.nfournisseur}", tapez exactement : SUPPRIMER`
    );

    if (finalConfirm !== 'SUPPRIMER') {
      alert('❌ Suppression annulée - Confirmation incorrecte');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(getApiUrl(`sales/suppliers/${supplier.nfournisseur}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema
        }
      });

      const result = await response.json();

      if (result.success) {
        await loadDashboardData(tenantInfo);
        alert(`✅ Fournisseur "${supplier.nfournisseur}" supprimé avec succès !`);
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert(`❌ Erreur lors de la suppression : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour les actions sur les articles
  const handleEditArticle = (article: Article) => {
    // Rediriger vers la page de modification (à créer)
    router.push(`/dashboard/edit-article/${article.narticle}`);
  };

  // Fonctions pour les actions sur les clients
  const handleEditClient = (client: Client) => {
    router.push(`/dashboard/edit-client/${client.nclient}`);
  };

  const handleDeleteClient = async (client: Client) => {
    if (!tenantInfo) return;

    const confirmDelete = window.confirm(
      `⚠️ ATTENTION ⚠️\n\n` +
      `Êtes-vous sûr de vouloir supprimer le client "${client.nclient}" ?\n\n` +
      `Client: ${client.raison_sociale}\n\n` +
      `⚠️ IMPORTANT : Cette action est irréversible !\n\n` +
      `Avant de supprimer, assurez-vous que ce client :\n` +
      `• N'a aucune facture en cours\n` +
      `• N'a aucun bon de livraison\n` +
      `• N'a aucune transaction en cours\n\n` +
      `Tapez "SUPPRIMER" pour confirmer :`
    );

    if (!confirmDelete) return;

    const finalConfirm = window.prompt(
      `Dernière confirmation !\n\n` +
      `Pour supprimer définitivement le client "${client.nclient}", tapez exactement : SUPPRIMER`
    );

    if (finalConfirm !== 'SUPPRIMER') {
      alert('❌ Suppression annulée - Confirmation incorrecte');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(getApiUrl(`sales/clients/${client.nclient}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema
        }
      });

      const result = await response.json();

      if (result.success) {
        await loadDashboardData(tenantInfo);
        alert(`✅ Client "${client.nclient}" supprimé avec succès !`);
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert(`❌ Erreur lors de la suppression : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (article: Article) => {
    if (!tenantInfo) return;

    // Vérification de sécurité
    const confirmDelete = window.confirm(
      `⚠️ ATTENTION ⚠️\n\n` +
      `Êtes-vous sûr de vouloir supprimer l'article "${article.narticle}" ?\n\n` +
      `⚠️ IMPORTANT : Cette action est irréversible !\n\n` +
      `Avant de supprimer, assurez-vous que cet article :\n` +
      `• N'a jamais été facturé\n` +
      `• N'apparaît dans aucun bon de livraison\n` +
      `• N'a aucune transaction en cours\n\n` +
      `Tapez "SUPPRIMER" pour confirmer :`
    );

    if (!confirmDelete) return;

    // Demander une confirmation supplémentaire
    const finalConfirm = window.prompt(
      `Dernière confirmation !\n\n` +
      `Pour supprimer définitivement l'article "${article.narticle}", tapez exactement : SUPPRIMER`
    );

    if (finalConfirm !== 'SUPPRIMER') {
      alert('❌ Suppression annulée - Confirmation incorrecte');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(getApiUrl(`articles/${article.narticle}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema
        }
      });

      const result = await response.json();

      if (result.success) {
        // Recharger les données
        await loadDashboardData(tenantInfo);
        
        // Afficher un message de succès
        alert(`✅ Article "${article.narticle}" supprimé avec succès !`);
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert(`❌ Erreur lors de la suppression : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
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
            <h1>Système de Gestion de Stock</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>
                <strong>Contexte:</strong> {tenantInfo.business_unit.toUpperCase()} - Exercice {tenantInfo.year} ({tenantInfo.schema})
              </span>
              {companyInfo && (
                <span style={{ 
                  padding: '4px 12px', 
                  background: '#e7f3ff', 
                  borderRadius: '12px',
                  color: '#004085',
                  fontWeight: '500'
                }}>
                  🏢 {companyInfo.nom_entreprise || 'Activité non définie'}
                </span>
              )}
              <DatabaseSelector />
              <DatabaseTypeIndicator />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Afficher le nom de l'utilisateur connecté */}
            {(() => {
              try {
                const userInfo = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
                const user = userInfo ? JSON.parse(userInfo) : null;
                if (user) {
                  const roleIcon = user.role === 'admin' ? '👨‍💼' : user.role === 'manager' ? '👔' : '👤';
                  const roleColor = user.role === 'admin' ? '#667eea' : user.role === 'manager' ? '#ffc107' : '#6c757d';
                  return (
                    <div style={{
                      padding: '6px 14px',
                      background: 'white',
                      border: `2px solid ${roleColor}`,
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      <span>{roleIcon}</span>
                      <span>{user.full_name || user.username}</span>
                    </div>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}
            <button 
              onClick={handleNewExercise}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Nouvel Exercice
            </button>
            <button 
              onClick={handleChangeTenant}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Changer Contexte
            </button>
            <button 
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
        
        <nav className={styles.nav}>
          <button
            className={activeTab === 'dashboard' ? styles.active : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Tableau de Bord
          </button>
          <button
            className={activeTab === 'articles' ? styles.active : ''}
            onClick={() => setActiveTab('articles')}
          >
            📦 Articles ({articles.length})
          </button>
          <button
            className={activeTab === 'clients' ? styles.active : ''}
            onClick={() => setActiveTab('clients')}
          >
            👥 Clients ({clients.length})
          </button>
          <button
            className={activeTab === 'suppliers' ? styles.active : ''}
            onClick={() => setActiveTab('suppliers')}
          >
            🏭 Fournisseurs ({suppliers.length})
          </button>
          <button
            className={activeTab === 'sales' ? styles.active : ''}
            onClick={() => setActiveTab('sales')}
          >
            💰 Ventes
          </button>
          <button
            className={activeTab === 'purchases' ? styles.active : ''}
            onClick={() => setActiveTab('purchases')}
          >
            🛒 Achats
          </button>
          <button
            className={activeTab === 'stock' ? styles.active : ''}
            onClick={() => setActiveTab('stock')}
          >
            📈 Stock
          </button>
          <button
            className={activeTab === 'settings' ? styles.active : ''}
            onClick={() => router.push('/settings')}
          >
            ⚙️ Réglages
          </button>
          {/* Bouton Administration - Visible uniquement pour les admins */}
          {(() => {
            try {
              const userInfo = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
              const user = userInfo ? JSON.parse(userInfo) : null;
              return user?.role === 'admin' ? (
                <button
                  className={activeTab === 'admin' ? styles.active : ''}
                  onClick={() => router.push('/admin')}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  👨‍💼 Administration
                </button>
              ) : null;
            } catch {
              return null;
            }
          })()}
        </nav>
      </header>

      <main className={styles.main}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Chargement des données...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '5px',
            margin: '20px',
            textAlign: 'center'
          }}>
            <p>{error}</p>
            <button 
              onClick={() => loadDashboardData(tenantInfo)}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'dashboard' && (
              <div className={styles.dashboard}>
                <div className={styles.stats}>
                  <div className={styles.statCard}>
                    <h3>📦 Total Articles</h3>
                    <p className={styles.statNumber}>{articles.length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>⚠️ Articles en Rupture</h3>
                    <p className={styles.statNumber}>{getLowStockArticles().length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>👥 Total Clients</h3>
                    <p className={styles.statNumber}>{clients.length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>🏭 Total Fournisseurs</h3>
                    <p className={styles.statNumber}>{suppliers.length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>💰 Valeur Totale Stock</h3>
                    <p className={styles.statNumber}>{getTotalValue().toLocaleString('fr-FR')} DA</p>
                  </div>
                </div>

                <div className={styles.quickActions}>
                  <h3>Actions Rapides</h3>
                  <div className={styles.actions}>
                    <button onClick={() => setActiveTab('articles')}>📦 Voir Articles</button>
                    <button onClick={() => setActiveTab('clients')}>👥 Voir Clients</button>
                    <button onClick={() => setActiveTab('suppliers')}>🏭 Voir Fournisseurs</button>
                    <button onClick={() => setActiveTab('sales')}>💰 Nouvelle Vente</button>
                  </div>
                </div>

                {getLowStockArticles().length > 0 && (
                  <div style={{
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '5px',
                    padding: '15px',
                    margin: '20px 0'
                  }}>
                    <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>⚠️ Alertes Stock</h3>
                    <p style={{ color: '#856404', margin: '0' }}>
                      {getLowStockArticles().length} article(s) sous le seuil minimum
                    </p>
                    <button 
                      onClick={() => setActiveTab('stock')}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Voir Détails
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'articles' && (
              <div className={styles.articles}>
                <div className={styles.sectionHeader}>
                  <h2>📦 Gestion des Articles</h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => tenantInfo && loadDashboardData(tenantInfo)}
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
                      className={styles.primaryButton}
                      onClick={() => router.push('/dashboard/add-article')}
                    >
                      ➕ Ajouter un Article
                    </button>
                  </div>
                </div>

                {/* Filtres */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#495057' }}>🔍 Filtres:</span>
                    </div>
                    
                    {/* Recherche */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
                        Recherche (Code/Désignation)
                      </label>
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '200px'
                        }}
                      />
                    </div>

                    {/* Filtre par famille */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
                        Famille
                      </label>
                      <select
                        value={selectedFamily}
                        onChange={(e) => setSelectedFamily(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '150px'
                        }}
                      >
                        <option value="">Toutes les familles</option>
                        {getUniqueFamily().map(family => (
                          <option key={family} value={family}>{family}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtre par fournisseur */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
                        Fournisseur
                      </label>
                      <select
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '180px'
                        }}
                      >
                        <option value="">Tous les fournisseurs</option>
                        <option value="none">🚫 Sans fournisseur</option>
                        {getUniqueSuppliers().map(supplier => (
                          <option key={supplier.code} value={supplier.code}>
                            {supplier.name} ({supplier.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtre par statut de stock */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
                        Statut Stock
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '130px'
                        }}
                      >
                        <option value="">Tous les statuts</option>
                        <option value="normal">✅ En Stock</option>
                        <option value="low">⚠️ Stock Faible</option>
                        <option value="zero">❌ Rupture</option>
                      </select>
                    </div>

                    {/* Bouton effacer filtres */}
                    <button
                      onClick={clearFilters}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '20px'
                      }}
                    >
                      🗑️ Effacer
                    </button>

                    {/* Compteur de résultats */}
                    <div style={{ 
                      marginLeft: 'auto', 
                      fontSize: '14px', 
                      color: '#495057',
                      fontWeight: 'bold',
                      marginTop: '20px'
                    }}>
                      📊 {getFilteredArticles().length} / {articles.length} articles
                    </div>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: '80px', maxWidth: '80px' }}>Code</th>
                        <th style={{ width: '300px', maxWidth: '300px' }}>Désignation</th>
                        <th style={{ width: '100px' }}>Famille</th>
                        <th style={{ width: '120px' }}>Fournisseur</th>
                        <th style={{ width: '90px' }}>Prix Unit.</th>
                        <th style={{ width: '70px' }}>Marge %</th>
                        <th style={{ width: '90px' }}>Prix Vente</th>
                        <th style={{ width: '70px' }}>Stock F</th>
                        <th style={{ width: '70px' }}>Stock BL</th>
                        <th style={{ width: '90px' }}>Stock Total</th>
                        <th style={{ width: '60px' }}>Seuil</th>
                        <th style={{ width: '80px' }}>Statut</th>
                        <th style={{ width: '140px', minWidth: '140px', position: 'sticky', right: 0, backgroundColor: 'var(--background-secondary)', zIndex: 1 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredArticles().length === 0 ? (
                        <tr>
                          <td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            {articles.length === 0 
                              ? `Aucun article trouvé pour ${tenantInfo.schema}`
                              : 'Aucun article ne correspond aux filtres sélectionnés'
                            }
                          </td>
                        </tr>
                      ) : (
                        getFilteredArticles().map((article, index) => {
                          const stockTotal = (article.stock_f || 0) + (article.stock_bl || 0);
                          const isLowStock = stockTotal <= article.seuil;
                          const isZeroStock = stockTotal === 0;
                          const supplierName = suppliers.find(s => s.nfournisseur === article.nfournisseur)?.nom_fournisseur || article.nfournisseur || '-';
                          
                          return (
                            <tr key={`${article.narticle}-${index}`}>
                              <td style={{ fontWeight: 'bold', width: '80px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.narticle}</td>
                              <td style={{ fontWeight: 'bold', color: '#007bff', width: '300px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={article.designation}>
                                {article.designation}
                              </td>
                              <td style={{ fontSize: '12px', width: '100px' }}>{article.famille}</td>
                              <td style={{ fontSize: '11px', width: '120px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={supplierName}>
                                {supplierName}
                              </td>
                              <td style={{ textAlign: 'right', fontSize: '12px' }}>
                                {formatAmount(article.prix_unitaire)}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: '12px' }}>
                                {article.marge}%
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                                {formatAmount(article.prix_vente)}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{article.stock_f}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{article.stock_bl}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: isZeroStock ? '#dc3545' : isLowStock ? '#ffc107' : '#28a745' }}>
                                {stockTotal}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: '12px' }}>{article.seuil}</td>
                              <td>
                                <span className={
                                  isZeroStock ? styles.zeroStock : 
                                  isLowStock ? styles.lowStock : styles.inStock
                                }>
                                  {isZeroStock ? '❌ Rupture' : 
                                   isLowStock ? '⚠️ Faible' : '✅ OK'}
                                </span>
                              </td>
                              <td style={{ position: 'sticky', right: 0, backgroundColor: 'var(--card-background)', zIndex: 1, boxShadow: '-2px 0 4px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => handleEditArticle(article)}
                                    style={{
                                      padding: '6px 10px',
                                      backgroundColor: '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title="Modifier l'article"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteArticle(article)}
                                    style={{
                                      padding: '6px 10px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title="Supprimer l'article (vérifiez qu'il n'a jamais été facturé)"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'clients' && (
              <div className={styles.clients}>
                <div className={styles.sectionHeader}>
                  <h2>👥 Gestion des Clients</h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => tenantInfo && loadDashboardData(tenantInfo)}
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
                      className={styles.primaryButton}
                      onClick={() => router.push('/dashboard/add-client')}
                    >
                      ➕ Ajouter un Client
                    </button>
                  </div>
                </div>

                {/* Filtres Clients */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#495057' }}>🔍 Filtres:</span>
                    </div>
                    
                    {/* Recherche clients */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
                        Recherche (Code/Raison Sociale/Contact)
                      </label>
                      <input
                        type="text"
                        placeholder="Rechercher un client..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '250px'
                        }}
                      />
                    </div>

                    {/* Filtre par statut client */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
                        Statut Client
                      </label>
                      <select
                        value={selectedClientStatus}
                        onChange={(e) => setSelectedClientStatus(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '150px'
                        }}
                      >
                        <option value="">Tous les clients</option>
                        <option value="active">✅ Clients Actifs (CA &gt; 0)</option>
                        <option value="inactive">⚠️ Clients Inactifs (CA = 0)</option>
                      </select>
                    </div>

                    {/* Bouton effacer filtres */}
                    <button
                      onClick={clearClientFilters}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '20px'
                      }}
                    >
                      🗑️ Effacer
                    </button>

                    {/* Compteur de résultats */}
                    <div style={{ 
                      marginLeft: 'auto', 
                      fontSize: '14px', 
                      color: '#495057',
                      fontWeight: 'bold',
                      marginTop: '20px'
                    }}>
                      📊 {getFilteredClients().length} / {clients.length} clients
                    </div>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Raison Sociale</th>
                        <th>Contact</th>
                        <th>Téléphone</th>
                        <th>Email</th>
                        <th>Adresse</th>
                        <th>CA Factures</th>
                        <th>CA Bons Livraison</th>
                        <th>CA Total</th>
                        <th>Statut</th>
                        <th style={{ width: '140px', minWidth: '140px', position: 'sticky', right: 0, backgroundColor: 'var(--background-secondary)', zIndex: 1 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredClients().length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            {clients.length === 0 
                              ? `Aucun client trouvé pour ${tenantInfo.schema}`
                              : 'Aucun client ne correspond aux filtres sélectionnés'
                            }
                          </td>
                        </tr>
                      ) : (
                        getFilteredClients().map((client, index) => {
                          const totalCA = (client.c_affaire_fact || 0) + (client.c_affaire_bl || 0);
                          return (
                            <tr key={`${client.nclient}-${index}`}>
                              <td style={{ fontWeight: 'bold', fontSize: '14px' }}>{client.nclient}</td>
                              <td style={{ fontWeight: 'bold', color: '#007bff', fontSize: '14px' }}>{client.raison_sociale}</td>
                              <td style={{ fontSize: '13px' }}>{client.contact_person}</td>
                              <td style={{ fontSize: '13px' }}>{client.tel}</td>
                              <td style={{ fontSize: '13px' }}>{client.email}</td>
                              <td style={{ fontSize: '13px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={client.adresse}>
                                {client.adresse}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#28a745', fontSize: '13px' }}>
                                {formatAmount(client.c_affaire_fact)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#17a2b8', fontSize: '13px' }}>
                                {formatAmount(client.c_affaire_bl)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#6f42c1', fontSize: '15px' }}>
                                {formatAmount(totalCA)}
                              </td>
                              <td>
                                <span className={
                                  totalCA > 0 ? styles.inStock : styles.lowStock
                                }>
                                  {totalCA > 0 ? '✅ Actif' : '⚠️ Inactif'}
                                </span>
                              </td>
                              <td style={{ position: 'sticky', right: 0, backgroundColor: 'var(--card-background)', zIndex: 1, boxShadow: '-2px 0 4px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => handleEditClient(client)}
                                    style={{
                                      padding: '6px 10px',
                                      backgroundColor: '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title="Modifier le client"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClient(client)}
                                    style={{
                                      padding: '6px 10px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title="Supprimer le client (vérifiez qu'il n'a aucune transaction)"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'suppliers' && (
              <div className={styles.suppliers}>
                <div className={styles.sectionHeader}>
                  <h2>🏭 Gestion des Fournisseurs</h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => tenantInfo && loadDashboardData(tenantInfo)}
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
                      className={styles.primaryButton}
                      onClick={() => router.push('/dashboard/add-supplier')}
                    >
                      ➕ Ajouter un Fournisseur
                    </button>
                  </div>
                </div>

                {/* Filtres Fournisseurs */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#495057' }}>🔍 Filtres:</span>
                    </div>
                    
                    {/* Recherche fournisseurs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
                        Recherche (Code/Nom/Responsable)
                      </label>
                      <input
                        type="text"
                        placeholder="Rechercher un fournisseur..."
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '250px'
                        }}
                      />
                    </div>

                    {/* Filtre par statut fournisseur */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'bold' }}>
                        Statut Fournisseur
                      </label>
                      <select
                        value={selectedSupplierStatus}
                        onChange={(e) => setSelectedSupplierStatus(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                          minWidth: '180px'
                        }}
                      >
                        <option value="">Tous les fournisseurs</option>
                        <option value="active">✅ Fournisseurs Actifs (CA &gt; 0)</option>
                        <option value="inactive">⚠️ Fournisseurs Inactifs (CA = 0)</option>
                      </select>
                    </div>

                    {/* Bouton effacer filtres */}
                    <button
                      onClick={clearSupplierFilters}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '20px'
                      }}
                    >
                      🗑️ Effacer
                    </button>

                    {/* Compteur de résultats */}
                    <div style={{ 
                      marginLeft: 'auto', 
                      fontSize: '14px', 
                      color: '#495057',
                      fontWeight: 'bold',
                      marginTop: '20px'
                    }}>
                      📊 {getFilteredSuppliers().length} / {suppliers.length} fournisseurs
                    </div>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Nom Fournisseur</th>
                        <th>Responsable</th>
                        <th>Adresse</th>
                        <th>Téléphone</th>
                        <th>Email</th>
                        <th>CA Factures</th>
                        <th>CA BL</th>
                        <th>CA Total</th>
                        <th>Statut</th>
                        <th style={{ width: '140px', minWidth: '140px', position: 'sticky', right: 0, backgroundColor: 'var(--background-secondary)', zIndex: 1 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredSuppliers().length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            {suppliers.length === 0 
                              ? `Aucun fournisseur trouvé pour ${tenantInfo.schema}`
                              : 'Aucun fournisseur ne correspond aux filtres sélectionnés'
                            }
                          </td>
                        </tr>
                      ) : (
                        getFilteredSuppliers().map((supplier, index) => {
                          const totalCA = (supplier.caf || 0) + (supplier.cabl || 0);
                          return (
                            <tr key={`${supplier.nfournisseur}-${index}`}>
                              <td style={{ fontWeight: 'bold' }}>{supplier.nfournisseur}</td>
                              <td style={{ fontWeight: 'bold', color: '#007bff' }}>{supplier.nom_fournisseur}</td>
                              <td>{supplier.resp_fournisseur}</td>
                              <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={supplier.adresse_fourni}>
                                {supplier.adresse_fourni}
                              </td>
                              <td>{supplier.tel}</td>
                              <td style={{ fontSize: '12px' }}>{supplier.email}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                                {formatAmount(supplier.caf)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#17a2b8' }}>
                                {formatAmount(supplier.cabl)}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#6f42c1', fontSize: '14px' }}>
                                {formatAmount(totalCA)}
                              </td>
                              <td>
                                <span className={
                                  totalCA > 0 ? styles.inStock : styles.lowStock
                                }>
                                  {totalCA > 0 ? '✅ Actif' : '⚠️ Inactif'}
                                </span>
                              </td>
                              <td style={{ position: 'sticky', right: 0, backgroundColor: 'var(--card-background)', zIndex: 1, boxShadow: '-2px 0 4px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => handleEditSupplier(supplier)}
                                    style={{
                                      padding: '6px 10px',
                                      backgroundColor: '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title="Modifier le fournisseur"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSupplier(supplier)}
                                    style={{
                                      padding: '6px 10px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title="Supprimer le fournisseur (vérifiez qu'il n'a aucun article associé)"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className={styles.sales}>
                <div className={styles.sectionHeader}>
                  <h2>💰 Gestion des Ventes</h2>
                </div>
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  <h3>Module Ventes</h3>
                  <p>Factures, bons de livraison, devis</p>
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <button 
                        onClick={() => router.push('/delivery-notes')}
                        style={{
                          margin: '5px',
                          padding: '12px 25px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        ➕ Nouveau BL
                      </button>
                      <button 
                        onClick={() => router.push('/delivery-notes/list')}
                        style={{
                          margin: '5px',
                          padding: '12px 25px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        📋 Liste BL
                      </button>
                    </div>
                    <div>
                      <button 
                        onClick={() => router.push('/invoices')}
                        style={{
                          margin: '5px',
                          padding: '12px 25px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        ➕ Nouvelle Facture
                      </button>
                      <button 
                        onClick={() => router.push('/invoices/list')}
                        style={{
                          margin: '5px',
                          padding: '12px 25px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        🧾 Liste Factures
                      </button>
                    </div>
                    <div style={{ marginTop: '15px' }}>
                      <button 
                        onClick={() => router.push('/proforma')}
                        style={{
                          margin: '5px',
                          padding: '12px 25px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        ➕ Nouvelle Proforma
                      </button>
                      <button 
                        onClick={() => router.push('/proforma/list')}
                        style={{
                          margin: '5px',
                          padding: '12px 25px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        📋 Liste Proforma
                      </button>
                    </div>
                    <div style={{ marginTop: '20px', borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
                      <button 
                        onClick={() => router.push('/sales-report')}
                        style={{
                          margin: '5px',
                          padding: '15px 30px',
                          backgroundColor: '#ffc107',
                          color: '#212529',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}
                      >
                        📊 Rapport des Ventes
                      </button>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                        BL + Factures avec filtres et calcul de marge
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className={styles.purchases}>
                <div className={styles.sectionHeader}>
                  <h2>🛒 Gestion des Achats</h2>
                </div>
                
                <div className={styles.moduleGrid}>
                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>📄</div>
                    <h3>Factures d'Achat</h3>
                    <p>Créer et gérer les factures fournisseurs</p>
                    <div className={styles.moduleActions}>
                      <button 
                        onClick={() => router.push('/purchases')}
                        className={styles.primaryButton}
                      >
                        Nouvelle Facture
                      </button>
                      <button 
                        onClick={() => router.push('/purchases/invoices/list')}
                        className={styles.secondaryButton}
                      >
                        Liste des Factures
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>📦</div>
                    <h3>Bons de Livraison</h3>
                    <p>Réceptions fournisseurs avec entrée stock BL</p>
                    <div className={styles.moduleActions}>
                      <button 
                        onClick={() => router.push('/purchases/delivery-notes')}
                        className={styles.primaryButton}
                      >
                        Nouveau BL
                      </button>
                      <button 
                        onClick={() => router.push('/purchases/delivery-notes/list')}
                        className={styles.secondaryButton}
                      >
                        Liste des BL
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>📊</div>
                    <h3>Statistiques Achats</h3>
                    <p>Analyse complète des achats, fournisseurs et tendances</p>
                    <div className={styles.moduleActions}>
                      <button 
                        onClick={() => router.push('/purchases/stats')}
                        className={styles.primaryButton}
                      >
                        Voir Statistiques
                      </button>
                    </div>
                  </div>

                  <div className={styles.moduleCard}>
                    <div className={styles.moduleIcon}>📈</div>
                    <h3>Gestion du Stock</h3>
                    <p>Vue d'ensemble, alertes, valorisation et ajustements de stock</p>
                    <div className={styles.moduleActions}>
                      <button 
                        onClick={() => router.push('/stock')}
                        className={styles.primaryButton}
                      >
                        Ouvrir Stock
                      </button>
                      <button 
                        onClick={() => router.push('/stock?tab=alerts')}
                        className={styles.secondaryButton}
                      >
                        Alertes Stock
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <h4>💡 Fonctionnalités Achats & Stock</h4>
                  <ul>
                    <li>✅ <strong>Factures d'achat</strong> - Entrée de stock automatique</li>
                    <li>✅ <strong>Gestion fournisseurs</strong> - {suppliers.length} fournisseurs disponibles</li>
                    <li>✅ <strong>Calculs automatiques</strong> - HT, TVA, TTC</li>
                    <li>✅ <strong>Bons de livraison</strong> - Entrée de stock BL automatique</li>
                    <li>✅ <strong>Statistiques complètes</strong> - Analyses et tendances détaillées</li>
                    <li>🆕 <strong>Gestion du stock</strong> - Vue d'ensemble, alertes et valorisation</li>
                    <li>🆕 <strong>Alertes automatiques</strong> - Ruptures et stock faible</li>
                    <li>🆕 <strong>Ajustements de stock</strong> - Corrections manuelles avec historique</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'stock' && (
              <div className={styles.stock}>
                <div className={styles.sectionHeader}>
                  <h2>📈 Gestion du Stock</h2>
                  <button 
                    onClick={() => router.push('/stock')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🚀 Ouvrir Gestion Stock Complète
                  </button>
                </div>

                {/* Statistiques rapides */}
                <div className={styles.stats}>
                  <div className={styles.statCard}>
                    <h3>📦 Total Articles</h3>
                    <p className={styles.statNumber}>{articles.length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>⚠️ Stock Faible</h3>
                    <p className={styles.statNumber}>{getLowStockArticles().length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>❌ Ruptures</h3>
                    <p className={styles.statNumber}>
                      {articles.filter(a => ((a.stock_f || 0) + (a.stock_bl || 0)) === 0).length}
                    </p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>💰 Valeur Stock</h3>
                    <p className={styles.statNumber}>{getTotalValue().toLocaleString('fr-FR')} DA</p>
                  </div>
                </div>

                {/* Actions rapides */}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  margin: '20px 0',
                  border: '1px solid #dee2e6'
                }}>
                  <h3 style={{ marginBottom: '15px', color: '#495057' }}>🚀 Actions Rapides</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => router.push('/stock')}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      📊 Vue d'ensemble Stock
                    </button>
                    <button 
                      onClick={() => router.push('/stock?tab=alerts')}
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
                      ⚠️ Alertes Stock
                    </button>
                    <button 
                      onClick={() => router.push('/stock?tab=valuation')}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      💰 Valorisation
                    </button>
                    <button 
                      onClick={() => router.push('/stock?tab=adjustments')}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ⚙️ Ajustements
                    </button>
                  </div>
                </div>
                
                {getLowStockArticles().length > 0 && (
                  <div>
                    <h3 style={{ color: '#dc3545' }}>⚠️ Articles sous seuil ({getLowStockArticles().length})</h3>
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Désignation</th>
                            <th>Stock Total</th>
                            <th>Stock Facture</th>
                            <th>Stock BL</th>
                            <th>Seuil</th>
                            <th>Différence</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getLowStockArticles().map((article, index) => {
                            const stockTotal = (article.stock_f || 0) + (article.stock_bl || 0);
                            const difference = stockTotal - article.seuil;
                            const isZeroStock = stockTotal === 0;
                            
                            return (
                              <tr key={`low-${article.narticle}-${index}`} style={{ 
                                backgroundColor: isZeroStock ? '#f8d7da' : '#fff3cd' 
                              }}>
                                <td style={{ fontWeight: 'bold' }}>{article.narticle}</td>
                                <td style={{ fontWeight: 'bold', color: '#007bff' }}>{article.designation}</td>
                                <td style={{ 
                                  fontWeight: 'bold', 
                                  color: isZeroStock ? '#dc3545' : '#ffc107',
                                  textAlign: 'center'
                                }}>
                                  {stockTotal}
                                </td>
                                <td style={{ textAlign: 'center' }}>{article.stock_f}</td>
                                <td style={{ textAlign: 'center' }}>{article.stock_bl}</td>
                                <td style={{ textAlign: 'center' }}>{article.seuil}</td>
                                <td style={{ 
                                  color: difference < 0 ? '#dc3545' : '#28a745', 
                                  fontWeight: 'bold',
                                  textAlign: 'center'
                                }}>
                                  {difference > 0 ? '+' : ''}{difference}
                                </td>
                                <td>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: isZeroStock ? '#dc3545' : '#ffc107',
                                    color: isZeroStock ? 'white' : '#212529'
                                  }}>
                                    {isZeroStock ? '❌ Rupture' : '⚠️ Faible'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div style={{ 
                      marginTop: '15px', 
                      textAlign: 'center',
                      padding: '15px',
                      background: '#e9ecef',
                      borderRadius: '5px'
                    }}>
                      <button 
                        onClick={() => router.push('/stock?tab=alerts')}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        🚨 Voir Toutes les Alertes Stock
                      </button>
                    </div>
                  </div>
                )}

                {getLowStockArticles().length === 0 && (
                  <div style={{
                    background: '#d4edda',
                    color: '#155724',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #c3e6cb'
                  }}>
                    <h3>✅ Stock en Bonne Santé</h3>
                    <p>Tous les articles sont au-dessus de leur seuil minimum.</p>
                    <button 
                      onClick={() => router.push('/stock')}
                      style={{
                        marginTop: '10px',
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      📊 Voir Détails du Stock
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}