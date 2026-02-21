'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import DatabaseTypeIndicator from '@/components/DatabaseTypeIndicator';
import DatabaseSelector from '@/components/DatabaseSelector';
import DatabaseSelectorCompact from '@/components/DatabaseSelectorCompact';
import ThemeToggle from '@/components/ThemeToggle';
import styles from "../page.module.css";
import dashboardStyles from "./dashboard.module.css";
import responsiveStyles from "./responsive.module.css";

// Fonction de formatage personnalisée pour les montants: "999 999.99"
const formatAmount = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
  
  // Convertir en nombre si c'est une string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '0.00';
  
  // Convertir en string avec 2 décimales
  const fixed = numAmount.toFixed(2);
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
  
  // État pour le menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  
  // États pour les filtres clients
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientStatus, setSelectedClientStatus] = useState('');
  
  // États pour le tri
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // États pour le tri des clients
  const [clientSortColumn, setClientSortColumn] = useState<string>('');
  const [clientSortDirection, setClientSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // États pour le tri des fournisseurs
  const [supplierSortColumn, setSupplierSortColumn] = useState<string>('');
  const [supplierSortDirection, setSupplierSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // États pour la pagination des articles
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // États pour la pagination des clients
  const [currentPageClients, setCurrentPageClients] = useState(1);
  const [itemsPerPageClients, setItemsPerPageClients] = useState(50);
  
  // États pour la pagination des fournisseurs
  const [currentPageSuppliers, setCurrentPageSuppliers] = useState(1);
  const [itemsPerPageSuppliers, setItemsPerPageSuppliers] = useState(50);

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

  // Fonction de tri
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, tri ascendant par défaut
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Fonction de tri pour les clients
  const handleClientSort = (column: string) => {
    if (clientSortColumn === column) {
      setClientSortDirection(clientSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setClientSortColumn(column);
      setClientSortDirection('asc');
    }
  };

  // Fonction de tri pour les fournisseurs
  const handleSupplierSort = (column: string) => {
    if (supplierSortColumn === column) {
      setSupplierSortDirection(supplierSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSupplierSortColumn(column);
      setSupplierSortDirection('asc');
    }
  };

  const getSortedArticles = (filteredArticles: Article[]) => {
    if (!sortColumn) return filteredArticles;

    console.log('🔄 Sorting by:', sortColumn, 'Direction:', sortDirection);
    
    const sorted = [...filteredArticles].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof Article];
      let bValue: any = b[sortColumn as keyof Article];

      // Colonnes numériques - forcer la conversion en nombre
      const numericColumns = ['prix_unitaire', 'marge', 'tva', 'prix_vente', 'seuil', 'stock_f', 'stock_bl'];
      if (numericColumns.includes(sortColumn)) {
        // Convertir en nombre, gérer null/undefined
        const aNum = aValue === null || aValue === undefined ? 0 : parseFloat(String(aValue).replace(/,/g, '.'));
        const bNum = bValue === null || bValue === undefined ? 0 : parseFloat(String(bValue).replace(/,/g, '.'));
        
        // Debug pour les 3 premiers éléments
        if (filteredArticles.indexOf(a) < 3) {
          console.log(`  ${sortColumn}: "${aValue}" (${typeof aValue}) → ${aNum}`);
        }
        
        const result = sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        return result;
      }

      // Gérer les valeurs nulles/undefined pour les strings
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Comparaison alphabétique pour les strings
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr, 'fr');
      } else {
        return bStr.localeCompare(aStr, 'fr');
      }
    });

    console.log('✅ Sorted', sorted.length, 'articles');
    return sorted;
  };

  const getSortedClients = (filteredClients: any[]) => {
    if (!clientSortColumn) return filteredClients;

    const sorted = [...filteredClients].sort((a, b) => {
      let aValue: any = a[clientSortColumn];
      let bValue: any = b[clientSortColumn];

      // Colonnes numériques
      const numericColumns = ['c_affaire_fact', 'c_affaire_bl'];
      if (numericColumns.includes(clientSortColumn)) {
        const aNum = aValue === null || aValue === undefined ? 0 : parseFloat(String(aValue));
        const bNum = bValue === null || bValue === undefined ? 0 : parseFloat(String(bValue));
        return clientSortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Colonnes texte
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (clientSortDirection === 'asc') {
        return aStr.localeCompare(bStr, 'fr');
      } else {
        return bStr.localeCompare(aStr, 'fr');
      }
    });

    return sorted;
  };

  const getSortedSuppliers = (filteredSuppliers: any[]) => {
    if (!supplierSortColumn) return filteredSuppliers;

    const sorted = [...filteredSuppliers].sort((a, b) => {
      let aValue: any = a[supplierSortColumn];
      let bValue: any = b[supplierSortColumn];

      // Colonnes numériques
      const numericColumns = ['caf', 'cabl'];
      if (numericColumns.includes(supplierSortColumn)) {
        const aNum = aValue === null || aValue === undefined ? 0 : parseFloat(String(aValue));
        const bNum = bValue === null || bValue === undefined ? 0 : parseFloat(String(bValue));
        return supplierSortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Colonnes texte
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (supplierSortDirection === 'asc') {
        return aStr.localeCompare(bStr, 'fr');
      } else {
        return bStr.localeCompare(aStr, 'fr');
      }
    });

    return sorted;
  };

  const getFilteredArticles = () => {
    const filtered = articles.filter(article => {
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

    return getSortedArticles(filtered);
  };
  
  // Pagination des articles
  const getPaginatedArticles = () => {
    const filtered = getFilteredArticles();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };
  
  const totalPages = Math.ceil(getFilteredArticles().length / itemsPerPage);
  
  // Réinitialiser à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFamily, selectedStatus, selectedSupplier, sortColumn, sortDirection]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFamily('');
    setSelectedStatus('');
    setSelectedSupplier('');
  };

  // Fonctions de filtrage pour les clients
  const getFilteredClients = () => {
    const filtered = clients.filter(client => {
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

    return getSortedClients(filtered);
  };

  const clearClientFilters = () => {
    setClientSearchTerm('');
    setSelectedClientStatus('');
  };
  
  // Pagination des clients
  const getPaginatedClients = () => {
    const filtered = getFilteredClients();
    const startIndex = (currentPageClients - 1) * itemsPerPageClients;
    const endIndex = startIndex + itemsPerPageClients;
    return filtered.slice(startIndex, endIndex);
  };
  
  const totalPagesClients = Math.ceil(getFilteredClients().length / itemsPerPageClients);
  
  // Réinitialiser à la page 1 quand les filtres clients changent
  useEffect(() => {
    setCurrentPageClients(1);
  }, [clientSearchTerm, selectedClientStatus, clientSortColumn, clientSortDirection]);

  // États pour les filtres fournisseurs
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [selectedSupplierStatus, setSelectedSupplierStatus] = useState('');

  // Fonctions de filtrage pour les fournisseurs
  const getFilteredSuppliers = () => {
    const filtered = suppliers.filter(supplier => {
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

    return getSortedSuppliers(filtered);
  };

  const clearSupplierFilters = () => {
    setSupplierSearchTerm('');
    setSelectedSupplierStatus('');
  };
  
  // Pagination des fournisseurs
  const getPaginatedSuppliers = () => {
    const filtered = getFilteredSuppliers();
    const startIndex = (currentPageSuppliers - 1) * itemsPerPageSuppliers;
    const endIndex = startIndex + itemsPerPageSuppliers;
    return filtered.slice(startIndex, endIndex);
  };
  
  const totalPagesSuppliers = Math.ceil(getFilteredSuppliers().length / itemsPerPageSuppliers);
  
  // Réinitialiser à la page 1 quand les filtres fournisseurs changent
  useEffect(() => {
    setCurrentPageSuppliers(1);
  }, [supplierSearchTerm, selectedSupplierStatus, supplierSortColumn, supplierSortDirection]);

  // Fonctions pour les actions sur les fournisseurs
  const handleEditSupplier = (supplier: Supplier) => {
    console.log('🔍 Editing supplier:', supplier);
    console.log('🔍 Supplier nfournisseur:', supplier.nfournisseur);
    router.push(`/dashboard/edit-supplier/${encodeURIComponent(supplier.nfournisseur)}`);
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
    // Trim whitespace from article ID to prevent URL encoding issues
    const cleanArticleId = article.narticle.trim();
    router.push(`/dashboard/edit-article/${cleanArticleId}`);
  };

  // Fonctions pour les actions sur les clients
  const handleEditClient = (client: Client) => {
    console.log('🔍 Editing client:', client);
    console.log('🔍 Client nclient:', client.nclient);
    router.push(`/dashboard/edit-client/${encodeURIComponent(client.nclient)}`);
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
      {/* Overlay mobile - Ferme la sidebar quand on clique dessus */}
      {isMobileMenuOpen && (
        <div 
          className={responsiveStyles.overlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Hamburger Button - Mobile only */}
      <button 
        className={responsiveStyles.hamburger}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar Navigation - Vertical à gauche */}
      <aside className={`${styles.sidebar} ${responsiveStyles.sidebar} ${isMobileMenuOpen ? responsiveStyles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          {/* Logo centré avec Theme Toggle compact à droite */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            marginBottom: '12px',
            position: 'relative'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📦
            </div>
            {/* Theme Toggle en position absolue à droite */}
            <div style={{
              position: 'absolute',
              right: 0,
              transform: 'scale(0.85)' /* Réduit le toggle */
            }}>
              <ThemeToggle />
            </div>
          </div>
          
          <h2 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '700',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Gestion Stock
          </h2>
          
          {/* Business Unit et Exercice */}
          {tenantInfo && (
            <div style={{
              display: 'flex',
              gap: '6px',
              width: '100%'
            }}>
              <div style={{
                flex: 1,
                padding: '6px 8px',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}>
                <span style={{ fontSize: '14px' }}>🏢</span>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: '500' }}>BU</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)' }}>
                  {tenantInfo.business_unit.toUpperCase()}
                </span>
              </div>
              
              <div style={{
                flex: 1,
                padding: '6px 8px',
                background: 'linear-gradient(135deg, #28a74515 0%, #20c99715 100%)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}>
                <span style={{ fontSize: '14px' }}>📅</span>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: '500' }}>Année</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#28a745' }}>
                  {tenantInfo.year}
                </span>
              </div>
            </div>
          )}
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={activeTab === 'dashboard' ? styles.sidebarActive : ''}
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileMenuOpen(false);
            }}
            title="Tableau de Bord"
          >
            <span className={styles.icon}>📊</span>
            <span className={styles.label}>Tableau de Bord</span>
          </button>
          <button
            className={activeTab === 'articles' ? styles.sidebarActive : ''}
            onClick={() => {
              setActiveTab('articles');
              setIsMobileMenuOpen(false);
            }}
            title="Articles"
          >
            <span className={styles.icon}>📦</span>
            <span className={styles.label}>Articles</span>
            <span className={styles.badge}>{articles.length}</span>
          </button>
          <button
            className={activeTab === 'clients' ? styles.sidebarActive : ''}
            onClick={() => {
              setActiveTab('clients');
              setIsMobileMenuOpen(false);
            }}
            title="Clients"
          >
            <span className={styles.icon}>👥</span>
            <span className={styles.label}>Clients</span>
            <span className={styles.badge}>{clients.length}</span>
          </button>
          <button
            className={activeTab === 'suppliers' ? styles.sidebarActive : ''}
            onClick={() => {
              setActiveTab('suppliers');
              setIsMobileMenuOpen(false);
            }}
            title="Fournisseurs"
          >
            <span className={styles.icon}>🏭</span>
            <span className={styles.label}>Fournisseurs</span>
            <span className={styles.badge}>{suppliers.length}</span>
          </button>
          <button
            className={activeTab === 'sales' ? styles.sidebarActive : ''}
            onClick={() => {
              setActiveTab('sales');
              setIsMobileMenuOpen(false);
            }}
            title="Ventes"
          >
            <span className={styles.icon}>💰</span>
            <span className={styles.label}>Ventes</span>
          </button>
          <button
            className={activeTab === 'purchases' ? styles.sidebarActive : ''}
            onClick={() => {
              setActiveTab('purchases');
              setIsMobileMenuOpen(false);
            }}
            title="Achats"
          >
            <span className={styles.icon}>🛒</span>
            <span className={styles.label}>Achats</span>
          </button>
          <button
            className={activeTab === 'stock' ? styles.sidebarActive : ''}
            onClick={() => {
              setActiveTab('stock');
              setIsMobileMenuOpen(false);
            }}
            title="Stock"
          >
            <span className={styles.icon}>📈</span>
            <span className={styles.label}>Stock</span>
          </button>
          <button
            className={activeTab === 'settings' ? styles.sidebarActive : ''}
            onClick={() => {
              router.push('/settings');
              setIsMobileMenuOpen(false);
            }}
            title="Réglages"
          >
            <span className={styles.icon}>⚙️</span>
            <span className={styles.label}>Réglages</span>
          </button>
          {(() => {
            try {
              const userInfo = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
              const user = userInfo ? JSON.parse(userInfo) : null;
              return user?.role === 'admin' ? (
                <button
                  className={activeTab === 'admin' ? styles.sidebarActive : ''}
                  onClick={() => {
                    router.push('/admin');
                    setIsMobileMenuOpen(false);
                  }}
                  title="Administration"
                >
                  <span className={styles.icon}>👨‍💼</span>
                  <span className={styles.label}>Administration</span>
                </button>
              ) : null;
            } catch {
              return null;
            }
          })()}
        </nav>
        
        {/* Database Selector en bas de la sidebar */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto'
        }}>
          <DatabaseSelectorCompact />
        </div>
      </aside>

      {/* Header - Réduit en haut */}
      <header className={`${styles.header} ${responsiveStyles.header}`} style={{ 
        position: 'fixed', 
        top: 0,
        left: '240px', /* Décalé pour la sidebar */
        right: 0,
        zIndex: 1000,
        background: 'var(--background)',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {/* Top Bar - Compact et professionnel */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          marginBottom: '16px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          {/* Left Section - Logo et Titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              📦
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700',
                color: 'white',
                letterSpacing: '-0.5px'
              }}>
                Gestion de Stock
              </h1>
              <div style={{ 
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.9)',
                marginTop: '2px',
                fontWeight: '500'
              }}>
                {companyInfo?.nom_entreprise || 'Système de gestion'}
              </div>
            </div>
          </div>

          {/* Right Section - User et Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* User Info */}
            {(() => {
              try {
                const userInfo = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
                const user = userInfo ? JSON.parse(userInfo) : null;
                if (user) {
                  const roleIcon = user.role === 'admin' ? '👨‍💼' : user.role === 'manager' ? '👔' : '👤';
                  const roleLabel = user.role === 'admin' ? 'Administrateur' : user.role === 'manager' ? 'Manager' : 'Utilisateur';
                  return (
                    <div style={{
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#333',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      <span style={{ fontSize: '18px' }}>{roleIcon}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{user.full_name || user.username}</span>
                        <span style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>{roleLabel}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}

            {/* Action Buttons */}
            <button 
              onClick={handleNewExercise}
              style={{
                padding: '8px 14px',
                background: 'rgba(40, 167, 69, 0.95)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              title="Créer un nouvel exercice"
            >
              ➕ Nouvel Exercice
            </button>
            <button 
              onClick={handleChangeTenant}
              style={{
                padding: '8px 14px',
                background: 'rgba(108, 117, 125, 0.95)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              title="Changer de contexte"
            >
              🔄 Changer
            </button>
            <button 
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: 'rgba(220, 53, 69, 0.95)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(200, 35, 51, 0.95)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(220, 53, 69, 0.95)';
              }}
              title="Se déconnecter du système"
            >
              <span style={{ fontSize: '16px' }}>🚪</span>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className={`${styles.main} ${responsiveStyles.main}`} style={{ marginLeft: '240px' /* Décalé pour la sidebar */ }}>
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
              <div className={`${styles.dashboard} ${responsiveStyles.dashboard}`}>
                <div className={`${styles.stats} ${responsiveStyles.stats}`}>
                  <div className={styles.statCard}>
                    <h3>📦 Total Articles</h3>
                    <p className={styles.statNumber} style={{ fontSize: '0.85rem' }}>{articles.length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>⚠️ Articles en Rupture</h3>
                    <p className={styles.statNumber} style={{ fontSize: '0.85rem' }}>{getLowStockArticles().length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>👥 Total Clients</h3>
                    <p className={styles.statNumber} style={{ fontSize: '0.85rem' }}>{clients.length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>🏭 Total Fournisseurs</h3>
                    <p className={styles.statNumber} style={{ fontSize: '0.85rem' }}>{suppliers.length}</p>
                  </div>
                  <div className={styles.statCard}>
                    <h3>💰 Valeur Totale Stock</h3>
                    <p className={styles.statNumber} style={{ fontSize: '0.85rem' }}>
                      {getTotalValue().toLocaleString('fr-FR')} <span style={{ fontSize: '0.65rem' }}>DA</span>
                    </p>
                  </div>
                </div>

                <div className={`${styles.quickActions} ${responsiveStyles.quickActions}`}>
                  <h3>Actions Rapides</h3>
                  <div className={`${styles.actions} ${responsiveStyles.actions}`}>
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
              <div className={`${styles.articles} ${responsiveStyles.articles}`}>
                <div className={`${styles.sectionHeader} ${responsiveStyles.sectionHeader}`}>
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
                      onClick={() => router.push('/articles/labels')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      🏷️ Étiquettes
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
                  {/* Bannière d'information sur le tri */}
                  <div style={{ 
                    padding: '12px 16px', 
                    marginBottom: '12px', 
                    backgroundColor: sortColumn ? 'var(--primary-color)' : 'rgba(108, 117, 125, 0.1)', 
                    color: sortColumn ? 'white' : 'var(--text-secondary)', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: sortColumn ? 'none' : '1px dashed var(--border-color)'
                  }}>
                    {sortColumn ? (
                      <>
                        <span style={{ fontSize: '18px' }}>📊</span>
                        <span>
                          Trié par: <strong>{
                            sortColumn === 'narticle' ? 'Code' :
                            sortColumn === 'designation' ? 'Désignation' :
                            sortColumn === 'famille' ? 'Famille' :
                            sortColumn === 'nfournisseur' ? 'Fournisseur' :
                            sortColumn === 'prix_unitaire' ? 'Prix Unitaire' :
                            sortColumn === 'marge' ? 'Marge %' :
                            sortColumn === 'prix_vente' ? 'Prix Vente' :
                            sortColumn === 'stock_f' ? 'Stock F' :
                            sortColumn === 'stock_bl' ? 'Stock BL' :
                            sortColumn === 'seuil' ? 'Seuil' : sortColumn
                          }</strong> ({sortDirection === 'asc' ? 'Croissant ↑' : 'Décroissant ↓'})
                        </span>
                        <button 
                          onClick={() => { setSortColumn(''); setSortDirection('asc'); }}
                          style={{ 
                            marginLeft: 'auto',
                            padding: '4px 12px', 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                        >
                          ✕ Réinitialiser le tri
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '18px' }}>💡</span>
                        <span>
                          Cliquez sur n'importe quel en-tête de colonne pour trier le tableau. 
                          Cliquez à nouveau pour inverser l'ordre.
                        </span>
                      </>
                    )}
                  </div>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th 
                          style={{ 
                            width: '100px', 
                            maxWidth: '100px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'narticle' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'narticle' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('narticle')}
                          title="Cliquez pour trier par Code"
                        >
                          Code {sortColumn === 'narticle' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ 
                            width: '300px', 
                            maxWidth: '300px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'designation' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'designation' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('designation')}
                          title="Cliquez pour trier par Désignation"
                        >
                          Désignation {sortColumn === 'designation' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ 
                            width: '100px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'famille' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'famille' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('famille')}
                          title="Cliquez pour trier par Famille"
                        >
                          Famille {sortColumn === 'famille' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ 
                            width: '120px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'nfournisseur' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'nfournisseur' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('nfournisseur')}
                          title="Cliquez pour trier par Fournisseur"
                        >
                          Fournisseur {sortColumn === 'nfournisseur' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ 
                            width: '90px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'prix_unitaire' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'prix_unitaire' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('prix_unitaire')}
                          title="Cliquez pour trier par Prix Unitaire"
                        >
                          Prix Unit. {sortColumn === 'prix_unitaire' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ 
                            width: '70px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'marge' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'marge' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('marge')}
                          title="Cliquez pour trier par Marge %"
                        >
                          Marge % {sortColumn === 'marge' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ 
                            width: '90px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'prix_vente' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'prix_vente' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('prix_vente')}
                          title="Cliquez pour trier par Prix de Vente"
                        >
                          Prix Vente {sortColumn === 'prix_vente' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ 
                            width: '70px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'stock_f' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'stock_f' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('stock_f')}
                          title="Cliquez pour trier par Stock F"
                        >
                          Stock F {sortColumn === 'stock_f' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ 
                            width: '70px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'stock_bl' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'stock_bl' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('stock_bl')}
                          title="Cliquez pour trier par Stock BL"
                        >
                          Stock BL {sortColumn === 'stock_bl' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ width: '90px' }}>
                          Stock Total
                        </th>
                        <th 
                          style={{ 
                            width: '60px', 
                            cursor: 'pointer',
                            backgroundColor: sortColumn === 'seuil' ? 'var(--primary-color)' : undefined,
                            color: sortColumn === 'seuil' ? 'white' : undefined,
                            userSelect: 'none'
                          }} 
                          onClick={() => handleSort('seuil')}
                          title="Cliquez pour trier par Seuil"
                        >
                          Seuil {sortColumn === 'seuil' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ width: '80px' }}>Statut</th>
                        <th style={{ width: '100px', minWidth: '100px', position: 'sticky', right: 0, backgroundColor: 'var(--background-secondary)', zIndex: 1 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedArticles().length === 0 ? (
                        <tr>
                          <td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            {articles.length === 0 
                              ? `Aucun article trouvé pour ${tenantInfo.schema}`
                              : 'Aucun article ne correspond aux filtres sélectionnés'
                            }
                          </td>
                        </tr>
                      ) : (
                        getPaginatedArticles().map((article, index) => {
                          const stockTotal = (article.stock_f || 0) + (article.stock_bl || 0);
                          const isLowStock = stockTotal <= article.seuil;
                          const isZeroStock = stockTotal === 0;
                          const supplierName = suppliers.find(s => s.nfournisseur === article.nfournisseur)?.nom_fournisseur || article.nfournisseur || '-';
                          
                          return (
                            <tr key={`${article.narticle}-${index}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', width: '100px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.narticle}</td>
                              <td style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', color: '#007bff', width: '300px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={article.designation}>
                                {article.designation}
                              </td>
                              <td style={{ padding: '6px 12px', fontSize: '12px', width: '100px' }}>{article.famille}</td>
                              <td style={{ padding: '6px 12px', fontSize: '11px', width: '120px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={supplierName}>
                                {supplierName}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '12px' }}>
                                {formatAmount(article.prix_unitaire)}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'center', fontSize: '12px' }}>
                                {article.marge}%
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#28a745' }}>
                                {formatAmount(article.prix_vente)}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{article.stock_f}</td>
                              <td style={{ padding: '6px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{article.stock_bl}</td>
                              <td style={{ padding: '6px 12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: isZeroStock ? '#dc3545' : isLowStock ? '#ffc107' : '#28a745' }}>
                                {stockTotal}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'center', fontSize: '12px' }}>{article.seuil}</td>
                              <td style={{ padding: '6px 12px' }}>
                                <span className={
                                  isZeroStock ? styles.zeroStock : 
                                  isLowStock ? styles.lowStock : styles.inStock
                                }>
                                  {isZeroStock ? '❌ Rupture' : 
                                   isLowStock ? '⚠️ Faible' : '✅ OK'}
                                </span>
                              </td>
                              <td style={{ position: 'sticky', right: 0, backgroundColor: 'var(--card-background)', zIndex: 1, boxShadow: '-2px 0 4px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => handleEditArticle(article)}
                                    style={{
                                      padding: '4px 8px',
                                      backgroundColor: '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
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
                                      padding: '4px 8px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
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
                  
                  {/* Pagination */}
                  {getFilteredArticles().length > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      padding: '16px',
                      backgroundColor: 'var(--card-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, getFilteredArticles().length)} sur {getFilteredArticles().length} articles
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Par page:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              backgroundColor: 'var(--card-background)',
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: currentPage === 1 ? 'var(--background-secondary)' : 'var(--primary-color)',
                              color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            ⏮️
                          </button>
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: currentPage === 1 ? 'var(--background-secondary)' : 'var(--primary-color)',
                              color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            ◀️
                          </button>
                          
                          <div style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--primary-color)',
                            color: 'var(--text-inverse)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            minWidth: '100px',
                            textAlign: 'center'
                          }}>
                            {currentPage} / {totalPages}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: currentPage === totalPages ? 'var(--background-secondary)' : 'var(--primary-color)',
                              color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-inverse)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            ▶️
                          </button>
                          
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: currentPage === totalPages ? 'var(--background-secondary)' : 'var(--primary-color)',
                              color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-inverse)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          >
                            ⏭️
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: clientSortColumn === 'nclient' ? 'var(--primary-color)' : undefined, color: clientSortColumn === 'nclient' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleClientSort('nclient')}
                          title="Cliquez pour trier par Code"
                        >
                          Code {clientSortColumn === 'nclient' && (clientSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: clientSortColumn === 'raison_sociale' ? 'var(--primary-color)' : undefined, color: clientSortColumn === 'raison_sociale' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleClientSort('raison_sociale')}
                          title="Cliquez pour trier par Raison Sociale"
                        >
                          Raison Sociale {clientSortColumn === 'raison_sociale' && (clientSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: clientSortColumn === 'contact_person' ? 'var(--primary-color)' : undefined, color: clientSortColumn === 'contact_person' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleClientSort('contact_person')}
                          title="Cliquez pour trier par Contact"
                        >
                          Contact {clientSortColumn === 'contact_person' && (clientSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: clientSortColumn === 'tel' ? 'var(--primary-color)' : undefined, color: clientSortColumn === 'tel' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleClientSort('tel')}
                          title="Cliquez pour trier par Téléphone"
                        >
                          Téléphone {clientSortColumn === 'tel' && (clientSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: clientSortColumn === 'email' ? 'var(--primary-color)' : undefined, color: clientSortColumn === 'email' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleClientSort('email')}
                          title="Cliquez pour trier par Email"
                        >
                          Email {clientSortColumn === 'email' && (clientSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: clientSortColumn === 'adresse' ? 'var(--primary-color)' : undefined, color: clientSortColumn === 'adresse' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleClientSort('adresse')}
                          title="Cliquez pour trier par Adresse"
                        >
                          Adresse {clientSortColumn === 'adresse' && (clientSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: clientSortColumn === 'c_affaire_fact' ? 'var(--primary-color)' : undefined, color: clientSortColumn === 'c_affaire_fact' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleClientSort('c_affaire_fact')}
                          title="Cliquez pour trier par CA Factures"
                        >
                          CA Factures {clientSortColumn === 'c_affaire_fact' && (clientSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: clientSortColumn === 'c_affaire_bl' ? 'var(--primary-color)' : undefined, color: clientSortColumn === 'c_affaire_bl' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleClientSort('c_affaire_bl')}
                          title="Cliquez pour trier par CA Bons Livraison"
                        >
                          CA Bons Livraison {clientSortColumn === 'c_affaire_bl' && (clientSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th>CA Total</th>
                        <th>Statut</th>
                        <th style={{ width: '140px', minWidth: '140px', position: 'sticky', right: 0, backgroundColor: 'var(--background-secondary)', zIndex: 1 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedClients().length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            {clients.length === 0 
                              ? `Aucun client trouvé pour ${tenantInfo.schema}`
                              : 'Aucun client ne correspond aux filtres sélectionnés'
                            }
                          </td>
                        </tr>
                      ) : (
                        getPaginatedClients().map((client, index) => {
                          const totalCA = (client.c_affaire_fact || 0) + (client.c_affaire_bl || 0);
                          return (
                            <tr key={`${client.nclient}-${index}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}>{client.nclient}</td>
                              <td style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', color: '#007bff' }}>{client.raison_sociale}</td>
                              <td style={{ padding: '6px 12px', fontSize: '12px' }}>{client.contact_person}</td>
                              <td style={{ padding: '6px 12px', fontSize: '12px' }}>{client.tel}</td>
                              <td style={{ padding: '6px 12px', fontSize: '12px' }}>{client.email}</td>
                              <td style={{ padding: '6px 12px', fontSize: '12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={client.adresse}>
                                {client.adresse}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>
                                {formatAmount(client.c_affaire_fact)}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#17a2b8' }}>
                                {formatAmount(client.c_affaire_bl)}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#6f42c1' }}>
                                {formatAmount(totalCA)}
                              </td>
                              <td style={{ padding: '6px 12px' }}>
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
                  
                  {/* Pagination Clients */}
                  {getFilteredClients().length > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      padding: '16px',
                      backgroundColor: 'var(--card-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Affichage de {((currentPageClients - 1) * itemsPerPageClients) + 1} à {Math.min(currentPageClients * itemsPerPageClients, getFilteredClients().length)} sur {getFilteredClients().length} clients
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Par page:</span>
                          <select
                            value={itemsPerPageClients}
                            onChange={(e) => {
                              setItemsPerPageClients(Number(e.target.value));
                              setCurrentPageClients(1);
                            }}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              backgroundColor: 'var(--card-background)',
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setCurrentPageClients(1)} disabled={currentPageClients === 1} style={{ padding: '8px 12px', backgroundColor: currentPageClients === 1 ? 'var(--background-secondary)' : 'var(--primary-color)', color: currentPageClients === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: currentPageClients === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>⏮️</button>
                          <button onClick={() => setCurrentPageClients(prev => Math.max(1, prev - 1))} disabled={currentPageClients === 1} style={{ padding: '8px 12px', backgroundColor: currentPageClients === 1 ? 'var(--background-secondary)' : 'var(--primary-color)', color: currentPageClients === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: currentPageClients === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>◀️</button>
                          <div style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'var(--text-inverse)', borderRadius: '6px', fontSize: '14px', fontWeight: '600', minWidth: '100px', textAlign: 'center' }}>{currentPageClients} / {totalPagesClients}</div>
                          <button onClick={() => setCurrentPageClients(prev => Math.min(totalPagesClients, prev + 1))} disabled={currentPageClients === totalPagesClients} style={{ padding: '8px 12px', backgroundColor: currentPageClients === totalPagesClients ? 'var(--background-secondary)' : 'var(--primary-color)', color: currentPageClients === totalPagesClients ? 'var(--text-secondary)' : 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: currentPageClients === totalPagesClients ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>▶️</button>
                          <button onClick={() => setCurrentPageClients(totalPagesClients)} disabled={currentPageClients === totalPagesClients} style={{ padding: '8px 12px', backgroundColor: currentPageClients === totalPagesClients ? 'var(--background-secondary)' : 'var(--primary-color)', color: currentPageClients === totalPagesClients ? 'var(--text-secondary)' : 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: currentPageClients === totalPagesClients ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>⏭️</button>
                        </div>
                      </div>
                    </div>
                  )}
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
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: supplierSortColumn === 'nfournisseur' ? 'var(--primary-color)' : undefined, color: supplierSortColumn === 'nfournisseur' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleSupplierSort('nfournisseur')}
                          title="Cliquez pour trier par Code"
                        >
                          Code {supplierSortColumn === 'nfournisseur' && (supplierSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: supplierSortColumn === 'nom_fournisseur' ? 'var(--primary-color)' : undefined, color: supplierSortColumn === 'nom_fournisseur' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleSupplierSort('nom_fournisseur')}
                          title="Cliquez pour trier par Nom Fournisseur"
                        >
                          Nom Fournisseur {supplierSortColumn === 'nom_fournisseur' && (supplierSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: supplierSortColumn === 'resp_fournisseur' ? 'var(--primary-color)' : undefined, color: supplierSortColumn === 'resp_fournisseur' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleSupplierSort('resp_fournisseur')}
                          title="Cliquez pour trier par Responsable"
                        >
                          Responsable {supplierSortColumn === 'resp_fournisseur' && (supplierSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: supplierSortColumn === 'adresse_fourni' ? 'var(--primary-color)' : undefined, color: supplierSortColumn === 'adresse_fourni' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleSupplierSort('adresse_fourni')}
                          title="Cliquez pour trier par Adresse"
                        >
                          Adresse {supplierSortColumn === 'adresse_fourni' && (supplierSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: supplierSortColumn === 'tel' ? 'var(--primary-color)' : undefined, color: supplierSortColumn === 'tel' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleSupplierSort('tel')}
                          title="Cliquez pour trier par Téléphone"
                        >
                          Téléphone {supplierSortColumn === 'tel' && (supplierSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: supplierSortColumn === 'email' ? 'var(--primary-color)' : undefined, color: supplierSortColumn === 'email' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleSupplierSort('email')}
                          title="Cliquez pour trier par Email"
                        >
                          Email {supplierSortColumn === 'email' && (supplierSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: supplierSortColumn === 'caf' ? 'var(--primary-color)' : undefined, color: supplierSortColumn === 'caf' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleSupplierSort('caf')}
                          title="Cliquez pour trier par CA Factures"
                        >
                          CA Factures {supplierSortColumn === 'caf' && (supplierSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', backgroundColor: supplierSortColumn === 'cabl' ? 'var(--primary-color)' : undefined, color: supplierSortColumn === 'cabl' ? 'white' : undefined, userSelect: 'none' }}
                          onClick={() => handleSupplierSort('cabl')}
                          title="Cliquez pour trier par CA BL"
                        >
                          CA BL {supplierSortColumn === 'cabl' && (supplierSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th>CA Total</th>
                        <th>Statut</th>
                        <th style={{ width: '140px', minWidth: '140px', position: 'sticky', right: 0, backgroundColor: 'var(--background-secondary)', zIndex: 1 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedSuppliers().length === 0 ? (
                        <tr>
                          <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            {suppliers.length === 0 
                              ? `Aucun fournisseur trouvé pour ${tenantInfo.schema}`
                              : 'Aucun fournisseur ne correspond aux filtres sélectionnés'
                            }
                          </td>
                        </tr>
                      ) : (
                        getPaginatedSuppliers().map((supplier, index) => {
                          const totalCA = (supplier.caf || 0) + (supplier.cabl || 0);
                          return (
                            <tr key={`${supplier.nfournisseur}-${index}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}>{supplier.nfournisseur}</td>
                              <td style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', color: '#007bff' }}>{supplier.nom_fournisseur}</td>
                              <td style={{ padding: '6px 12px', fontSize: '12px' }}>{supplier.resp_fournisseur}</td>
                              <td style={{ padding: '6px 12px', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={supplier.adresse_fourni}>
                                {supplier.adresse_fourni}
                              </td>
                              <td style={{ padding: '6px 12px', fontSize: '12px' }}>{supplier.tel}</td>
                              <td style={{ padding: '6px 12px', fontSize: '12px' }}>{supplier.email}</td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>
                                {formatAmount(supplier.caf)}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#17a2b8' }}>
                                {formatAmount(supplier.cabl)}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#6f42c1' }}>
                                {formatAmount(totalCA)}
                              </td>
                              <td style={{ padding: '6px 12px' }}>
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
                  
                  {/* Pagination Fournisseurs */}
                  {getFilteredSuppliers().length > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      padding: '16px',
                      backgroundColor: 'var(--card-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Affichage de {((currentPageSuppliers - 1) * itemsPerPageSuppliers) + 1} à {Math.min(currentPageSuppliers * itemsPerPageSuppliers, getFilteredSuppliers().length)} sur {getFilteredSuppliers().length} fournisseurs
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Par page:</span>
                          <select
                            value={itemsPerPageSuppliers}
                            onChange={(e) => {
                              setItemsPerPageSuppliers(Number(e.target.value));
                              setCurrentPageSuppliers(1);
                            }}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              backgroundColor: 'var(--card-background)',
                              color: 'var(--text-primary)',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setCurrentPageSuppliers(1)} disabled={currentPageSuppliers === 1} style={{ padding: '8px 12px', backgroundColor: currentPageSuppliers === 1 ? 'var(--background-secondary)' : 'var(--primary-color)', color: currentPageSuppliers === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: currentPageSuppliers === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>⏮️</button>
                          <button onClick={() => setCurrentPageSuppliers(prev => Math.max(1, prev - 1))} disabled={currentPageSuppliers === 1} style={{ padding: '8px 12px', backgroundColor: currentPageSuppliers === 1 ? 'var(--background-secondary)' : 'var(--primary-color)', color: currentPageSuppliers === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: currentPageSuppliers === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>◀️</button>
                          <div style={{ padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'var(--text-inverse)', borderRadius: '6px', fontSize: '14px', fontWeight: '600', minWidth: '100px', textAlign: 'center' }}>{currentPageSuppliers} / {totalPagesSuppliers}</div>
                          <button onClick={() => setCurrentPageSuppliers(prev => Math.min(totalPagesSuppliers, prev + 1))} disabled={currentPageSuppliers === totalPagesSuppliers} style={{ padding: '8px 12px', backgroundColor: currentPageSuppliers === totalPagesSuppliers ? 'var(--background-secondary)' : 'var(--primary-color)', color: currentPageSuppliers === totalPagesSuppliers ? 'var(--text-secondary)' : 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: currentPageSuppliers === totalPagesSuppliers ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>▶️</button>
                          <button onClick={() => setCurrentPageSuppliers(totalPagesSuppliers)} disabled={currentPageSuppliers === totalPagesSuppliers} style={{ padding: '8px 12px', backgroundColor: currentPageSuppliers === totalPagesSuppliers ? 'var(--background-secondary)' : 'var(--primary-color)', color: currentPageSuppliers === totalPagesSuppliers ? 'var(--text-secondary)' : 'var(--text-inverse)', border: 'none', borderRadius: '6px', cursor: currentPageSuppliers === totalPagesSuppliers ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>⏭️</button>
                        </div>
                      </div>
                    </div>
                  )}
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
                                backgroundColor: isZeroStock ? 'var(--error-color-light)' : 'var(--warning-color-light)'
                              }}>
                                <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{article.narticle}</td>
                                <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{article.designation}</td>
                                <td style={{ 
                                  fontWeight: 'bold', 
                                  color: isZeroStock ? 'var(--error-color)' : 'var(--warning-color)',
                                  textAlign: 'center'
                                }}>
                                  {stockTotal}
                                </td>
                                <td style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{article.stock_f}</td>
                                <td style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{article.stock_bl}</td>
                                <td style={{ textAlign: 'center', color: 'var(--text-primary)' }}>{article.seuil}</td>
                                <td style={{ 
                                  color: difference < 0 ? 'var(--error-color)' : 'var(--success-color)', 
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
                                    backgroundColor: isZeroStock ? 'var(--error-color)' : 'var(--warning-color)',
                                    color: 'white'
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