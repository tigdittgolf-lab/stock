'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from '../../../components/PrintOptions';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import DeliveryNoteActions from '../../../components/DeliveryNoteActions';

interface DeliveryNote {
  nfact: number;
  nbl: number;
  client_name: string;
  nclient: string;
  date_fact: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  created_at: string;
}

export default function DeliveryNotesList() {
  const router = useRouter();
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [filteredDeliveryNotes, setFilteredDeliveryNotes] = useState<DeliveryNote[]>([]);
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
  const [paymentStatus, setPaymentStatus] = useState<'all' | 'paid' | 'partially_paid' | 'unpaid'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // État pour stocker les statuts de paiement
  const [paymentStatuses, setPaymentStatuses] = useState<Record<number, string>>({});
  
  // Ref pour éviter les chargements multiples
  const isLoadingStatuses = useRef(false);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

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
      console.error('❌ No tenant info in localStorage, redirecting to login');
      router.push('/login');
      return;
    }

    try {
      const tenant = JSON.parse(tenantInfo);
      console.log('✅ Tenant loaded from localStorage:', tenant);
      
      if (!tenant.schema) {
        console.error('❌ No schema in tenant info:', tenant);
        router.push('/login');
        return;
      }
      
      setTenant(tenant.schema);
      console.log('🔄 Loading delivery notes for tenant:', tenant.schema);
      loadDeliveryNotes(tenant.schema);
    } catch (error) {
      console.error('❌ Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router]);

  const loadDeliveryNotes = async (tenantSchema: string, retryCount = 0) => {
    try {
      console.log(`📡 Loading delivery notes for tenant: ${tenantSchema} (attempt ${retryCount + 1})`);
      setLoading(true);
      setError(null);

      // Récupérer la config DB depuis localStorage
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'mysql';
      
      console.log('📊 DB Config:', { dbType, tenant: tenantSchema });

      const response = await fetch('/api/sales/delivery-notes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantSchema,
          'X-Database-Type': dbType
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        
        // Retry once if it's the first attempt
        if (retryCount === 0) {
          console.log('🔄 Retrying in 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          return loadDeliveryNotes(tenantSchema, retryCount + 1);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Data received:', {
        success: data.success,
        count: data.data?.length || 0,
        dbType: data.database_type
      });

      if (data.success) {
        const notes = data.data || [];
        setDeliveryNotes(notes);
        setFilteredDeliveryNotes(notes);
        console.log(`✅ Delivery notes loaded successfully: ${notes.length} BL`);
        
        // Les statuts seront chargés par le useEffect de pagination
      } else {
        throw new Error(data.error || 'Failed to load delivery notes');
      }
    } catch (error) {
      console.error('❌ Error loading delivery notes:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setDeliveryNotes([]);
      setFilteredDeliveryNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les statuts de paiement en arrière-plan (non bloquant)
  const loadPaymentStatusesInBackground = async (notes: DeliveryNote[], tenantSchema: string) => {
    // Limiter à 3 requêtes simultanées pour ne pas surcharger MySQL
    const batchSize = 3;
    const statuses: Record<number, string> = {};
    
    const dbConfig = localStorage.getItem('activeDbConfig');
    const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
    
    // Traiter par lots de 3
    for (let i = 0; i < notes.length; i += batchSize) {
      const batch = notes.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (note) => {
          try {
            const response = await fetch(
              `/api/payments/balance?documentType=delivery_note&documentId=${note.nbl}`,
              {
                headers: {
                  'X-Tenant': tenantSchema,
                  'X-Database-Type': dbType
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                statuses[note.nbl] = data.data.status;
              }
            }
          } catch (error) {
            // Ignorer les erreurs silencieusement
          }
        })
      );
      
      // Mettre à jour l'état après chaque lot
      setPaymentStatuses(prev => ({ ...prev, ...statuses }));
      
      // Petite pause entre les lots pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // Fonction optimisée pour calculer les statuts de paiement localement
  // Charge les statuts pour tous les BLs filtrés quand nécessaire
  const loadPaymentStatusesOptimized = async (notes: DeliveryNote[], tenantSchema: string, dbType: string) => {
    // Éviter les chargements multiples simultanés
    if (isLoadingStatuses.current) {
      console.log('⏸️ Already loading statuses, skipping...');
      return null;
    }
    
    isLoadingStatuses.current = true;
    console.log(`📊 Loading payment statuses for ${notes.length} BLs...`);
    
    try {
      const statuses: Record<number, string> = {};
      
      // Calculer le statut pour tous les BLs
      for (const note of notes) {
        try {
          // Récupérer les paiements pour ce BL
          const response = await fetch(
            `/api/payments?documentType=delivery_note&documentId=${note.nbl}`,
            {
              headers: {
                'X-Tenant': tenantSchema,
                'X-Database-Type': dbType
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const payments = data.data;
              
              // Calculer le total payé
              const totalPaid = payments.reduce((sum: number, p: any) => {
                const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0);
              
              // Calculer le montant total du BL
              const totalAmount = typeof note.montant_ttc === 'string' 
                ? parseFloat(note.montant_ttc) 
                : (note.montant_ttc || (note.montant_ht + note.tva));
              
              // Déterminer le statut
              const balance = totalAmount - totalPaid;
              
              if (Math.abs(balance) < 0.01) {
                statuses[note.nbl] = 'paid';
              } else if (totalPaid > 0 && balance > 0) {
                statuses[note.nbl] = 'partially_paid';
                console.log(`💰 BL ${note.nbl}: Total=${totalAmount.toFixed(2)}, Payé=${totalPaid.toFixed(2)}, Statut=partially_paid`);
              } else if (totalPaid > totalAmount) {
                statuses[note.nbl] = 'overpaid';
              } else {
                statuses[note.nbl] = 'unpaid';
              }
            }
          }
        } catch (error) {
          console.error(`Error loading payment status for BL ${note.nbl}:`, error);
          statuses[note.nbl] = 'unpaid';
        }
      }
      
      console.log(`✅ Loaded payment statuses for ${Object.keys(statuses).length} BLs`);
      console.log(`📊 Status breakdown:`, {
        paid: Object.values(statuses).filter(s => s === 'paid').length,
        partially_paid: Object.values(statuses).filter(s => s === 'partially_paid').length,
        unpaid: Object.values(statuses).filter(s => s === 'unpaid').length,
        overpaid: Object.values(statuses).filter(s => s === 'overpaid').length
      });
      
      // Retourner les statuts
      return statuses;
    } finally {
      isLoadingStatuses.current = false;
    }
  };

  // Fonction de filtrage améliorée
  // IMPORTANT: Ne pas inclure paymentStatuses dans les dépendances pour éviter la boucle infinie
  const applyFilters = useCallback(() => {
    let filtered = [...deliveryNotes];

    // Filtre par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bl => {
        // Si le terme de recherche est un nombre, chercher dans les numéros de BL
        if (/^\d+$/.test(searchTerm.trim())) {
          const blNumber = String(bl.nfact || bl.nbl || '').trim();
          return blNumber === searchTerm.trim();
        } else {
          // Sinon, chercher dans client et code client
          const clientMatch = bl.client_name?.toLowerCase().includes(searchLower);
          const clientCodeMatch = bl.nclient?.toLowerCase().includes(searchLower);
          return clientMatch || clientCodeMatch;
        }
      });
    }

    // Filtre par client spécifique
    if (selectedClient) {
      filtered = filtered.filter(bl => bl.client_name === selectedClient);
    }

    // Filtre par date
    if (dateFrom) {
      filtered = filtered.filter(bl => new Date(bl.date_fact) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(bl => new Date(bl.date_fact) <= new Date(dateTo));
    }

    // Filtre par montant
    if (minAmount) {
      filtered = filtered.filter(bl => (bl.montant_ttc || (bl.montant_ht + bl.tva)) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(bl => (bl.montant_ttc || (bl.montant_ht + bl.tva)) <= parseFloat(maxAmount));
    }

    // Filtre par statut de paiement - utiliser l'état actuel sans dépendance
    if (paymentStatus !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(bl => {
        const status = paymentStatuses[bl.nbl];
        if (paymentStatus === 'paid') {
          return status === 'paid';
        } else if (paymentStatus === 'partially_paid') {
          return status === 'partially_paid';
        }
        return true;
      });
      console.log(`💰 Payment filter: ${beforeFilter} BLs → ${filtered.length} BLs (looking for ${paymentStatus})`);
    }

    console.log(`📊 Filtering results:`, {
      original: deliveryNotes.length,
      filtered: filtered.length,
      searchTerm,
      isNumericSearch: /^\d+$/.test(searchTerm.trim()),
      selectedClient,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      paymentStatus,
      statusesLoaded: Object.keys(paymentStatuses).length
    });

    setFilteredDeliveryNotes(filtered);
  }, [deliveryNotes, searchTerm, selectedClient, dateFrom, dateTo, minAmount, maxAmount]); // RETIRER paymentStatus des dépendances!

  // Fonction pour calculer les totaux
  const calculateTotals = () => {
    const totals = filteredDeliveryNotes.reduce((acc, bl) => {
      acc.totalHT += bl.montant_ht || 0;
      acc.totalTVA += bl.tva || 0;
      acc.totalTTC += bl.montant_ttc || (bl.montant_ht + bl.tva) || 0;
      acc.count += 1;
      return acc;
    }, {
      totalHT: 0,
      totalTVA: 0,
      totalTTC: 0,
      count: 0
    });

    return totals;
  };

  // Effet pour appliquer les filtres quand ils changent
  useEffect(() => {
    // Ne PAS appliquer automatiquement si on est en train de charger les statuts de paiement
    if (isLoadingStatuses.current) {
      console.log('⏸️ Skipping applyFilters - loading statuses in progress');
      return;
    }
    
    applyFilters();
    setCurrentPage(1); // Réinitialiser à la page 1 quand les filtres changent
  }, [applyFilters]);
  
  // Charger TOUS les statuts quand le filtre par statut de paiement est activé
  useEffect(() => {
    console.log(`🔍 Payment filter useEffect triggered - paymentStatus: ${paymentStatus}`);
    
    // Ne charger que si on active un filtre de paiement (pas "all")
    if (paymentStatus === 'all') {
      console.log('✅ Payment status is "all", using normal filter');
      // Appliquer les filtres normaux sans filtre de paiement
      applyFilters();
      return;
    }
    
    if (deliveryNotes.length === 0) {
      console.log('⚠️ No delivery notes to filter');
      return;
    }
    
    const tenantInfo = localStorage.getItem('tenant_info');
    const dbConfig = localStorage.getItem('activeDbConfig');
    
    if (!tenantInfo || !dbConfig) {
      console.error('❌ Missing tenant info or db config');
      return;
    }
    
    const tenant = JSON.parse(tenantInfo);
    const dbType = JSON.parse(dbConfig).type;
    
    console.log(`🔍 Payment status filter activated: ${paymentStatus}, fetching from backend...`);
    
    // Appeler la nouvelle API backend qui filtre côté serveur
    fetch(`/api/sales/delivery-notes-by-payment-status?status=${paymentStatus}`, {
      headers: {
        'X-Tenant': tenant.schema,
        'X-Database-Type': dbType
      }
    })
    .then(response => response.json())
    .then(result => {
      if (!result.success) {
        console.error('❌ Error from backend:', result.error);
        return;
      }
      
      console.log(`✅ Received ${result.count} BLs with status ${paymentStatus} from backend`);
      
      // Appliquer les autres filtres sur les résultats
      let filtered = result.data || [];
      
      // Appliquer tous les autres filtres
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(bl => {
          if (/^\d+$/.test(searchTerm.trim())) {
            const blNumber = String(bl.nfact || bl.nbl || '').trim();
            return blNumber === searchTerm.trim();
          } else {
            const clientMatch = bl.client_name?.toLowerCase().includes(searchLower);
            const clientCodeMatch = bl.nclient?.toLowerCase().includes(searchLower);
            return clientMatch || clientCodeMatch;
          }
        });
      }
      
      if (selectedClient) {
        filtered = filtered.filter(bl => bl.client_name === selectedClient);
      }
      
      if (dateFrom) {
        filtered = filtered.filter(bl => new Date(bl.date_fact) >= new Date(dateFrom));
      }
      if (dateTo) {
        filtered = filtered.filter(bl => new Date(bl.date_fact) <= new Date(dateTo));
      }
      
      if (minAmount) {
        filtered = filtered.filter(bl => (bl.montant_ttc || (bl.montant_ht + bl.tva)) >= parseFloat(minAmount));
      }
      if (maxAmount) {
        filtered = filtered.filter(bl => (bl.montant_ttc || (bl.montant_ht + bl.tva)) <= parseFloat(maxAmount));
      }
      
      console.log(`✅ Final filtered results: ${filtered.length} BLs`);
      setFilteredDeliveryNotes(filtered);
    })
    .catch(error => {
      console.error('❌ Error fetching filtered delivery notes:', error);
    });
  }, [paymentStatus]); // ⚠️ UNIQUEMENT quand paymentStatus change
  
  // Calculer la pagination
  
  // Calculer la pagination
  const totalPages = Math.ceil(filteredDeliveryNotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeliveryNotes = filteredDeliveryNotes.slice(startIndex, endIndex);
  
  // Fonction pour changer de page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedClient('');
    setPaymentStatus('all');
    setCurrentPage(1);
  };

  // Obtenir la liste unique des clients pour le filtre
  const uniqueClients = [...new Set(deliveryNotes.map(bl => bl.client_name))].filter(Boolean).sort();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DA';
  };

  const openPDFPreview = (blId: number, type: 'complete' | 'small' | 'ticket') => {
    console.log(`🔍 PDF Preview - ID: ${blId}, Type: ${type}`);
    
    if (!blId || isNaN(blId) || blId <= 0) {
      console.error(`🚨 Invalid BL ID: ${blId}`);
      alert(`Erreur: ID BL invalide: ${blId}`);
      return;
    }

    const urls = {
      complete: `/api/pdf/delivery-note/${blId}`,
      small: `/api/pdf/delivery-note-small/${blId}`,
      ticket: `/api/pdf/delivery-note-ticket/${blId}`
    };

    const pdfUrl = urls[type];
    console.log(`📄 Opening PDF URL: ${pdfUrl}`);
    
    // Solution SIMPLE: Ouvrir directement l'URL dans un nouvel onglet
    window.open(pdfUrl, '_blank');
  };

  // Version mobile avec cartes
  const MobileView = () => (
    <div style={{ padding: '10px' }}>
      {paginatedDeliveryNotes.map((bl, index) => {
        // DEBUG: Logs détaillés pour diagnostiquer le problème
        console.log(`🔍 MOBILE BL ${index} RAW DATA:`, {
          bl: bl,
          nfact: bl.nfact,
          nbl: bl.nbl,
          id: (bl as any).id,
          nfact_type: typeof bl.nfact,
          nbl_type: typeof bl.nbl,
          id_type: typeof (bl as any).id
        });
        
        // Récupération de l'ID réel du BL - CORRECTION MAJEURE
        let validId = bl.nbl || bl.id || bl.nfact;
        
        // Créer une clé unique combinant plusieurs champs pour éviter les doublons
        const uniqueKey = `${validId}-${bl.date_bl || ''}-${bl.nclient || ''}-${index}`;
        
        console.log(`🔍 MOBILE BL ${index} VALID ID:`, {
          validId: validId,
          validId_type: typeof validId
        });
        
        // Validation simple mais correcte
        if (!validId || isNaN(validId) || validId <= 0) {
          console.error(`🚨 CRITICAL: No valid ID found for BL:`, bl);
          return null; // Ne pas afficher ce BL s'il n'a pas d'ID valide
        }

        // ID d'affichage
        const displayId = validId;

        console.log(`🎯 BL ${index}: Using ID ${validId} for display ${displayId}`);

        return (
          <div 
            key={uniqueKey}
            style={{
              background: 'var(--card-background)',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* En-tête BL */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '10px',
              borderBottom: '2px solid var(--border-color)'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--primary-color)'
              }}>
                📋 BL {displayId}
              </div>
              <button
                onClick={() => {
                  console.log(`🔗 Navigating to details with REAL ID: ${validId}`);
                  router.push(`/delivery-notes/${validId}`);
                }}
                style={{
                  padding: '8px 15px',
                  backgroundColor: 'var(--info-color)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                👁️ Voir
              </button>
            </div>

            {/* Informations client */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}>
                👤 {bl.client_name}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                Code client: {bl.nclient}
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
                color: 'var(--text-secondary)',
                marginRight: '8px'
              }}>
                📅
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {formatDate(bl.date_fact)}
              </span>
            </div>

            {/* Montants */}
            <div style={{
              background: 'var(--background-secondary)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Montant HT:</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {formatAmount(bl.montant_ht)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>TVA:</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {formatAmount(bl.tva)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                  Total TTC:
                </span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                  {formatAmount(bl.montant_ttc || (bl.montant_ht + bl.tva))}
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
                  console.log(`🔗 Navigating to details with REAL ID: ${validId}`);
                  router.push(`/delivery-notes/${validId}`);
                }}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px',
                  backgroundColor: 'var(--info-color)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                👁️ Voir
              </button>
              
              <button
                onClick={() => {
                  console.log(`✏️ Navigating to edit with REAL ID: ${validId}`);
                  router.push(`/delivery-notes/${validId}/edit`);
                }}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px',
                  backgroundColor: 'var(--success-color)',
                  color: 'var(--text-inverse)',
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
                  if (confirm(`Êtes-vous sûr de vouloir supprimer le BL ${displayId} ?`)) {
                    alert('Fonction de suppression à implémenter');
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px',
                  backgroundColor: 'var(--error-color)',
                  color: 'var(--text-inverse)',
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
            
            {/* Actions - Deuxième ligne: Options d'impression */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '8px'
            }}>
              <button
                onClick={() => {
                  console.log(`📄 PDF Complete - Using REAL ID: ${validId} for BL ${displayId}`);
                  openPDFPreview(validId, 'complete');
                }}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                📄 BL Complet
              </button>
              
              <button
                onClick={() => {
                  console.log(`📄 PDF Small - Using REAL ID: ${validId} for BL ${displayId}`);
                  openPDFPreview(validId, 'small');
                }}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px',
                  backgroundColor: 'var(--info-color)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                📄 BL Réduit
              </button>
              
              <button
                onClick={() => {
                  console.log(`🎫 PDF Ticket - Using REAL ID: ${validId} for BL ${displayId}`);
                  openPDFPreview(validId, 'ticket');
                }}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '10px',
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                🎫 Ticket
              </button>
            </div>
            
            {/* Actions - Troisième ligne: WhatsApp */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <PrintOptions
                  documentType="bl"
                  documentId={validId}
                  documentNumber={displayId}
                  clientName={bl.client_name}
                  clientId={bl.nclient}
                  isModal={false}
                  whatsappOnly={true}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Version desktop avec tableau
  const DesktopView = () => (
    <div style={{ background: 'var(--card-background)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--background-secondary)', borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>N° BL</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>Client</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>Date</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>Montant HT</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>TVA</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>Total TTC</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', minWidth: '150px', color: 'var(--text-primary)', fontSize: '13px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedDeliveryNotes.map((bl, index) => {
            // DEBUG: Logs détaillés pour diagnostiquer le problème
            console.log(`🔍 DESKTOP BL ${index} RAW DATA:`, {
              bl: bl,
              nfact: bl.nfact,
              nbl: bl.nbl,
              id: (bl as any).id,
              nfact_type: typeof bl.nfact,
              nbl_type: typeof bl.nbl,
              id_type: typeof (bl as any).id
            });
            
            // Récupération de l'ID réel du BL - CORRECTION MAJEURE
            let validId = bl.nbl || bl.id || bl.nfact;
            
            // Créer une clé unique combinant plusieurs champs pour éviter les doublons
            const uniqueKey = `${validId}-${bl.date_bl || ''}-${bl.nclient || ''}-${index}`;
            
            console.log(`🔍 DESKTOP BL ${index} VALID ID:`, {
              validId: validId,
              validId_type: typeof validId
            });
            
            // Validation simple mais correcte
            if (!validId || isNaN(validId) || validId <= 0) {
              console.error(`🚨 CRITICAL: No valid ID found for BL:`, bl);
              return null; // Ne pas afficher ce BL s'il n'a pas d'ID valide
            }

            // ID d'affichage
            const displayId = validId;

            console.log(`🎯 Desktop BL ${index}: Using REAL ID ${validId} for display ${displayId}`);

            return (
              <tr 
                key={uniqueKey}
                style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: index % 2 === 0 ? 'var(--card-background)' : 'var(--background-secondary)'
                }}
              >
                <td style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {displayId}
                </td>
                <td style={{ padding: '6px 12px', fontSize: '13px' }}>
                  <div style={{ lineHeight: '1.3' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{bl.client_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{bl.nclient}</div>
                  </div>
                </td>
                <td style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {formatDate(bl.date_fact)}
                </td>
                <td style={{ padding: '6px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {formatAmount(bl.montant_ht)}
                </td>
                <td style={{ padding: '6px 12px', fontSize: '13px', textAlign: 'right', color: 'var(--text-primary)' }}>
                  {formatAmount(bl.tva)}
                </td>
                <td style={{ padding: '6px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 'bold', color: 'var(--success-color)' }}>
                  {formatAmount(bl.montant_ttc || (bl.montant_ht + bl.tva))}
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                  <DeliveryNoteActions
                    validId={validId}
                    displayId={displayId}
                    clientName={bl.client_name}
                    clientId={bl.nclient}
                    onOpenPDF={openPDFPreview}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ 
      padding: isMobile ? '8px' : '16px', 
      maxWidth: isMobile ? '100%' : '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: 'var(--background-secondary)'
    }}>
      {/* En-tête responsive - Version compacte */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        marginBottom: '16px',
        background: 'var(--card-background)',
        padding: isMobile ? '12px' : '16px',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ marginBottom: isMobile ? '12px' : '0' }}>
          <h1 style={{ 
            margin: 0, 
            color: 'var(--text-primary)',
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '600'
          }}>
            📋 Bons de Livraison
          </h1>
          <p style={{ 
            margin: '4px 0 0 0', 
            color: 'var(--text-secondary)',
            fontSize: isMobile ? '12px' : '13px'
          }}>
            {isMobile ? `${filteredDeliveryNotes.length} BL` : `${tenant} • ${filteredDeliveryNotes.length} BL`}
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              if (tenant) {
                loadDeliveryNotes(tenant);
              } else {
                const tenantInfo = localStorage.getItem('tenant_info');
                if (tenantInfo) {
                  const parsed = JSON.parse(tenantInfo);
                  loadDeliveryNotes(parsed.schema);
                }
              }
            }}
            style={{
              padding: isMobile ? '10px 16px' : '10px 16px',
              backgroundColor: 'var(--success-color)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600'
            }}
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'}
          </button>
          <button
            onClick={() => router.push('/delivery-notes')}
            style={{
              padding: isMobile ? '10px 16px' : '10px 16px',
              backgroundColor: 'var(--primary-color)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600'
            }}
          >
            ➕ Nouveau
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: isMobile ? '10px 16px' : '10px 16px',
              backgroundColor: 'var(--text-secondary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600'
            }}
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* Interface de filtres - Version compacte */}
      <div style={{
        background: 'var(--card-background)',
        borderRadius: '8px',
        padding: isMobile ? '12px' : '16px',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Bouton pour afficher/masquer les filtres */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: showFilters ? '16px' : '0'
        }}>
          <h3 style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: isMobile ? '14px' : '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            🔍 Filtres
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '6px 12px',
              backgroundColor: showFilters ? 'var(--text-secondary)' : 'var(--primary-color)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {showFilters ? '▲' : '▼'}
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
                placeholder="🔍 N° BL ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'var(--background)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                onClick={resetFilters}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--text-secondary)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  minWidth: isMobile ? 'auto' : '100px'
                }}
              >
                🔄
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
                  <option value="all">Tous</option>
                  <option value="paid">🟢 Payés totalement</option>
                  <option value="partially_paid">🟡 Partiellement payés</option>
                  <option value="unpaid">🔴 Non payés (aucun paiement)</option>
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
                background: 'var(--info-color-light)',
                border: '1px solid var(--info-color)',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '14px',
                color: 'var(--text-primary)'
              }}>
                <strong>🎯 Filtres actifs :</strong>
                {searchTerm && <span style={{ marginLeft: '10px', background: 'var(--primary-color)', color: 'var(--text-inverse)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Recherche: "{searchTerm}"</span>}
                {selectedClient && <span style={{ marginLeft: '10px', background: 'var(--success-color)', color: 'var(--text-inverse)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Client: {selectedClient}</span>}
                {paymentStatus !== 'all' && <span style={{ marginLeft: '10px', background: 'var(--success-color)', color: 'var(--text-inverse)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                  {paymentStatus === 'paid' && '🟢 Payés totalement'}
                  {paymentStatus === 'partially_paid' && '🟡 Partiellement payés'}
                </span>}
                {dateFrom && <span style={{ marginLeft: '10px', background: 'var(--info-color)', color: 'var(--text-inverse)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Depuis: {dateFrom}</span>}
                {dateTo && <span style={{ marginLeft: '10px', background: 'var(--info-color)', color: 'var(--text-inverse)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Jusqu'à: {dateTo}</span>}
                {minAmount && <span style={{ marginLeft: '10px', background: 'var(--warning-color)', color: 'var(--text-inverse)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Min: {minAmount} DA</span>}
                {maxAmount && <span style={{ marginLeft: '10px', background: 'var(--warning-color)', color: 'var(--text-inverse)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Max: {maxAmount} DA</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Résumé des totaux - Version compacte */}
      {!loading && !error && filteredDeliveryNotes.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '14px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            flexWrap: 'wrap'
          }}>
            {/* Nombre de BL */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: isMobile ? '13px' : '14px',
                cursor: 'help'
              }}
              title="Nombre de Bons de Livraison affichés"
            >
              <span style={{ opacity: 0.9 }}>📋</span>
              <span style={{ fontWeight: '600' }}>{calculateTotals().count}</span>
              <span style={{ opacity: 0.8 }}>BL</span>
            </div>

            {/* Total HT */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: isMobile ? '13px' : '14px',
                cursor: 'help'
              }}
              title="Total Hors Taxes"
            >
              <span style={{ opacity: 0.9 }}>💰</span>
              <span style={{ fontWeight: '600' }}>{formatAmount(calculateTotals().totalHT)}</span>
            </div>

            {/* Total TVA */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: isMobile ? '13px' : '14px',
                cursor: 'help'
              }}
              title="Total TVA (Taxe sur la Valeur Ajoutée)"
            >
              <span style={{ opacity: 0.9 }}>🏛️</span>
              <span style={{ fontWeight: '600' }}>{formatAmount(calculateTotals().totalTVA)}</span>
            </div>

            {/* Total TTC */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '6px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: '700',
                cursor: 'help'
              }}
              title="Total Toutes Taxes Comprises"
            >
              <span>💎</span>
              <span>{formatAmount(calculateTotals().totalTTC)}</span>
            </div>
          </div>

          {/* Statistiques supplémentaires */}
          {filteredDeliveryNotes.length !== deliveryNotes.length && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: isMobile ? '12px' : '14px'
            }}>
              📈 Affichage de {filteredDeliveryNotes.length} sur {deliveryNotes.length} BL au total
              {calculateTotals().count > 0 && (
                <span style={{ marginLeft: '10px' }}>
                  • Moyenne TTC: {formatAmount(calculateTotals().totalTTC / calculateTotals().count)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {loading && (
        <LoadingSpinner message="Chargement des bons de livraison..." />
      )}

      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => tenant && loadDeliveryNotes(tenant)} 
        />
      )}

      {!loading && !error && filteredDeliveryNotes.length === 0 && deliveryNotes.length > 0 && (
        <EmptyState
          icon="🔍"
          title="Aucun résultat trouvé"
          message="Aucun bon de livraison ne correspond aux critères de recherche."
          actionLabel="🔄 Réinitialiser les filtres"
          onAction={resetFilters}
        />
      )}

      {!loading && !error && deliveryNotes.length === 0 && (
        <EmptyState
          icon="📋"
          title="Aucun bon de livraison"
          message="Vous n'avez pas encore créé de bons de livraison."
          actionLabel="➕ Créer le premier BL"
          onAction={() => router.push('/delivery-notes')}
        />
      )}

      {!loading && !error && filteredDeliveryNotes.length > 0 && (
        <>
          {isMobile ? <MobileView /> : <DesktopView />}
          
          {/* Pagination */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '16px',
            marginTop: '16px',
            padding: '16px',
            background: 'var(--card-background)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Info pagination */}
            <div style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span>
                Affichage de <strong style={{ color: 'var(--text-primary)' }}>{startIndex + 1}</strong> à{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{Math.min(endIndex, filteredDeliveryNotes.length)}</strong> sur{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{filteredDeliveryNotes.length}</strong> résultats
              </span>
              
              {/* Sélecteur nombre par page */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  background: 'var(--background)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={200}>200 / page</option>
              </select>
            </div>
            
            {/* Boutons de navigation */}
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: isMobile ? 'center' : 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  background: currentPage === 1 ? 'var(--background-secondary)' : 'var(--primary-color)',
                  color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                ⏮️ Début
              </button>
              
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  background: currentPage === 1 ? 'var(--background-secondary)' : 'var(--primary-color)',
                  color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                ◀️ Préc
              </button>
              
              {/* Numéros de pages */}
              <div style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      style={{
                        padding: '8px 12px',
                        background: currentPage === pageNum ? 'var(--primary-color)' : 'var(--background-secondary)',
                        color: currentPage === pageNum ? 'var(--text-inverse)' : 'var(--text-primary)',
                        border: currentPage === pageNum ? 'none' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: currentPage === pageNum ? '700' : '500',
                        minWidth: '36px'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  background: currentPage === totalPages ? 'var(--background-secondary)' : 'var(--primary-color)',
                  color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Suiv ▶️
              </button>
              
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  background: currentPage === totalPages ? 'var(--background-secondary)' : 'var(--primary-color)',
                  color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Fin ⏭️
              </button>
            </div>
          </div>
        </>
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