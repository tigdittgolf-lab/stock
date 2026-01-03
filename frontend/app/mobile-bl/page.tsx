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
}

export default function MobileBLPage() {
  const router = useRouter();
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
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

      const response = await fetch('/api/sales/delivery-notes', {
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
        setDeliveryNotes(data.data || []);
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

  const handlePrintPDF = (blId: number) => {
    const pdfUrl = `/api/pdf/delivery-note/${blId}`;
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
          📋 Bons de Livraison
        </h1>
        <p style={{ 
          margin: '0 0 15px 0', 
          fontSize: '14px',
          color: '#666'
        }}>
          {deliveryNotes.length} BL trouvés
        </p>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button
            onClick={() => router.push('/delivery-notes')}
            style={{
              padding: '12px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
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
          marginBottom: '15px',
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
          background: 'white',
          padding: '40px 20px',
          borderRadius: '10px',
          textAlign: 'center',
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
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ➕ Créer le premier BL
          </button>
        </div>
      )}

      {/* Mobile-optimized card layout */}
      {!loading && !error && deliveryNotes.length > 0 && (
        <div>
          {deliveryNotes.map((bl, index) => (
            <div 
              key={bl.nfact || bl.nbl || index}
              style={{
                background: 'white',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0'
              }}
            >
              {/* BL Header */}
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
                  📋 BL {bl.nfact || bl.nbl}
                </div>
                <button
                  onClick={() => handlePrintPDF(bl.nfact || bl.nbl)}
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

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handlePrintPDF(bl.nfact || bl.nbl)}
                  style={{
                    flex: 1,
                    minWidth: '120px',
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
                  📄 Imprimer PDF
                </button>
                <button
                  onClick={() => alert(`Détails du BL ${bl.nfact || bl.nbl}\nClient: ${bl.client_name}\nMontant: ${formatAmount(bl.montant_ht + bl.tva)}`)}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  ℹ️ Détails
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