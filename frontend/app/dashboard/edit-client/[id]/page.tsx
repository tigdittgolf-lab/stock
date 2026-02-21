'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../../../page.module.css";

interface TenantInfo {
  business_unit: string;
  year: number;
  schema: string;
}

export default function EditClient({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clientLoading, setClientLoading] = useState(true);

  const [formData, setFormData] = useState({
    nclient: '',
    raison_sociale: '',
    adresse: '',
    contact_person: '',
    tel: '',
    email: '',
    nrc: '',
    date_rc: '',
    lieu_rc: '',
    i_fiscal: '',
    n_article: '',
    commentaire: '',
    c_affaire_fact: '0',
    c_affaire_bl: '0'
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
      loadClientData(tenant, clientId);
    } catch (error) {
      console.error('Error parsing tenant info:', error);
      router.push('/login');
    }
  }, [router, clientId]);

  const loadClientData = async (tenant: TenantInfo, id: string) => {
    try {
      setClientLoading(true);
      
      // Récupérer le type de base de données depuis localStorage
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      const response = await fetch(`/api/sales/clients/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenant.schema,
          'X-Database-Type': dbType
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        const client = result.data;
        setFormData({
          nclient: client.nclient,
          raison_sociale: client.raison_sociale,
          adresse: client.adresse || '',
          contact_person: client.contact_person || '',
          tel: client.tel || '',
          email: client.email || '',
          nrc: client.nrc || '',
          date_rc: client.date_rc || '',
          lieu_rc: client.lieu_rc || '',
          i_fiscal: client.i_fiscal || '',
          n_article: client.n_article || '',
          commentaire: client.commentaire || '',
          c_affaire_fact: client.c_affaire_fact?.toString() || '0',
          c_affaire_bl: client.c_affaire_bl?.toString() || '0'
        });
      } else {
        setError('Client non trouvé');
      }
    } catch (err) {
      console.error('Error loading client:', err);
      setError('Erreur lors du chargement du client');
    } finally {
      setClientLoading(false);
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
    if (!formData.raison_sociale) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clientData = {
        raison_sociale: formData.raison_sociale,
        adresse: formData.adresse,
        contact_person: formData.contact_person,
        tel: formData.tel,
        email: formData.email,
        nrc: formData.nrc,
        date_rc: formData.date_rc,
        lieu_rc: formData.lieu_rc,
        i_fiscal: formData.i_fiscal,
        n_article: formData.n_article,
        commentaire: formData.commentaire,
        c_affaire_fact: parseFloat(formData.c_affaire_fact) || 0,
        c_affaire_bl: parseFloat(formData.c_affaire_bl) || 0
      };

      // Récupérer le type de base de données depuis localStorage
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';

      const response = await fetch(`/api/sales/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema,
          'X-Database-Type': dbType
        },
        body: JSON.stringify(clientData)
      });

      const result = await response.json();

      if (result.success) {
        showSuccessToast(`✅ Client ${formData.nclient} modifié avec succès !`);
        
        // Attendre un peu pour que l'utilisateur voie le toast
        setTimeout(() => {
          router.push('/dashboard?tab=clients&message=Client modifié avec succès');
        }, 2000);
      } else {
        setError(result.error || 'Erreur lors de la modification');
      }

    } catch (err) {
      console.error('Error updating client:', err);
      setError('Erreur lors de la modification du client');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard?tab=clients');
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

  if (clientLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Chargement du client...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Modifier le Client {formData.nclient}</h1>
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
                  Code Client (Non modifiable)
                </label>
                <input
                  type="text"
                  value={formData.nclient}
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
                  Raison Sociale *
                </label>
                <input
                  type="text"
                  name="raison_sociale"
                  value={formData.raison_sociale}
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Adresse
              </label>
              <textarea
                name="adresse"
                value={formData.adresse}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Personne de Contact
                </label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  N° Registre Commerce (NRC)
                </label>
                <input
                  type="text"
                  name="nrc"
                  value={formData.nrc}
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
                  Identifiant Fiscal
                </label>
                <input
                  type="text"
                  name="i_fiscal"
                  value={formData.i_fiscal}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  CA Factures (DA)
                </label>
                <input
                  type="number"
                  name="c_affaire_fact"
                  value={formData.c_affaire_fact}
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
                  name="c_affaire_bl"
                  value={formData.c_affaire_bl}
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
                {loading ? 'Modification...' : '✅ Modifier le Client'}
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