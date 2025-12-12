'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from "../../../page.module.css";

interface TenantInfo {
  business_unit: string;
  year: number;
  schema: string;
}

export default function EditSupplier() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [supplierLoading, setSupplierLoading] = useState(true);

  const [formData, setFormData] = useState({
    nfournisseur: '',
    nom_fournisseur: '',
    resp_fournisseur: '',
    adresse_fourni: '',
    tel: '',
    email: '',
    caf: '0',
    cabl: '0'
  });

  useEffect(() => {
    // Vérifier l'authentification et les informations de tenant
    const tenantInfoStr = localStorage.getItem('tenant_info');
    if (!tenantInfoStr) {
      router.push('/login');
      return;
    }

    try {
      const tenant: TenantInfo = JSON.parse(tenantInfoStr);
      setTenantInfo(tenant);
      loadSupplierData(tenant, supplierId);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router, supplierId]);

  const loadSupplierData = async (tenant: TenantInfo, id: string) => {
    try {
      setSupplierLoading(true);
      
      const response = await fetch(`http://localhost:3005/api/sales/suppliers/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant.schema
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        const supplier = result.data;
        setFormData({
          nfournisseur: supplier.nfournisseur,
          nom_fournisseur: supplier.nom_fournisseur,
          resp_fournisseur: supplier.resp_fournisseur || '',
          adresse_fourni: supplier.adresse_fourni || '',
          tel: supplier.tel || '',
          email: supplier.email || '',
          caf: supplier.caf?.toString() || '0',
          cabl: supplier.cabl?.toString() || '0'
        });
      } else {
        setError('Fournisseur non trouvé');
      }
    } catch (err) {
      console.error('Error loading supplier:', err);
      setError('Erreur lors du chargement du fournisseur');
    } finally {
      setSupplierLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantInfo) return;

    // Validation
    if (!formData.nom_fournisseur) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supplierData = {
        nom_fournisseur: formData.nom_fournisseur,
        resp_fournisseur: formData.resp_fournisseur,
        adresse_fourni: formData.adresse_fourni,
        tel: formData.tel,
        email: formData.email,
        caf: parseFloat(formData.caf) || 0,
        cabl: parseFloat(formData.cabl) || 0
      };

      const response = await fetch(`http://localhost:3005/api/sales/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema
        },
        body: JSON.stringify(supplierData)
      });

      const result = await response.json();

      if (result.success) {
        showSuccessToast(`✅ Fournisseur ${formData.nfournisseur} modifié avec succès !`);
        
        // Attendre un peu pour que l'utilisateur voie le toast
        setTimeout(() => {
          router.push('/dashboard?tab=suppliers&message=Fournisseur modifié avec succès');
        }, 2000);
      } else {
        setError(result.error || 'Erreur lors de la modification');
      }

    } catch (err) {
      console.error('Error updating supplier:', err);
      setError('Erreur lors de la modification du fournisseur');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard?tab=suppliers');
  };

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setError(null);
    
    // Supprimer le message après 3 secondes
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  if (!tenantInfo) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Vérification de l'authentification...</div>
      </div>
    );
  }

  if (supplierLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Chargement du fournisseur...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Modifier le Fournisseur {formData.nfournisseur}</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              <strong>Contexte:</strong> {tenantInfo.business_unit.toUpperCase()} - Exercice {tenantInfo.year} ({tenantInfo.schema})
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ← Retour
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Code Fournisseur (Non modifiable)
                </label>
                <input
                  type="text"
                  value={formData.nfournisseur}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nom Fournisseur *
                </label>
                <input
                  type="text"
                  name="nom_fournisseur"
                  value={formData.nom_fournisseur}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Responsable
                </label>
                <input
                  type="text"
                  name="resp_fournisseur"
                  value={formData.resp_fournisseur}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="tel"
                  value={formData.tel}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Adresse
              </label>
              <textarea
                name="adresse_fourni"
                value={formData.adresse_fourni}
                onChange={handleInputChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  CA Factures (DA)
                </label>
                <input
                  type="number"
                  name="caf"
                  value={formData.caf}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  CA Bons de Livraison (DA)
                </label>
                <input
                  type="number"
                  name="cabl"
                  value={formData.cabl}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            {/* Toast de succès positionné juste au-dessus des boutons */}
            {successMessage && (
              <div style={{
                background: '#d4edda',
                color: '#155724',
                padding: '15px 20px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
                border: '2px solid #c3e6cb',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                animation: 'slideIn 0.3s ease-out'
              }}>
                🎉 {successMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {loading ? 'Modification...' : '✅ Modifier le Fournisseur'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          0% { 
            transform: translateY(-20px); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  );
}