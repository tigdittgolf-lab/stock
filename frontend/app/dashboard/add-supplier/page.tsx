'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import styles from "../../page.module.css";

interface TenantInfo {
  business_unit: string;
  year: number;
  schema: string;
}

export default function AddSupplier() {
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkingSupplier, setCheckingSupplier] = useState(false);
  const [supplierExists, setSupplierExists] = useState(false);

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
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Vérifier si le fournisseur existe quand on change le code
    if (name === 'nfournisseur' && value.trim().length >= 3) {
      checkSupplierExists(value.trim().toUpperCase());
    } else if (name === 'nfournisseur') {
      setSupplierExists(false);
    }
  };

  const checkSupplierExists = async (supplierCode: string) => {
    if (!tenantInfo || !supplierCode) return;

    console.log(`🔍 Checking if supplier exists: ${supplierCode}`);
    setCheckingSupplier(true);
    try {
      const response = await fetch(getApiUrl(`sales/suppliers/${supplierCode}`), {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema
        }
      });

      console.log(`📊 Supplier check response:`, { status: response.status, ok: response.ok });

      if (response.status === 200) {
        console.log(`❌ Supplier ${supplierCode} exists!`);
        setSupplierExists(true);
        setError(`Le fournisseur ${supplierCode} existe déjà !`);
      } else {
        console.log(`✅ Supplier ${supplierCode} is available`);
        setSupplierExists(false);
        setError(null);
      }
    } catch (err) {
      console.log(`✅ Supplier ${supplierCode} is available (404 error)`);
      setSupplierExists(false);
      setError(null);
    } finally {
      setCheckingSupplier(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantInfo) return;

    // Validation
    if (!formData.nfournisseur || !formData.nom_fournisseur) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier si le fournisseur existe déjà
    if (supplierExists) {
      setError(`Le fournisseur ${formData.nfournisseur.toUpperCase()} existe déjà !`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supplierData = {
        nfournisseur: formData.nfournisseur.toUpperCase(),
        nom_fournisseur: formData.nom_fournisseur,
        resp_fournisseur: formData.resp_fournisseur,
        adresse_fourni: formData.adresse_fourni,
        tel: formData.tel,
        email: formData.email,
        caf: parseFloat(formData.caf) || 0,
        cabl: parseFloat(formData.cabl) || 0
      };

      const response = await fetch(getApiUrl('sales/suppliers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema
        },
        body: JSON.stringify(supplierData)
      });

      console.log('📊 API Response:', { status: response.status, ok: response.ok });
      
      let result;
      try {
        result = await response.json();
        console.log('📊 API Result:', result);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        result = { success: false, error: 'Invalid response' };
      }

      // Afficher un toast de succès
      console.log('🎉 Showing success toast');
      showSuccessToast(`✅ Fournisseur ${formData.nfournisseur.toUpperCase()} créé avec succès !`);
      
      // Attendre un peu pour que l'utilisateur voie le toast
      setTimeout(() => {
        router.push('/dashboard?tab=suppliers&message=Fournisseur ajouté avec succès');
      }, 2000);

    } catch (err) {
      console.error('Error creating supplier:', err);
      setError('Erreur lors de la création du fournisseur');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard?tab=suppliers');
  };

  const showSuccessToast = (message: string) => {
    console.log('🎉 Showing success toast:', message);
    setSuccessMessage(message);
    setError(null);
    
    // Supprimer le message après 3 secondes
    setTimeout(() => {
      console.log('🕐 Hiding success toast');
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Ajouter un Fournisseur</h1>
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
                  Code Fournisseur *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="nfournisseur"
                    value={formData.nfournisseur}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${supplierExists ? '#dc3545' : checkingSupplier ? '#ffc107' : '#ddd'}`,
                      borderRadius: '4px',
                      fontSize: '16px',
                      backgroundColor: supplierExists ? '#fff5f5' : 'white'
                    }}
                    placeholder="Ex: F001"
                  />
                  {checkingSupplier && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#ffc107'
                    }}>
                      Vérification...
                    </div>
                  )}
                  {supplierExists && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      ❌ Existe déjà
                    </div>
                  )}
                  {formData.nfournisseur.length >= 3 && !checkingSupplier && !supplierExists && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#28a745',
                      fontWeight: 'bold'
                    }}>
                      ✅ Disponible
                    </div>
                  )}
                </div>
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
                  placeholder="Ex: SARL FOURNISSEUR EXEMPLE"
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
                  placeholder="Nom du responsable"
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
                  placeholder="Ex: +213 XX XX XX XX"
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
                placeholder="Adresse complète du fournisseur"
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
                placeholder="fournisseur@exemple.com"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  CA Factures Initial (DA)
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
                  CA Bons de Livraison Initial (DA)
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
                disabled={loading || supplierExists || checkingSupplier}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading || supplierExists || checkingSupplier ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || supplierExists || checkingSupplier ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {loading ? 'Création...' : 
                 checkingSupplier ? 'Vérification...' :
                 supplierExists ? 'Fournisseur existe déjà' :
                 '✅ Créer le Fournisseur'}
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