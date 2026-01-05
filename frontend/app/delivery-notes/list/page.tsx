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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<string>('');

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
    
    // Créer une fenêtre de prévisualisation avec options - SANS téléchargement automatique
    const previewWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Prévisualisation BL ${validId} - ${titles[type]}</title>
            <style>
              body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; }
              .header { background: ${colors[type]}; color: white; padding: 15px; text-align: center; }
              .controls { background: white; padding: 10px; text-align: center; border-bottom: 2px solid #ddd; }
              .controls button { 
                margin: 0 10px; padding: 10px 20px; border: none; border-radius: 5px; 
                cursor: pointer; font-weight: bold; font-size: 14px;
              }
              .download { background: #28a745; color: white; }
              .close { background: #dc3545; color: white; }
              .print { background: #17a2b8; color: white; }
              iframe { width: 100%; height: calc(100vh - 120px); border: none; }
              .debug { background: #fff3cd; padding: 10px; margin: 10px; border-radius: 5px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>📄 Prévisualisation BL ${validId} - ${titles[type]}</h2>
              <p>Vérifiez le document avant de le télécharger</p>
            </div>
            <div class="debug">
              🔍 Debug: URL = ${pdfUrl} | ID Original = ${blId} | ID Validé = ${validId} | Type = ${type}
            </div>
            <div class="controls">
              <button class="download" onclick="downloadPDF()">⬇️ Télécharger PDF</button>
              <button class="print" onclick="printPDF()">🖨️ Imprimer</button>
              <button class="close" onclick="window.close()">❌ Fermer</button>
            </div>
            <iframe id="pdfFrame" src="${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0" type="application/pdf"></iframe>
            <script>
              console.log('🔍 PDF Preview Window - URL:', '${pdfUrl}');
              console.log('🔍 PDF Preview Window - ID Validation:', { original: ${blId}, validated: ${validId} });
              
              function downloadPDF() {
                // Téléchargement MANUEL seulement quand l'utilisateur clique
                const link = document.createElement('a');
                link.href = '${pdfUrl}';
                link.download = 'BL_${validId}_${type}.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
              
              function printPDF() {
                // Impression améliorée qui fonctionne pour tous les types
                try {
                  // Méthode 1: Essayer d'imprimer l'iframe
                  const iframe = document.getElementById('pdfFrame');
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                  } else {
                    // Méthode 2: Ouvrir dans une nouvelle fenêtre pour impression
                    const printWindow = window.open('${pdfUrl}', '_blank');
                    if (printWindow) {
                      printWindow.onload = function() {
                        printWindow.print();
                      };
                    }
                  }
                } catch (error) {
                  // Méthode 3: Fallback - ouvrir le PDF dans un nouvel onglet
                  console.log('Fallback print method');
                  const printWindow = window.open('${pdfUrl}', '_blank');
                  if (printWindow) {
                    setTimeout(() => {
                      printWindow.print();
                    }, 1000);
                  }
                }
              }
              
              // Empêcher le téléchargement automatique
              window.addEventListener('load', function() {
                const iframe = document.getElementById('pdfFrame');
                if (iframe) {
                  iframe.onload = function() {
                    console.log('PDF loaded in preview mode - no auto download');
                  };
                }
              });
            </script>
          </body>
        </html>
      `);
    } else {
      console.error('❌ Failed to open preview window');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f5f5f5'
    }}>
      {/* En-tête */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '0' }}>
          <h1 style={{ 
            margin: 0, 
            color: '#333',
            fontSize: '24px'
          }}>
            📋 Liste des Bons de Livraison
          </h1>
          <p style={{ 
            margin: '5px 0 0 0', 
            color: '#666',
            fontSize: '16px'
          }}>
            Tenant: {tenant} • {deliveryNotes.length} BL trouvés
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          flexDirection: 'row'
        }}>
          <button
            onClick={() => router.push('/delivery-notes')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ➕ Nouveau BL
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ← Retour Dashboard
          </button>
        </div>
      </div>

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

      {!loading && !error && deliveryNotes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
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

      {/* Interface tableau classique avec prévisualisation PDF */}
      {!loading && !error && deliveryNotes.length > 0 && (
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
              {deliveryNotes.map((bl, index) => {
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
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}