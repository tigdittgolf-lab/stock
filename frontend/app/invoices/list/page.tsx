'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from '../../../components/PrintOptions';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import InvoiceActions from '../../../components/InvoiceActions';

interface Invoice {
  nfact: number;
  client_name: string;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  created_at: string;
}

export default function InvoicesList() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'all' | 'paid' | 'partially_paid'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // État pour stocker les statuts de paiement
  const [paymentStatuses, setPaymentStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    // Détecter si on est sur mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Récupérer le tenant depuis localStorage
    const tenantInfo = localStorage.getItem('tenant_info');
    if (!tenantInfo) {
      router.push('/login');
      return;
    }

    try {
      const tenant = JSON.parse(tenantInfo);
      setTenant(tenant.schema);
      loadInvoices(tenant.schema);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router]);

  const loadInvoices = async (tenantSchema: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sales/invoices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantSchema
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const invoices = data.data || [];
        setInvoices(invoices);
        setFilteredInvoices(invoices);
        
        // Charger les statuts de paiement de manière optimisée
        const dbConfig = localStorage.getItem('activeDbConfig');
        const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
        loadPaymentStatusesOptimized(invoices, tenantSchema, dbType);
      } else {
        throw new Error(data.error || 'Failed to load invoices');
      }
    } catch (error) {
      console.error('❌ Error loading invoices:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // UNE SEULE requête pour tous les statuts — remplace les N requêtes individuelles
  const loadPaymentStatusesOptimized = async (invoices: Invoice[], tenantSchema: string, dbType: string) => {
    try {
      const response = await fetch('/api/sales/payments/summary', {
        headers: { 'X-Tenant': tenantSchema, 'X-Database-Type': dbType }
      });
      const data = await response.json();
      const payMap: Record<string, number> = data.success ? (data.data || {}) : {};

      const statuses: Record<number, string> = {};
      for (const invoice of invoices) {
        const paid = payMap[`invoice::${invoice.nfact}`] || 0;
        const total = typeof invoice.montant_ttc === 'string'
          ? parseFloat(invoice.montant_ttc)
          : (invoice.montant_ttc || invoice.montant_ht + invoice.tva);
        const balance = total - paid;
        if (Math.abs(balance) < 0.01) statuses[invoice.nfact] = 'paid';
        else if (paid > 0 && balance > 0) statuses[invoice.nfact] = 'partially_paid';
        else if (paid > total) statuses[invoice.nfact] = 'overpaid';
        else statuses[invoice.nfact] = 'unpaid';
      }
      setPaymentStatuses(statuses);
    } catch (error) {
      console.error('Error loading payment statuses:', error);
    }
  };

  // Wrapper non-bloquant
  const loadPaymentStatusesInBackground = async (invoices: Invoice[], tenantSchema: string) => {
    const dbConfig = localStorage.getItem('activeDbConfig');
    const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
    await loadPaymentStatusesOptimized(invoices, tenantSchema, dbType);
  };

  // Fonction de filtrage
  const applyFilters = useCallback(() => {
    let filtered = [...invoices];

    // Filtre par terme de recherche (numéro facture, client)
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.nclient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(invoice.nfact || '').includes(searchTerm)
      );
    }

    // Filtre par client spécifique
    if (selectedClient) {
      filtered = filtered.filter(invoice => invoice.client_name === selectedClient);
    }

    // Filtre par date
    if (dateFrom) {
      filtered = filtered.filter(invoice => new Date(invoice.date_fact) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(invoice => new Date(invoice.date_fact) <= new Date(dateTo));
    }

    // Filtre par montant
    if (minAmount) {
      filtered = filtered.filter(invoice => invoice.montant_ttc >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(invoice => invoice.montant_ttc <= parseFloat(maxAmount));
    }

    // Filtre par statut de paiement
    if (paymentStatus !== 'all') {
      filtered = filtered.filter(invoice => {
        const status = paymentStatuses[invoice.nfact];
        if (paymentStatus === 'paid') {
          return status === 'paid';
        } else if (paymentStatus === 'partially_paid') {
          return status === 'partially_paid';
        }
        return true;
      });
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, selectedClient, dateFrom, dateTo, minAmount, maxAmount, paymentStatus, paymentStatuses]);

  // Effet pour appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedClient('');
    setPaymentStatus('all');
  };

  // Obtenir la liste unique des clients pour le filtre
  const uniqueClients = [...new Set(invoices.map(invoice => invoice.client_name))].filter(Boolean).sort();

  const openPDFPreview = (factId: number, type: 'invoice') => {
    console.log(`🔍 PDF Preview - ID: ${factId}, Type: ${type}`);
    
    if (!factId || isNaN(factId) || factId <= 0) {
      console.error(`🚨 Invalid Invoice ID: ${factId}`);
      alert(`Erreur: ID Facture invalide: ${factId}`);
      return;
    }

    const urls = {
      invoice: `/api/pdf/invoice/${factId}`
    };

    const pdfUrl = urls[type];
    console.log(`📄 Opening PDF URL: ${pdfUrl}`);
    
    // Solution SIMPLE: Ouvrir directement l'URL dans un nouvel onglet
    window.open(pdfUrl, '_blank');
  };

  const handlePrintPDF = (factId: number) => {
    openPDFPreview(factId, 'invoice');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';
  };

  // Version mobile avec cartes
  const MobileView = () => (
    <div style={{ padding: '10px' }}>
      {filteredInvoices.map((fact, index) => (
        <div 
          key={fact.nfact || index}
          style={{
            background: 'white',
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}
        >
          {/* En-tête Facture */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#28a745'
            }}>
              🧾 Facture {fact.nfact}
            </div>
            <button
              onClick={() => {
                console.log(`📄 PDF Invoice - ID: ${fact.nfact}`);
                openPDFPreview(fact.nfact, 'invoice');
              }}
              style={{
                padding: '8px 15px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              📄 PDF
            </button>
          </div>

          {/* Informations client */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '4px'
            }}>
              👤 {fact.client_name || 'Client'}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666'
            }}>
              Code client: {fact.nclient}
            </div>
          </div>

          {/* Date */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{
              fontSize: '14px',
              color: '#666',
              marginRight: '8px'
            }}>
              📅
            </span>
            <span style={{ fontSize: '14px', color: '#333' }}>
              {formatDate(fact.date_fact)}
            </span>
          </div>

          {/* Montants */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Montant HT:</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {formatAmount(fact.montant_ht)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>TVA:</span>
              <span style={{ fontSize: '14px' }}>
                {formatAmount(fact.tva)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '6px',
              borderTop: '1px solid #dee2e6'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                Total TTC:
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                {formatAmount(fact.montant_ttc || (fact.montant_ht + fact.tva))}
              </span>
            </div>
          </div>

          {/* Actions - Première ligne: Actions principales */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '8px'
          }}>
            <button
              onClick={() => {
                router.push(`/invoices/details/${fact.nfact}`);
              }}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '10px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              👁️ Voir Détails
            </button>
            
            <button
              onClick={() => {
                router.push(`/invoices/${fact.nfact}/edit`);
              }}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              ✏️ Modifier
            </button>
            
            <button
              onClick={() => {
                if (confirm(`Êtes-vous sûr de vouloir supprimer la facture ${fact.nfact} ?`)) {
                  alert('Fonction de suppression à implémenter');
                }
              }}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              🗑️ Supprimer
            </button>
          </div>
          
          {/* Actions - Deuxième ligne: Gestion des paiements */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '8px'
          }}>
            <button
              onClick={() => {
                router.push(`/payments/add?type=invoice&id=${fact.nfact}`);
              }}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              💰 Ajouter Paiement
            </button>
            
            <button
              onClick={() => {
                router.push(`/payments/history?type=invoice&id=${fact.nfact}`);
              }}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '10px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              📜 Historique
            </button>
          </div>
          
          {/* Actions - Troisième ligne: Options d'impression */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '8px'
          }}>
            <button
              onClick={() => {
                console.log(`📄 PDF Invoice - ID: ${fact.nfact}`);
                openPDFPreview(fact.nfact, 'invoice');
              }}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              📄 Imprimer Facture
            </button>
            
            {/* WhatsApp Button */}
            <div style={{ flex: 1 }}>
              <PrintOptions
                documentType="invoice"
                documentId={fact.nfact}
                documentNumber={fact.nfact}
                clientName={fact.client_name}
                clientId={fact.nclient}
                isModal={false}
                whatsappOnly={true}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Version desktop avec tableau
  const DesktopView = () => (
    <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>N° Facture</th>
            <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Client</th>
            <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
            <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Montant HT</th>
            <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>TVA</th>
            <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Total TTC</th>
            <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', minWidth: '180px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.map((fact, index) => (
            <tr 
              key={fact.nfact || index}
              style={{ 
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: index % 2 === 0 ? 'var(--card-background)' : 'var(--background-secondary)'
              }}
            >
              <td style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {fact.nfact}
              </td>
              <td style={{ padding: '6px 12px', fontSize: '13px' }}>
                <div style={{ lineHeight: '1.3' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{fact.client_name || 'Client'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Code: {fact.nclient}</div>
                </div>
              </td>
              <td style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-primary)' }}>
                {formatDate(fact.date_fact)}
              </td>
              <td style={{ padding: '6px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {formatAmount(fact.montant_ht)}
              </td>
              <td style={{ padding: '6px 12px', fontSize: '13px', textAlign: 'right', color: 'var(--text-primary)' }}>
                {formatAmount(fact.tva)}
              </td>
              <td style={{ padding: '6px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 'bold', color: 'var(--success-color)' }}>
                {formatAmount(fact.montant_ttc || (fact.montant_ht + fact.tva))}
              </td>
              <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                <InvoiceActions
                  invoiceId={fact.nfact}
                  clientName={fact.client_name}
                  onOpenPDF={openPDFPreview}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px', 
      maxWidth: isMobile ? '100%' : '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: isMobile ? 'var(--background-secondary)' : 'var(--background)'
    }}>
      {/* En-tête responsive */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        marginBottom: '20px',
        background: 'var(--card-background)',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '10px',
        boxShadow: isMobile ? 'var(--shadow-md)' : 'none',
        borderBottom: isMobile ? 'none' : '2px solid var(--border-color)'
      }}>
        <div style={{ marginBottom: isMobile ? '15px' : '0' }}>
          <h1 style={{ 
            margin: 0, 
            color: 'var(--text-primary)',
            fontSize: isMobile ? '20px' : '28px'
          }}>
            🧾 Liste des Factures
          </h1>
          <p style={{ 
            margin: '5px 0 0 0', 
            color: 'var(--text-secondary)',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            {isMobile ? `${filteredInvoices.length} factures` : `Tenant: ${tenant} • ${filteredInvoices.length} factures trouvées`}
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={() => router.push('/invoices')}
            style={{
              padding: isMobile ? '12px 20px' : '10px 20px',
              backgroundColor: 'var(--success-color)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '14px',
              fontWeight: 'bold'
            }}
          >
            ➕ Nouvelle Facture
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: isMobile ? '12px 20px' : '10px 20px',
              backgroundColor: 'var(--text-secondary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '14px',
              fontWeight: 'bold'
            }}
          >
            ← Retour Dashboard
          </button>
        </div>
      </div>

      {/* Interface de filtres */}
      <div style={{
        background: 'var(--card-background)',
        borderRadius: '10px',
        padding: isMobile ? '15px' : '20px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Bouton pour afficher/masquer les filtres */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: showFilters ? '20px' : '0'
        }}>
          <h3 style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: isMobile ? '16px' : '18px'
          }}>
            🔍 Filtres de recherche
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 16px',
              backgroundColor: showFilters ? 'var(--error-color)' : 'var(--success-color)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {showFilters ? '🔼 Masquer' : '🔽 Afficher'}
          </button>
        </div>

        {showFilters && (
          <div>
            {/* Barre de recherche principale */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '15px',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <input
                type="text"
                placeholder="🔍 Rechercher par N° facture, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'var(--background)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={resetFilters}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--text-secondary)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  minWidth: isMobile ? 'auto' : '120px'
                }}
              >
                🔄 Réinitialiser
              </button>
            </div>

            {/* Filtres avancés */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '15px'
            }}>
              {/* Filtre par client */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  👤 Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--background)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">Tous les clients</option>
                  {uniqueClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>

              {/* Filtre par statut de paiement */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  💰 Statut de paiement
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--background)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">Tous (payés + partiellement payés + non payés)</option>
                  <option value="paid">🟢 Payés totalement</option>
                  <option value="partially_paid">🟡 Partiellement payés</option>
                </select>
              </div>

              {/* Filtre par date de début */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  📅 Date de début
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--background)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Filtre par date de fin */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  📅 Date de fin
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--background)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Filtre par montant minimum */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  💰 Montant min (DA)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--background)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Filtre par montant maximum */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  💰 Montant max (DA)
                </label>
                <input
                  type="number"
                  placeholder="∞"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--background)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Résumé des filtres actifs */}
            {(searchTerm || selectedClient || dateFrom || dateTo || minAmount || maxAmount || paymentStatus !== 'all') && (
              <div style={{
                background: '#e8f5e8',
                border: '1px solid #b3e5b3',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '14px'
              }}>
                <strong>🎯 Filtres actifs :</strong>
                {searchTerm && <span style={{ marginLeft: '10px', background: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Recherche: "{searchTerm}"</span>}
                {selectedClient && <span style={{ marginLeft: '10px', background: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Client: {selectedClient}</span>}
                {paymentStatus !== 'all' && <span style={{ marginLeft: '10px', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                  {paymentStatus === 'paid' && '🟢 Payés totalement'}
                  {paymentStatus === 'partially_paid' && '🟡 Partiellement payés'}
                </span>}
                {dateFrom && <span style={{ marginLeft: '10px', background: '#17a2b8', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Depuis: {dateFrom}</span>}
                {dateTo && <span style={{ marginLeft: '10px', background: '#17a2b8', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Jusqu'à: {dateTo}</span>}
                {minAmount && <span style={{ marginLeft: '10px', background: '#ffc107', color: 'black', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Min: {minAmount} DA</span>}
                {maxAmount && <span style={{ marginLeft: '10px', background: '#ffc107', color: 'black', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Max: {maxAmount} DA</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <LoadingSpinner message="Chargement des factures..." />
      )}

      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => tenant && loadInvoices(tenant)} 
        />
      )}

      {!loading && !error && filteredInvoices.length === 0 && invoices.length > 0 && (
        <EmptyState
          icon="🔍"
          title="Aucun résultat trouvé"
          message="Aucune facture ne correspond aux critères de recherche."
          actionLabel="🔄 Réinitialiser les filtres"
          onAction={resetFilters}
        />
      )}

      {!loading && !error && invoices.length === 0 && (
        <EmptyState
          icon="🧾"
          title="Aucune facture"
          message="Vous n'avez pas encore créé de factures."
          actionLabel="➕ Créer la première facture"
          onAction={() => router.push('/invoices')}
        />
      )}

      {!loading && !error && filteredInvoices.length > 0 && (
        isMobile ? <MobileView /> : <DesktopView />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}