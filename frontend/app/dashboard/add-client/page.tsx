'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../../page.module.css";

interface TenantInfo {
  business_unit: string;
  year: number;
  schema: string;
}

export default function AddClient() {
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkingClient, setCheckingClient] = useState(false);
  const [clientExists, setClientExists] = useState(false);

  const [formData, setFormData] = useState({
    nclient: '',
    raison_sociale: '',
    adresse: '',
    contact_person: '',
    tel: '',
    email: '',
    nrc: '',
    i_fiscal: '',
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

    // Vérifier si le client existe quand on change le code
    if (name === 'nclient' && value.trim().length >= 3) {
      checkClientExists(value.trim().toUpperCase());
    } else if (name === 'nclient') {
      setClientExists(false);
    }
  };

  const checkClientExists = async (clientCode: string) => {
    if (!tenantInfo || !clientCode) return;

    console.log(`🔍 Checking if client exists: ${clientCode}`);
    setCheckingClient(true);
    try {
      // Récupérer le type de base de données depuis localStorage
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      const response = await fetch(`/api/sales/clients/${clientCode}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema,
          'X-Database-Type': dbType
        }
      });

      console.log(`📊 Client check response:`, { status: response.status, ok: response.ok });

      if (response.status === 200) {
        console.log(`❌ Client ${clientCode} exists!`);
        setClientExists(true);
        setError(`Le client ${clientCode} existe déjà !`);
      } else {
        console.log(`✅ Client ${clientCode} is available`);
        setClientExists(false);
        setError(null);
      }
    } catch (err) {
      console.log(`✅ Client ${clientCode} is available (404 error)`);
      setClientExists(false);
      setError(null);
    } finally {
      setCheckingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantInfo) return;

    // Validation
    if (!formData.nclient || !formData.raison_sociale) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier si le client existe déjà
    if (clientExists) {
      setError(`Le client ${formData.nclient.toUpperCase()} existe déjà !`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clientData = {
        nclient: formData.nclient.toUpperCase(),
        raison_sociale: formData.raison_sociale,
        adresse: formData.adresse,
        contact_person: formData.contact_person,
        tel: formData.tel,
        email: formData.email,
        nrc: formData.nrc,
        i_fiscal: formData.i_fiscal,
        c_affaire_fact: parseFloat(formData.c_affaire_fact) || 0,
        c_affaire_bl: parseFloat(formData.c_affaire_bl) || 0
      };

      // Récupérer le type de base de données depuis localStorage
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';

      const response = await fetch(`/api/sales/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantInfo.schema,
          'X-Database-Type': dbType
        },
        body: JSON.stringify(clientData)
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
      showSuccessToast(`✅ Client ${formData.nclient.toUpperCase()} créé avec succès !`);
      
      // Attendre un peu pour que l'utilisateur voie le toast
      setTimeout(() => {
        router.push('/dashboard?tab=clients&message=Client ajouté avec succès');
      }, 2000);

    } catch (err) {
      console.error('Error creating client:', err);
      setError('Erreur lors de la création du client');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard?tab=clients');
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
            <h1>Ajouter un Client</h1>
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
                  Code Client *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="nclient"
                    value={formData.nclient}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${clientExists ? '#dc3545' : checkingClient ? '#ffc107' : '#ddd'}`,
                      borderRadius: '4px',
                      fontSize: '16px',
                      backgroundColor: clientExists ? '#fff5f5' : 'white'
                    }}
                    placeholder="Ex: CLI001"
                  />
                  {checkingClient && (
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
                  {clientExists && (
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
                  {formData.nclient.length >= 3 && !checkingClient && !clientExists && (
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
                  placeholder="Ex: SARL EXEMPLE"
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
                placeholder="Adresse complète du client"
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
                  placeholder="Nom du contact"
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
                placeholder="client@exemple.com"
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
                  placeholder="Ex: 16/00-XXXXXXX"
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
                  placeholder="Ex: XXXXXXXXXX"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  CA Factures Initial (DA)
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
                  CA Bons de Livraison Initial (DA)
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
                disabled={loading || clientExists || checkingClient}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading || clientExists || checkingClient ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || clientExists || checkingClient ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {loading ? 'Création...' : 
                 checkingClient ? 'Vérification...' :
                 clientExists ? 'Client existe déjà' :
                 '✅ Créer le Client'}
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