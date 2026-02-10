'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrintOptions from '../../../components/PrintOptions';

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
      loadDeliveryNotes(tenant.schema);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router]);

  const loadDeliveryNotes = async (tenantSchema: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading delivery notes for tenant:', tenantSchema);

      const response = await fetch('/api/sales/delivery-notes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantSchema
        }
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 Delivery notes data:', data);

      if (data.success) {
        console.log('📋 Raw BL data received:', data.data);
        data.data.forEach((bl: any, index: number) => {
          console.log(`BL ${index} DETAILED:`, {
            nfact: bl.nfact,
            nbl: bl.nbl,
            id: bl.id,
            nfact_type: typeof bl.nfact,
            nbl_type: typeof bl.nbl,
            id_type: typeof bl.id,
            allFields: Object.keys(bl),
            fullObject: bl
          });
        });
        setDeliveryNotes(data.data || []);
        setFilteredDeliveryNotes(data.data || []);
        
        // Charger les statuts de paiement pour chaque BL
        loadPaymentStatuses(data.data || [], tenantSchema);
        
        console.log('✅ Loaded', data.data?.length || 0, 'delivery notes');
      } else {
        throw new Error(data.error || 'Failed to load delivery notes');
      }
    } catch (error) {
      console.error('❌ Error loading delivery notes:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les statuts de paiement
  const loadPaymentStatuses = async (notes: DeliveryNote[], tenantSchema: string) => {
    const statuses: Record<number, string> = {};
    
    // Charger les statuts en parallèle
    await Promise.all(
      notes.map(async (note) => {
        try {
          // Récupérer la config de la base de données active
          const dbConfig = localStorage.getItem('activeDbConfig');
          const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
          
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
          console.error(`Error loading payment status for BL ${note.nbl}:`, error);
        }
      })
    );
    
    setPaymentStatuses(statuses);
  };

  // Fonction de filtrage améliorée - CORRECTION MAJEURE
  const applyFilters = () => {
    let filtered = [...deliveryNotes];

    // Filtre par terme de recherche - LOGIQUE CORRIGÉE
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bl => {
        // Si le terme de recherche est un nombre, chercher SEULEMENT dans les numéros de BL
        if (/^\d+$/.test(searchTerm.trim())) {
          const blNumber = String(bl.nfact || bl.nbl || '').trim();
          const exactMatch = blNumber === searchTerm.trim();
          
          console.log(`🔍 Numeric search for "${searchTerm.trim()}":`, {
            blNumber,
            searchTerm: searchTerm.trim(),
            exactMatch
          });
          
          return exactMatch;
        } else {
          // Si ce n'est pas un nombre, chercher dans client et code client
          const clientMatch = bl.client_name?.toLowerCase().includes(searchLower);
          const clientCodeMatch = bl.nclient?.toLowerCase().includes(searchLower);
          
          console.log(`🔍 Text search for "${searchLower}":`, {
            clientName: bl.client_name,
            clientCode: bl.nclient,
            clientMatch,
            clientCodeMatch
          });
          
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

    // Filtre par statut de paiement
    if (paymentStatus !== 'all') {
      filtered = filtered.filter(bl => {
        const status = paymentStatuses[bl.nbl];
        if (paymentStatus === 'paid') {
          return status === 'paid';
        } else if (paymentStatus === 'partially_paid') {
          return status === 'partially_paid';
        }
        return true;
      });
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
      paymentStatus
    });

    setFilteredDeliveryNotes(filtered);
  };

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
    applyFilters();
  }, [searchTerm, dateFrom, dateTo, minAmount, maxAmount, selectedClient, paymentStatus, deliveryNotes, paymentStatuses]);

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
      {filteredDeliveryNotes.map((bl, index) => {
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
            key={`${validId}-${index}`}
            style={{
              background: 'white',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}
          >
            {/* En-tête BL */}
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
                color: '#007bff'
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
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
                color: '#333',
                marginBottom: '4px'
              }}>
                👤 {bl.client_name}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
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
                color: '#666',
                marginRight: '8px'
              }}>
                📅
              </span>
              <span style={{ fontSize: '14px', color: '#333' }}>
                {formatDate(bl.date_fact)}
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
                  {formatAmount(bl.montant_ht)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '14px', color: '#666' }}>TVA:</span>
                <span style={{ fontSize: '14px' }}>
                  {formatAmount(bl.tva)}
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
                  backgroundColor: '#17a2b8',
                  color: 'white',
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
                  if (confirm(`Êtes-vous sûr de vouloir supprimer le BL ${displayId} ?`)) {
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
                  backgroundColor: '#007bff',
                  color: 'white',
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
                  backgroundColor: '#17a2b8',
                  color: 'white',
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
                  backgroundColor: '#6f42c1',
                  color: 'white',
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
    <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>N° BL</th>
            <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Client</th>
            <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
            <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Montant HT</th>
            <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>TVA</th>
            <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>Total TTC</th>
            <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', minWidth: '300px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDeliveryNotes.map((bl, index) => {
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
                key={`${validId}-${index}`}
                style={{ 
                  borderBottom: '1px solid #dee2e6',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                }}
              >
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#007bff' }}>
                  {displayId}
                </td>
                <td style={{ padding: '15px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{bl.client_name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{bl.nclient}</div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  {formatDate(bl.date_fact)}
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>
                  {formatAmount(bl.montant_ht)}
                </td>
                <td style={{ padding: '15px', textAlign: 'right' }}>
                  {formatAmount(bl.tva)}
                </td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                  {formatAmount(bl.montant_ttc || (bl.montant_ht + bl.tva))}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {/* Première ligne - Actions principales */}
                    <div style={{
                      display: 'flex',
                      gap: '5px',
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => {
                          console.log(`🔗 Navigating to details with REAL ID: ${validId} for BL ${displayId}`);
                          router.push(`/delivery-notes/${validId}`);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          minWidth: '70px'
                        }}
                        title={`Voir les détails du BL ${displayId}`}
                      >
                        👁️ Voir
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log(`✏️ Navigating to edit with REAL ID: ${validId} for BL ${displayId}`);
                          router.push(`/delivery-notes/${validId}/edit`);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          minWidth: '70px'
                        }}
                        title={`Modifier le BL ${displayId}`}
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
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          minWidth: '70px'
                        }}
                        title={`Supprimer le BL ${displayId}`}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                    
                    {/* Deuxième ligne - Actions d'impression */}
                    <div style={{
                      display: 'flex',
                      gap: '5px',
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => {
                          console.log(`📄 PDF Complete - Using REAL ID: ${validId} for BL ${displayId}`);
                          openPDFPreview(validId, 'complete');
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          minWidth: '90px'
                        }}
                        title={`Prévisualiser BL Complet ${displayId}`}
                      >
                        📄 BL Complet
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log(`📄 PDF Small - Using REAL ID: ${validId} for BL ${displayId}`);
                          openPDFPreview(validId, 'small');
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          minWidth: '90px'
                        }}
                        title={`Prévisualiser BL Réduit ${displayId}`}
                      >
                        📄 BL Réduit
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log(`🎫 PDF Ticket - Using REAL ID: ${validId} for BL ${displayId}`);
                          openPDFPreview(validId, 'ticket');
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6f42c1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          minWidth: '70px'
                        }}
                        title={`Prévisualiser Ticket ${displayId}`}
                      >
                        🎫 Ticket
                      </button>
                      
                      {/* WhatsApp Button */}
                      <div style={{ minWidth: '120px' }}>
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
      padding: isMobile ? '10px' : '20px', 
      maxWidth: isMobile ? '100%' : '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f5f5f5'
    }}>
      {/* En-tête responsive */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        marginBottom: '20px',
        background: 'white',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: isMobile ? '15px' : '0' }}>
          <h1 style={{ 
            margin: 0, 
            color: '#333',
            fontSize: isMobile ? '20px' : '24px'
          }}>
            📋 Liste des Bons de Livraison
          </h1>
          <p style={{ 
            margin: '5px 0 0 0', 
            color: '#666',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            {isMobile ? `${filteredDeliveryNotes.length} BL trouvés` : `Tenant: ${tenant} • ${filteredDeliveryNotes.length} BL trouvés`}
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={() => router.push('/delivery-notes')}
            style={{
              padding: isMobile ? '12px 20px' : '12px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '16px',
              fontWeight: 'bold'
            }}
          >
            ➕ Nouveau BL
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: isMobile ? '12px 20px' : '12px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '16px',
              fontWeight: 'bold'
            }}
          >
            ← Retour Dashboard
          </button>
        </div>
      </div>

      {/* Interface de filtres */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: isMobile ? '15px' : '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
            color: '#333',
            fontSize: isMobile ? '16px' : '18px'
          }}>
            🔍 Filtres de recherche
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 16px',
              backgroundColor: showFilters ? '#dc3545' : '#007bff',
              color: 'white',
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
                placeholder="🔍 N° BL exact (ex: 1, 5) ou nom client (ex: Kaddour)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={resetFilters}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
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
                  color: '#333',
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
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
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
                  color: '#333',
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
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
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
                  color: '#333',
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
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Filtre par date de fin */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333',
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
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Filtre par montant minimum */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333',
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
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Filtre par montant maximum */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333',
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
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Résumé des filtres actifs */}
            {(searchTerm || selectedClient || dateFrom || dateTo || minAmount || maxAmount || paymentStatus !== 'all') && (
              <div style={{
                background: '#e7f3ff',
                border: '1px solid #b3d9ff',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '14px'
              }}>
                <strong>🎯 Filtres actifs :</strong>
                {searchTerm && <span style={{ marginLeft: '10px', background: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Recherche: "{searchTerm}"</span>}
                {selectedClient && <span style={{ marginLeft: '10px', background: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Client: {selectedClient}</span>}
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

      {/* Résumé des totaux */}
      {!loading && !error && filteredDeliveryNotes.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '10px',
          padding: isMobile ? '15px' : '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          color: 'white'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            color: 'white',
            fontSize: isMobile ? '16px' : '18px',
            textAlign: 'center'
          }}>
            📊 Résumé des Totaux
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? '10px' : '20px',
            textAlign: 'center'
          }}>
            {/* Nombre de BL */}
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: isMobile ? '10px' : '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {calculateTotals().count}
              </div>
              <div style={{
                fontSize: isMobile ? '12px' : '14px',
                opacity: 0.9
              }}>
                📋 BL Affichés
              </div>
            </div>

            {/* Total HT */}
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: isMobile ? '10px' : '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {formatAmount(calculateTotals().totalHT)}
              </div>
              <div style={{
                fontSize: isMobile ? '12px' : '14px',
                opacity: 0.9
              }}>
                💰 Total HT
              </div>
            </div>

            {/* Total TVA */}
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: isMobile ? '10px' : '15px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {formatAmount(calculateTotals().totalTVA)}
              </div>
              <div style={{
                fontSize: isMobile ? '12px' : '14px',
                opacity: 0.9
              }}>
                🏛️ Total TVA
              </div>
            </div>

            {/* Total TTC */}
            <div style={{
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: isMobile ? '10px' : '15px',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.3)',
              gridColumn: isMobile ? '1 / -1' : 'auto'
            }}>
              <div style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 'bold',
                marginBottom: '5px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {formatAmount(calculateTotals().totalTTC)}
              </div>
              <div style={{
                fontSize: isMobile ? '14px' : '16px',
                opacity: 0.9,
                fontWeight: 'bold'
              }}>
                💎 TOTAL TTC
              </div>
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
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Chargement des bons de livraison...</p>
        </div>
      )}

      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p>❌ Erreur: {error}</p>
          <button 
            onClick={() => tenant && loadDeliveryNotes(tenant)}
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

      {!loading && !error && filteredDeliveryNotes.length === 0 && deliveryNotes.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '40px 20px' : '60px 20px',
          background: 'white',
          borderRadius: '10px',
          border: '2px dashed #ffc107'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '15px' }}>🔍 Aucun résultat trouvé</h3>
          <p style={{ color: '#856404', marginBottom: '20px' }}>
            Aucun bon de livraison ne correspond aux critères de recherche.
          </p>
          <button
            onClick={resetFilters}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔄 Réinitialiser les filtres
          </button>
        </div>
      )}

      {!loading && !error && deliveryNotes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '40px 20px' : '60px 20px',
          background: 'white',
          borderRadius: '10px',
          border: '2px dashed #dee2e6'
        }}>
          <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>📋 Aucun bon de livraison</h3>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            Vous n'avez pas encore créé de bons de livraison.
          </p>
          <button
            onClick={() => router.push('/delivery-notes')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ➕ Créer le premier BL
          </button>
        </div>
      )}

      {!loading && !error && filteredDeliveryNotes.length > 0 && (
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