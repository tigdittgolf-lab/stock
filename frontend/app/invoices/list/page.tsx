'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

      console.log('🔄 Loading invoices for tenant:', tenantSchema);

      const response = await fetch('/api/sales/invoices', {
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
      console.log('🧾 Invoices data:', data);

      if (data.success) {
        setInvoices(data.data || []);
        console.log('✅ Loaded', data.data?.length || 0, 'invoices');
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

  const handlePrintPDF = (factId: number) => {
    const pdfUrl = `/api/pdf/invoice/${factId}`;
    window.open(pdfUrl, '_blank');
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
      {invoices.map((fact, index) => (
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
              onClick={() => handlePrintPDF(fact.nfact)}
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

          {/* Actions supplémentaires - Impression + Détails */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {/* Première ligne - Impression facture */}
            <button
              onClick={() => {
                const pdfUrl = `/api/pdf/invoice/${fact.nfact}`;
                window.open(pdfUrl, '_blank');
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
          </div>
          
          {/* Deuxième ligne - Bouton Détails */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '8px'
          }}>
            <button
              onClick={() => {
                // Naviguer vers une page de détails
                router.push(`/invoices/details/${fact.nfact}`);
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ℹ️ Voir Détails de la Facture
            </button>
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
          {invoices.map((fact, index) => (
            <tr 
              key={fact.nfact || index}
              style={{ 
                borderBottom: '1px solid #dee2e6',
                backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
              }}
            >
              <td style={{ padding: '15px', fontWeight: 'bold', color: '#28a745' }}>
                Facture {fact.nfact}
              </td>
              <td style={{ padding: '15px' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{fact.client_name || 'Client'}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Code: {fact.nclient}</div>
                </div>
              </td>
              <td style={{ padding: '15px' }}>
                {formatDate(fact.date_fact)}
              </td>
              <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>
                {formatAmount(fact.montant_ht)}
              </td>
              <td style={{ padding: '15px', textAlign: 'right' }}>
                {formatAmount(fact.tva)}
              </td>
              <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                {formatAmount(fact.montant_ttc || (fact.montant_ht + fact.tva))}
              </td>
              <td style={{ padding: '15px', textAlign: 'center' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  alignItems: 'center'
                }}>
                  {/* Bouton Impression */}
                  <button
                    onClick={() => handlePrintPDF(fact.nfact)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      width: '100%',
                      maxWidth: '150px'
                    }}
                    title="Imprimer Facture PDF"
                  >
                    📄 Imprimer Facture
                  </button>
                  
                  {/* Bouton Détails */}
                  <button
                    onClick={() => {
                      router.push(`/invoices/details/${fact.nfact}`);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      width: '100%',
                      maxWidth: '150px'
                    }}
                    title="Voir tous les détails de la facture"
                  >
                    ℹ️ Voir Détails
                  </button>
                </div>
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
      background: isMobile ? '#f5f5f5' : 'white'
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
        boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        borderBottom: isMobile ? 'none' : '2px solid #eee'
      }}>
        <div style={{ marginBottom: isMobile ? '15px' : '0' }}>
          <h1 style={{ 
            margin: 0, 
            color: '#333',
            fontSize: isMobile ? '20px' : '28px'
          }}>
            🧾 Liste des Factures
          </h1>
          <p style={{ 
            margin: '5px 0 0 0', 
            color: '#666',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            {isMobile ? `${invoices.length} factures` : `Tenant: ${tenant} • ${invoices.length} factures trouvées`}
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
              backgroundColor: '#28a745',
              color: 'white',
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
              backgroundColor: '#6c757d',
              color: 'white',
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

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #28a745',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Chargement des factures...</p>
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
            onClick={() => tenant && loadInvoices(tenant)}
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

      {!loading && !error && invoices.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '40px 20px' : '60px 20px',
          background: 'white',
          borderRadius: '10px',
          border: '2px dashed #dee2e6'
        }}>
          <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>🧾 Aucune facture</h3>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            Vous n'avez pas encore créé de factures.
          </p>
          <button
            onClick={() => router.push('/invoices')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ➕ Créer la première facture
          </button>
        </div>
      )}

      {!loading && !error && invoices.length > 0 && (
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