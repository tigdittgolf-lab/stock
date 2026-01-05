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

      {/* TOUJOURS afficher la version avec cartes et TOUS les boutons */}
      {!loading && !error && deliveryNotes.length > 0 && (
        <div>
          {deliveryNotes.map((bl, index) => (
            <div 
              key={bl.nfact || bl.nbl || index}
              style={{
                background: 'white',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}
            >
              {/* En-tête BL */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '15px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#007bff'
                }}>
                  📋 BL {bl.nfact || bl.nbl || bl.id || bl.nfact_id || bl.bl_id || 'N/A'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#666'
                }}>
                  📅 {formatDate(bl.date_fact)}
                </div>
              </div>

              {/* Informations client */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>👤 Client</h3>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '5px'
                  }}>
                    {bl.client_name}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    Code client: {bl.nclient}
                  </div>
                </div>

                {/* Montants */}
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>💰 Montants</h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Montant HT:</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {formatAmount(bl.montant_ht)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>TVA:</span>
                    <span style={{ fontSize: '14px' }}>
                      {formatAmount(bl.tva)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
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
              </div>

              {/* TOUS LES BOUTONS - Toujours visibles */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>🎯 Actions</h3>
                
                {/* Première ligne - 3 boutons PDF */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <button
                    onClick={() => {
                      // Nettoyer et valider l'ID du BL - essayer plusieurs champs possibles
                      let blId = bl.nfact || bl.nbl || bl.id || bl.nfact_id || bl.bl_id;
                      
                      console.log('🔍 BL ID extraction attempt:', {
                        nfact: bl.nfact,
                        nbl: bl.nbl, 
                        id: bl.id,
                        nfact_id: bl.nfact_id,
                        bl_id: bl.bl_id,
                        extracted: blId,
                        fullBL: bl
                      });
                      
                      // Convertir en nombre et vérifier
                      const numericId = parseInt(String(blId));
                      if (!blId || blId === 'undefined' || blId === 'null' || isNaN(numericId) || numericId <= 0) {
                        console.error('❌ Invalid BL ID after extraction:', { 
                          blId, 
                          numericId,
                          nfact: bl.nfact, 
                          nbl: bl.nbl, 
                          id: bl.id,
                          allBLFields: Object.keys(bl)
                        });
                        alert('Erreur: ID du BL invalide. Vérifiez les données.');
                        return;
                      }
                      
                      blId = numericId; // Utiliser l'ID numérique validé
                      const pdfUrl = `/api/pdf/delivery-note/${blId}`;
                      console.log('📄 Opening PDF preview:', pdfUrl, 'for BL ID:', blId);
                      
                      // Créer une fenêtre de prévisualisation avec options
                      const previewWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
                      if (previewWindow) {
                        previewWindow.document.write(`
                          <html>
                            <head>
                              <title>Prévisualisation BL ${blId} - Complet</title>
                              <style>
                                body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; }
                                .header { background: #007bff; color: white; padding: 15px; text-align: center; }
                                .controls { background: white; padding: 10px; text-align: center; border-bottom: 2px solid #ddd; }
                                .controls button { 
                                  margin: 0 10px; padding: 10px 20px; border: none; border-radius: 5px; 
                                  cursor: pointer; font-weight: bold; font-size: 14px;
                                }
                                .download { background: #28a745; color: white; }
                                .close { background: #dc3545; color: white; }
                                .print { background: #17a2b8; color: white; }
                                iframe { width: 100%; height: calc(100vh - 120px); border: none; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h2>📄 Prévisualisation BL ${blId} - Format Complet</h2>
                                <p>Vérifiez le document avant de le télécharger</p>
                              </div>
                              <div class="controls">
                                <button class="download" onclick="downloadPDF()">⬇️ Télécharger PDF</button>
                                <button class="print" onclick="printPDF()">🖨️ Imprimer</button>
                                <button class="close" onclick="window.close()">❌ Fermer</button>
                              </div>
                              <iframe src="${pdfUrl}" type="application/pdf"></iframe>
                              <script>
                                function downloadPDF() {
                                  const link = document.createElement('a');
                                  link.href = '${pdfUrl}';
                                  link.download = 'BL_${blId}_complet.pdf';
                                  link.click();
                                }
                                function printPDF() {
                                  window.frames[0].print();
                                }
                              </script>
                            </body>
                          </html>
                        `);
                      }
                    }}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    📄 BL Complet
                  </button>
                  <button
                    onClick={() => {
                      // Nettoyer et valider l'ID du BL - essayer plusieurs champs possibles
                      let blId = bl.nfact || bl.nbl || bl.id || bl.nfact_id || bl.bl_id;
                      
                      // Convertir en nombre et vérifier
                      const numericId = parseInt(String(blId));
                      if (!blId || blId === 'undefined' || blId === 'null' || isNaN(numericId) || numericId <= 0) {
                        console.error('❌ Invalid BL ID for small PDF:', { 
                          blId, 
                          numericId,
                          nfact: bl.nfact, 
                          nbl: bl.nbl, 
                          id: bl.id,
                          allBLFields: Object.keys(bl)
                        });
                        alert('Erreur: ID du BL invalide');
                        return;
                      }
                      
                      blId = numericId; // Utiliser l'ID numérique validé
                      const pdfUrl = `/api/pdf/delivery-note-small/${blId}`;
                      console.log('📋 Opening PDF preview:', pdfUrl, 'for BL ID:', blId);
                      
                      // Créer une fenêtre de prévisualisation avec options
                      const previewWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
                      if (previewWindow) {
                        previewWindow.document.write(`
                          <html>
                            <head>
                              <title>Prévisualisation BL ${blId} - Réduit</title>
                              <style>
                                body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; }
                                .header { background: #17a2b8; color: white; padding: 15px; text-align: center; }
                                .controls { background: white; padding: 10px; text-align: center; border-bottom: 2px solid #ddd; }
                                .controls button { 
                                  margin: 0 10px; padding: 10px 20px; border: none; border-radius: 5px; 
                                  cursor: pointer; font-weight: bold; font-size: 14px;
                                }
                                .download { background: #28a745; color: white; }
                                .close { background: #dc3545; color: white; }
                                .print { background: #17a2b8; color: white; }
                                iframe { width: 100%; height: calc(100vh - 120px); border: none; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h2>📋 Prévisualisation BL ${blId} - Format Réduit</h2>
                                <p>Vérifiez le document avant de le télécharger</p>
                              </div>
                              <div class="controls">
                                <button class="download" onclick="downloadPDF()">⬇️ Télécharger PDF</button>
                                <button class="print" onclick="printPDF()">🖨️ Imprimer</button>
                                <button class="close" onclick="window.close()">❌ Fermer</button>
                              </div>
                              <iframe src="${pdfUrl}" type="application/pdf"></iframe>
                              <script>
                                function downloadPDF() {
                                  const link = document.createElement('a');
                                  link.href = '${pdfUrl}';
                                  link.download = 'BL_${blId}_reduit.pdf';
                                  link.click();
                                }
                                function printPDF() {
                                  window.frames[0].print();
                                }
                              </script>
                            </body>
                          </html>
                        `);
                      }
                    }}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    📋 BL Réduit
                  </button>
                  <button
                    onClick={() => {
                      // Nettoyer et valider l'ID du BL - essayer plusieurs champs possibles
                      let blId = bl.nfact || bl.nbl || bl.id || bl.nfact_id || bl.bl_id;
                      
                      // Convertir en nombre et vérifier
                      const numericId = parseInt(String(blId));
                      if (!blId || blId === 'undefined' || blId === 'null' || isNaN(numericId) || numericId <= 0) {
                        console.error('❌ Invalid BL ID for ticket:', { 
                          blId, 
                          numericId,
                          nfact: bl.nfact, 
                          nbl: bl.nbl, 
                          id: bl.id,
                          allBLFields: Object.keys(bl)
                        });
                        alert('Erreur: ID du BL invalide');
                        return;
                      }
                      
                      blId = numericId; // Utiliser l'ID numérique validé
                      const pdfUrl = `/api/pdf/delivery-note-ticket/${blId}`;
                      console.log('🎫 Opening PDF preview:', pdfUrl, 'for BL ID:', blId);
                      
                      // Créer une fenêtre de prévisualisation avec options
                      const previewWindow = window.open('', '_blank', 'width=800,height=800,scrollbars=yes,resizable=yes');
                      if (previewWindow) {
                        previewWindow.document.write(`
                          <html>
                            <head>
                              <title>Prévisualisation BL ${blId} - Ticket</title>
                              <style>
                                body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; }
                                .header { background: #6f42c1; color: white; padding: 15px; text-align: center; }
                                .controls { background: white; padding: 10px; text-align: center; border-bottom: 2px solid #ddd; }
                                .controls button { 
                                  margin: 0 10px; padding: 10px 20px; border: none; border-radius: 5px; 
                                  cursor: pointer; font-weight: bold; font-size: 14px;
                                }
                                .download { background: #28a745; color: white; }
                                .close { background: #dc3545; color: white; }
                                .print { background: #17a2b8; color: white; }
                                iframe { width: 100%; height: calc(100vh - 120px); border: none; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h2>🎫 Prévisualisation BL ${blId} - Format Ticket</h2>
                                <p>Vérifiez le document avant de le télécharger</p>
                              </div>
                              <div class="controls">
                                <button class="download" onclick="downloadPDF()">⬇️ Télécharger PDF</button>
                                <button class="print" onclick="printPDF()">🖨️ Imprimer</button>
                                <button class="close" onclick="window.close()">❌ Fermer</button>
                              </div>
                              <iframe src="${pdfUrl}" type="application/pdf"></iframe>
                              <script>
                                function downloadPDF() {
                                  const link = document.createElement('a');
                                  link.href = '${pdfUrl}';
                                  link.download = 'BL_${blId}_ticket.pdf';
                                  link.click();
                                }
                                function printPDF() {
                                  window.frames[0].print();
                                }
                              </script>
                            </body>
                          </html>
                        `);
                      }
                    }}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#6f42c1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    🎫 Ticket
                  </button>
                </div>
                
                {/* Deuxième ligne - Bouton Détails */}
                <button
                  onClick={() => {
                    // Nettoyer et valider l'ID du BL - essayer plusieurs champs possibles
                    let blId = bl.nfact || bl.nbl || bl.id || bl.nfact_id || bl.bl_id;
                    
                    // Convertir en nombre et vérifier
                    const numericId = parseInt(String(blId));
                    if (!blId || blId === 'undefined' || blId === 'null' || isNaN(numericId) || numericId <= 0) {
                      console.error('❌ Invalid BL ID for details:', { 
                        blId, 
                        numericId,
                        nfact: bl.nfact, 
                        nbl: bl.nbl, 
                        id: bl.id,
                        allBLFields: Object.keys(bl)
                      });
                      alert('Erreur: ID du BL invalide');
                      return;
                    }
                    
                    blId = numericId; // Utiliser l'ID numérique validé
                    console.log('🔍 Navigating to BL details:', blId);
                    router.push(`/delivery-notes/details/${blId}`);
                  }}
                  style={{
                    width: '100%',
                    padding: '15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ℹ️ Voir Détails du BL (Articles, Quantités, Prix)
                </button>
              </div>
            </div>
          ))}
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