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
}

export default function MobileFacturesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<string>('');

  useEffect(() => {
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
        setInvoices(data.data || []);
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

  return (
    <div style={{ 
      padding: '10px',
      background: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header optimized for mobile */}
      <div style={{
        background: 'white',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '15px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '20px',
          color: '#333'
        }}>
          🧾 Factures
        </h1>
        <p style={{ 
          margin: '0 0 15px 0', 
          fontSize: '14px',
          color: '#666'
        }}>
          {invoices.length} factures trouvées
        </p>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button
            onClick={() => router.push('/invoices')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ➕ Nouvelle Facture
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ← Retour Dashboard
          </button>
        </div>
      </div>

      {loading && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
          <p>Chargement des factures...</p>
        </div>
      )}

      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
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
          background: 'white',
          padding: '40px 20px',
          borderRadius: '10px',
          textAlign: 'center',
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
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ➕ Créer la première facture
          </button>
        </div>
      )}

      {/* Mobile-optimized card layout */}
      {!loading && !error && invoices.length > 0 && (
        <div>
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
              {/* Invoice Header */}
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

              {/* Client Info */}
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

              {/* Amounts */}
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

              {/* Action Buttons - Tous les formats d'impression + Détails */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {/* Première ligne - Impressions PDF */}
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
                    // Naviguer vers une page de détails ou afficher un modal
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