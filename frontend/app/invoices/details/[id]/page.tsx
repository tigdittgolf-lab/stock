'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface InvoiceDetail {
  narticle: string;
  designation: string;
  qte: number;
  prix: number;
  tva: number;
  total_ligne: number;
}

interface InvoiceData {
  nfact: number;
  date_fact: string;
  client_name: string;
  client_address: string;
  client_nif: string;
  client_rc: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  timbre: number;
  autre_taxe: number;
  details: InvoiceDetail[];
}

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
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
      loadInvoiceDetails(tenant.schema, id);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router, id]);

  const loadInvoiceDetails = async (tenantSchema: string, factId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Loading invoice details for ID: ${factId}, Tenant: ${tenantSchema}`);

      // Utiliser l'endpoint backend via le proxy frontend pour éviter CORS
      const response = await fetch(`/api/sales/invoices/${factId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantSchema
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Adapter les données backend au format attendu
        const adaptedData = {
          nfact: result.data.nfact,
          date_fact: result.data.date_fact,
          client_name: result.data.client_name || 'Client',
          client_address: result.data.client_address || '',
          client_nif: result.data.client_nif || '',
          client_rc: result.data.client_rc || '',
          montant_ht: result.data.montant_ht || 0,
          tva: result.data.tva || 0,
          montant_ttc: result.data.total_ttc || result.data.montant_ttc || (result.data.montant_ht + result.data.tva),
          timbre: result.data.timbre || 0,
          autre_taxe: result.data.autre_taxe || 0,
          details: (result.data.details || []).map((detail: any) => ({
            narticle: detail.narticle,
            designation: detail.designation,
            qte: detail.qte,
            prix: detail.prix,
            tva: detail.tva,
            total_ligne: detail.total_ligne
          }))
        };
        
        setInvoiceData(adaptedData);
        console.log('✅ Invoice details loaded successfully from backend');
      } else {
        throw new Error(result.error || 'Failed to load invoice details');
      }
    } catch (error) {
      console.error('❌ Error loading invoice details:', error);
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

  const handlePrintPDF = () => {
    console.log(`📄 PDF Invoice - ID: ${id}`);
    const pdfUrl = `/api/pdf/invoice/${id}`;
    console.log(`📄 Opening PDF URL: ${pdfUrl}`);
    
    // Solution SIMPLE: Ouvrir directement l'URL dans un nouvel onglet (comme les BL)
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
            borderTop: '4px solid #28a745',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Chargement des détails de la facture...</p>
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

  if (!invoiceData) {
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
          <h3>🧾 Facture non trouvée</h3>
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
            color: '#28a745'
          }}>
            🧾 Détails Facture {invoiceData.nfact}
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
              {invoiceData.client_name}
            </p>
            {invoiceData.client_address && (
              <p style={{ margin: '5px 0', color: '#666' }}>
                📍 {invoiceData.client_address}
              </p>
            )}
            {invoiceData.client_nif && (
              <p style={{ margin: '5px 0', color: '#666' }}>
                🏢 NIF: {invoiceData.client_nif}
              </p>
            )}
            {invoiceData.client_rc && (
              <p style={{ margin: '5px 0', color: '#666' }}>
                📋 RC: {invoiceData.client_rc}
              </p>
            )}
          </div>
          
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>📅 Informations</h3>
            <p style={{ margin: '5px 0' }}>
              <strong>Date:</strong> {formatDate(invoiceData.date_fact)}
            </p>
            <p style={{ margin: '5px 0' }}>
              <strong>N° Facture:</strong> {invoiceData.nfact}
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
        
        {invoiceData.details && invoiceData.details.length > 0 ? (
          <div>
            {invoiceData.details.map((article, index) => (
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
                      color: '#28a745'
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
            <strong>{formatAmount(invoiceData.montant_ht)}</strong>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span>TVA:</span>
            <strong>{formatAmount(invoiceData.tva)}</strong>
          </div>
          
          {invoiceData.timbre > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #dee2e6'
            }}>
              <span>Timbre:</span>
              <strong>{formatAmount(invoiceData.timbre)}</strong>
            </div>
          )}
          
          {invoiceData.autre_taxe > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #dee2e6'
            }}>
              <span>Autre taxe:</span>
              <strong>{formatAmount(invoiceData.autre_taxe)}</strong>
            </div>
          )}
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
          <span>{formatAmount(invoiceData.montant_ttc)}</span>
        </div>
      </div>

      {/* Actions d'impression */}
      <div style={{
        background: 'white',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '10px',
        boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🖨️ Impression</h3>
        
        <button
          onClick={handlePrintPDF}
          style={{
            width: '100%',
            padding: '15px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          📄 Imprimer Facture PDF
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}