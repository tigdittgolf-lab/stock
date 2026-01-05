'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface BLDetail {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

interface BLData {
  nbl: number;
  nfact: number;
  date_fact: string;
  client_name: string;
  client_address: string;
  client_phone: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  details: BLDetail[];
}

export default function BLDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [blData, setBLData] = useState<BLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

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
    const tenantInfo = localStorage.getItem('tenant_info');
    if (!tenantInfo) {
      router.push('/login');
      return;
    }

    try {
      const tenant = JSON.parse(tenantInfo);
      setTenant(tenant.schema);
      loadBLDetails(tenant.schema, id);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router, id]);

  const loadBLDetails = async (tenantSchema: string, blId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Loading BL details for ID: ${blId}, Tenant: ${tenantSchema}`);

      // Utiliser l'endpoint de debug via le proxy frontend pour éviter CORS
      const response = await fetch(`/api/pdf/debug-bl/${blId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantSchema
        }
      });

      console.log(`📊 Debug response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const debugData = await response.json();
      console.log(`📋 Debug data received:`, debugData);
      
      if (debugData.success && debugData.data) {
        setBLData(debugData.data);
        console.log('✅ BL details loaded successfully');
      } else {
        const errorMsg = debugData.error || 'Failed to load BL details';
        console.error(`❌ Debug data error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error loading BL details:', error);
      // Améliorer la gestion d'erreur pour éviter [object Object]
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      setError(errorMessage);
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

  const handlePrintPDF = (format: string) => {
    console.log(`🔍 PDF Request - Format: ${format}, ID: "${id}", Type: ${typeof id}`);
    
    if (!id || id === 'undefined' || id === 'null' || !id.trim()) {
      console.error('❌ Invalid ID for PDF generation:', id);
      alert('Erreur: ID du BL non valide. Veuillez actualiser la page.');
      return;
    }
    
    let pdfUrl = '';
    switch (format) {
      case 'complet':
        pdfUrl = `/api/pdf/delivery-note/${id}`;
        break;
      case 'reduit':
        pdfUrl = `/api/pdf/delivery-note-small/${id}`;
        break;
      case 'ticket':
        pdfUrl = `/api/pdf/delivery-note-ticket/${id}`;
        break;
    }
    
    console.log(`📄 Opening PDF: ${pdfUrl}`);
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{ 
        padding: isMobile ? '10px' : '20px',
        background: isMobile ? '#f5f5f5' : 'white',
        minHeight: '100vh'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Chargement des détails du BL...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: isMobile ? '10px' : '20px',
        background: isMobile ? '#f5f5f5' : 'white',
        minHeight: '100vh'
      }}>
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>❌ Erreur</h3>
          <p>{error}</p>
          <button 
            onClick={() => router.back()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (!blData) {
    return (
      <div style={{ 
        padding: isMobile ? '10px' : '20px',
        background: isMobile ? '#f5f5f5' : 'white',
        minHeight: '100vh'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3>📋 BL non trouvé</h3>
          <button 
            onClick={() => router.back()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px',
      background: isMobile ? '#f5f5f5' : 'white',
      minHeight: '100vh',
      maxWidth: isMobile ? '100%' : '1000px',
      margin: '0 auto'
    }}>
      {/* En-tête */}
      <div style={{
        background: 'white',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          marginBottom: '15px'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: isMobile ? '20px' : '24px',
            color: '#007bff'
          }}>
            📋 Détails BL {blData.nbl || blData.nfact}
          </h1>
          <button
            onClick={() => router.back()}
            style={{
              marginTop: isMobile ? '10px' : '0',
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>

        {/* Informations générales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '15px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>👤 Client</h3>
            <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>
              {blData.client_name}
            </p>
            {blData.client_address && (
              <p style={{ margin: '5px 0', color: '#666' }}>
                📍 {blData.client_address}
              </p>
            )}
            {blData.client_phone && (
              <p style={{ margin: '5px 0', color: '#666' }}>
                📞 {blData.client_phone}
              </p>
            )}
          </div>
          
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>📅 Informations</h3>
            <p style={{ margin: '5px 0' }}>
              <strong>Date:</strong> {formatDate(blData.date_fact)}
            </p>
            <p style={{ margin: '5px 0' }}>
              <strong>N° BL:</strong> {blData.nbl || blData.nfact}
            </p>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div style={{
        background: 'white',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📦 Articles</h3>
        
        {blData.details && blData.details.length > 0 ? (
          <div>
            {blData.details.map((article, index) => (
              <div 
                key={index}
                style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 5px 0', 
                      fontSize: '16px',
                      color: '#007bff'
                    }}>
                      {article.designation}
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '12px', 
                      color: '#666' 
                    }}>
                      Code: {article.narticle}
                    </p>
                  </div>
                  <div style={{ 
                    textAlign: 'right',
                    minWidth: '100px'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: '#28a745'
                    }}>
                      {formatAmount(article.total_ligne)}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
                  gap: '10px',
                  fontSize: '14px'
                }}>
                  <div>
                    <strong>Quantité:</strong><br />
                    {article.qte}
                  </div>
                  <div>
                    <strong>Prix unitaire:</strong><br />
                    {formatAmount(article.prix)}
                  </div>
                  <div>
                    <strong>TVA:</strong><br />
                    {article.tva}%
                  </div>
                  <div>
                    <strong>Total ligne:</strong><br />
                    {formatAmount(article.total_ligne)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Aucun détail d'article disponible
          </p>
        )}
      </div>

      {/* Totaux */}
      <div style={{
        background: 'white',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>💰 Totaux</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          fontSize: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span>Montant HT:</span>
            <strong>{formatAmount(blData.montant_ht)}</strong>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span>TVA:</span>
            <strong>{formatAmount(blData.tva)}</strong>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '15px 0 0 0',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#28a745',
          borderTop: '2px solid #28a745',
          marginTop: '10px'
        }}>
          <span>Total TTC:</span>
          <span>{formatAmount(blData.montant_ttc || (blData.montant_ht + blData.tva))}</span>
        </div>
      </div>

      {/* Actions d'impression */}
      {blData && id && id !== 'undefined' && (
        <div style={{
          background: 'white',
          padding: isMobile ? '15px' : '20px',
          borderRadius: '10px',
          boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🖨️ Impression</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: '10px'
          }}>
            <button
              onClick={() => handlePrintPDF('complet')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              📄 BL Complet
            </button>
            
            <button
              onClick={() => handlePrintPDF('reduit')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              📋 BL Réduit
            </button>
            
            <button
              onClick={() => handlePrintPDF('ticket')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🎫 Ticket
            </button>
          </div>
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