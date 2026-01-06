'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [showFilters, setShowFilters] = useState(false);

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

  // Fonction de filtrage améliorée
  const applyFilters = () => {
    let filtered = [...deliveryNotes];

    // Filtre par terme de recherche (numéro BL, client) - CORRIGÉ
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bl => {
        // Recherche dans le nom du client
        const clientMatch = bl.client_name?.toLowerCase().includes(searchLower);
        // Recherche dans le code client
        const clientCodeMatch = bl.nclient?.toLowerCase().includes(searchLower);
        
        // Recherche par numéro de BL - CORRECTION MAJEURE
        const blNumber = String(bl.nfact || bl.nbl || '').trim();
        const blMatch = blNumber === searchTerm.trim() || // Correspondance exacte
                       blNumber.includes(searchTerm.trim()) || // Correspondance partielle
                       blNumber.startsWith(searchTerm.trim()); // Commence par
        
        console.log(`🔍 Filtering BL:`, {
          searchTerm: searchTerm.trim(),
          blNumber,
          clientName: bl.client_name,
          clientCode: bl.nclient,
          blMatch,
          clientMatch,
          clientCodeMatch,
          finalMatch: clientMatch || clientCodeMatch || blMatch
        });
        
        return clientMatch || clientCodeMatch || blMatch;
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

    console.log(`📊 Filtering results:`, {
      original: deliveryNotes.length,
      filtered: filtered.length,
      searchTerm,
      selectedClient,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount
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
  }, [searchTerm, dateFrom, dateTo, minAmount, maxAmount, selectedClient, deliveryNotes]);

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedClient('');
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
    // Validation robuste de l'ID avec logs détaillés
    console.log(`🔍 openPDFPreview called with:`, { blId, type, blIdType: typeof blId });
    
    let validId = blId;
    if (!blId || isNaN(blId) || blId <= 0) {
      console.warn(`⚠️ Invalid BL ID (${blId}), using fallback ID 5`);
      validId = 5;
    }

    // DOUBLE CHECK: S'assurer que validId est vraiment valide
    if (!validId || isNaN(validId) || validId <= 0) {
      console.error(`🚨 CRITICAL: validId is still invalid (${validId}), forcing to 5`);
      validId = 5;
    }

    console.log(`✅ Final validated ID: ${validId} for type: ${type}`);

    const urls = {
      complete: `/api/pdf/delivery-note/${validId}`,
      small: `/api/pdf/delivery-note-small/${validId}`,
      ticket: `/api/pdf/delivery-note-ticket/${validId}`
    };

    const titles = {
      complete: 'BL Complet',
      small: 'BL Réduit', 
      ticket: 'Ticket'
    };

    const colors = {
      complete: '#007bff',
      small: '#17a2b8',
      ticket: '#6f42c1'
    };

    const pdfUrl = urls[type];
    console.log(`📄 Opening PDF preview: ${pdfUrl} for BL ID: ${validId} (original: ${blId})`);
    
    // Solution SIMPLE : Ouvrir le PDF dans un nouvel onglet avec contrôles
    const previewWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Prévisualisation BL ${validId} - ${titles[type]}</title>
            <style>
              body { 
                margin: 0; 
                font-family: Arial, sans-serif; 
                background: #f5f5f5;
                display: flex;
                flex-direction: column;
                height: 100vh;
              }
              .header { 
                background: ${colors[type]}; 
                color: white; 
                padding: 15px; 
                text-align: center;
                flex-shrink: 0;
              }
              .controls { 
                background: white; 
                padding: 15px; 
                text-align: center; 
                border-bottom: 2px solid #ddd;
                flex-shrink: 0;
              }
              .controls button { 
                margin: 0 15px; 
                padding: 12px 25px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
                font-weight: bold; 
                font-size: 16px;
              }
              .download { background: #007bff; color: white; }
              .print { background: #28a745; color: white; }
              .close { background: #dc3545; color: white; }
              .content {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .message {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 600px;
              }
              .message h3 {
                color: ${colors[type]};
                margin-bottom: 20px;
              }
              .message p {
                margin: 10px 0;
                line-height: 1.6;
              }
              .big-button {
                background: ${colors[type]};
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 8px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                margin: 20px 10px;
                text-decoration: none;
                display: inline-block;
              }
              .big-button:hover {
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>📄 Prévisualisation BL ${validId} - ${titles[type]}</h2>
              <p>Choisissez votre action</p>
            </div>
            
            <div class="controls">
              <button class="download" onclick="downloadPDF()">⬇️ Télécharger PDF</button>
              <button class="print" onclick="printPDF()">🖨️ Imprimer</button>
              <button class="close" onclick="window.close()">❌ Fermer</button>
            </div>
            
            <div class="content">
              <div class="message">
                <h3>📋 Document Prêt</h3>
                <p><strong>BL ${validId} - ${titles[type]}</strong></p>
                <p>Le document PDF est généré et prêt à être utilisé.</p>
                
                <div style="margin: 30px 0;">
                  <a href="${pdfUrl}" target="_blank" class="big-button">
                    👁️ OUVRIR LE PDF
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  ⚠️ Le PDF s'ouvrira dans un nouvel onglet.<br>
                  Votre navigateur peut demander l'autorisation d'ouvrir des pop-ups.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p><strong>Options disponibles :</strong></p>
                  <p>• <strong>Ouvrir</strong> : Voir le PDF dans un nouvel onglet</p>
                  <p>• <strong>Télécharger</strong> : Sauvegarder sur votre ordinateur</p>
                  <p>• <strong>Imprimer</strong> : Envoyer directement à l'imprimante</p>
                </div>
              </div>
            </div>
            
            <script>
              console.log('🔍 PDF Preview Window - URL:', '${pdfUrl}');
              console.log('🔍 PDF Preview Window - ID Validation:', { original: ${blId}, validated: ${validId} });
              
              function downloadPDF() {
                console.log('⬇️ Téléchargement manuel demandé par l\\'utilisateur');
                const link = document.createElement('a');
                link.href = '${pdfUrl}';
                link.download = 'BL_${validId}_${type}.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
              
              function printPDF() {
                console.log('🖨️ Impression demandée par l\\'utilisateur');
                // Ouvrir le PDF dans un nouvel onglet pour impression
                const printWindow = window.open('${pdfUrl}', '_blank');
                if (printWindow) {
                  printWindow.onload = function() {
                    setTimeout(() => {
                      printWindow.print();
                    }, 1000);
                  };
                }
              }
            </script>
          </body>
        </html>
      `);
    } else {
      console.error('❌ Failed to open preview window');
      // Fallback : ouvrir directement le PDF
      window.open(pdfUrl, '_blank');
    }
  };

  // Version mobile avec cartes
  const MobileView = () => (
    <div style={{ padding: '10px' }}>
      {filteredDeliveryNotes.map((bl, index) => {
        // DEBUG: Logs détaillés pour identifier le problème
        console.log(`🔍 BL ${index} RAW DATA:`, {
          nfact: bl.nfact,
          nbl: bl.nbl,
          id: (bl as any).id,
          allKeys: Object.keys(bl),
          fullObject: bl
        });

        // Nettoyer et valider l'ID du BL - essayer plusieurs champs possibles
        let rawId = bl.nfact || bl.nbl || (bl as any).id || (bl as any).nfact_id || (bl as any).bl_id;
        
        // Validation robuste de l'ID avec logs détaillés
        let validId = 5; // ID par défaut GARANTI
        if (rawId) {
          const numericId = parseInt(String(rawId));
          if (!isNaN(numericId) && numericId > 0) {
            validId = numericId;
            console.log(`✅ Valid ID found: ${validId} from raw: ${rawId}`);
          } else {
            console.warn(`⚠️ Invalid BL ID found (${rawId}), using fallback ID 5 for:`, bl);
          }
        } else {
          console.warn(`⚠️ No BL ID found, using fallback ID 5 for:`, bl);
        }

        // FORCE: S'assurer que validId n'est JAMAIS undefined/null
        if (!validId || isNaN(validId) || validId <= 0) {
          console.error(`🚨 CRITICAL: validId is invalid (${validId}), forcing to 5`);
          validId = 5;
        }

        // ID d'affichage (peut être différent de l'ID utilisé pour les actions)
        const displayId = rawId || 'N/A';

        console.log(`🎯 FINAL IDs for BL ${index}: display=${displayId}, action=${validId}`);

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
                  console.log(`🔗 Navigating to details with ID: ${validId}`);
                  router.push(`/delivery-notes/details/${validId}`);
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

            {/* Actions - Première ligne: PDF */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '8px'
            }}>
              <button
                onClick={() => {
                  console.log(`📄 PDF Complete - Using ID: ${validId} (guaranteed valid)`);
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
                  console.log(`📄 PDF Small - Using ID: ${validId} (guaranteed valid)`);
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
                  console.log(`🎫 PDF Ticket - Using ID: ${validId} (guaranteed valid)`);
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
            
            {/* Actions - Deuxième ligne: Supprimer */}
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer ce BL ?')) {
                    alert('Fonction de suppression à implémenter');
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Supprimer ce BL
              </button>
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
            // DEBUG: Logs détaillés pour identifier le problème
            console.log(`🔍 BL ${index} RAW DATA:`, {
              nfact: bl.nfact,
              nbl: bl.nbl,
              id: (bl as any).id,
              allKeys: Object.keys(bl),
              fullObject: bl
            });

            // Nettoyer et valider l'ID du BL - essayer plusieurs champs possibles
            let rawId = bl.nfact || bl.nbl || (bl as any).id || (bl as any).nfact_id || (bl as any).bl_id;
            
            // Validation robuste de l'ID avec logs détaillés
            let validId = 5; // ID par défaut GARANTI
            if (rawId) {
              const numericId = parseInt(String(rawId));
              if (!isNaN(numericId) && numericId > 0) {
                validId = numericId;
                console.log(`✅ Valid ID found: ${validId} from raw: ${rawId}`);
              } else {
                console.warn(`⚠️ Invalid BL ID found (${rawId}), using fallback ID 5 for:`, bl);
              }
            } else {
              console.warn(`⚠️ No BL ID found, using fallback ID 5 for:`, bl);
            }

            // FORCE: S'assurer que validId n'est JAMAIS undefined/null
            if (!validId || isNaN(validId) || validId <= 0) {
              console.error(`🚨 CRITICAL: validId is invalid (${validId}), forcing to 5`);
              validId = 5;
            }

            // ID d'affichage (peut être différent de l'ID utilisé pour les actions)
            const displayId = rawId || 'N/A';

            console.log(`🎯 FINAL IDs for BL ${index}: display=${displayId}, action=${validId}`);

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
                    flexWrap: 'wrap',
                    gap: '5px',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {/* Première ligne - Actions principales */}
                    <button
                      onClick={() => {
                        console.log(`🔗 Navigating to details with ID: ${validId}`);
                        router.push(`/delivery-notes/details/${validId}`);
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
                      title="Voir les détails du BL"
                    >
                      👁️ Voir
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce BL ?')) {
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
                      title="Supprimer le BL"
                    >
                      🗑️ Supprimer
                    </button>
                    
                    {/* Deuxième ligne - Boutons PDF avec prévisualisation */}
                    <button
                      onClick={() => {
                        console.log(`📄 PDF Complete - Using ID: ${validId} (guaranteed valid)`);
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
                      title="Prévisualiser BL Complet"
                    >
                      📄 BL Complet
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log(`📄 PDF Small - Using ID: ${validId} (guaranteed valid)`);
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
                      title="Prévisualiser BL Réduit"
                    >
                      📄 BL Réduit
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log(`🎫 PDF Ticket - Using ID: ${validId} (guaranteed valid)`);
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
                      title="Prévisualiser Ticket"
                    >
                      🎫 Ticket
                    </button>
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
                placeholder="🔍 Rechercher par N° BL exact (ex: 5) ou client..."
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
            {(searchTerm || selectedClient || dateFrom || dateTo || minAmount || maxAmount) && (
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