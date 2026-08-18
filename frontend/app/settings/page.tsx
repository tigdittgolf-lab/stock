'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from "../page.module.css";

interface Family {
  famille: string;
}

interface Activity {
  id?: number;
  code_activite?: string;
  domaine_activite?: string;
  sous_domaine?: string;
  raison_sociale?: string;
  adresse?: string;
  commune?: string;
  wilaya?: string;
  tel_fixe?: string;
  tel_port?: string;
  nrc?: string;
  nis?: string;
  nart?: string;
  ident_fiscal?: string;
  banq?: string;
  entete_bon?: string;
  e_mail?: string;
  nom_entreprise?: string;
  telephone?: string;
  email?: string;
  nif?: string;
  rc?: string;
  logo_url?: string;
  slogan?: string;
  activite?: string;
  created_at?: string;
  updated_at?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  fontSize: '14px'
};

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('families');
  const [userRole, setUserRole] = useState<string>('');
  
  // États pour les familles
  const [families, setFamilies] = useState<Family[]>([]);
  const [newFamily, setNewFamily] = useState('');
  
  // États pour les informations entreprise
  const [companyInfo, setCompanyInfo] = useState<Activity | null>(null);
  const [editingCompany, setEditingCompany] = useState(false);
  
  // États pour la base de données (admin)
  const [dbConfig, setDbConfig] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  
  // États communs
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get tenant from localStorage
  const getTenant = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedTenant') || '2025_bu01';
    }
    return '2025_bu01';
  };

  // getToken depuis localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || '';
    }
    return '';
  };

  useEffect(() => {
    try {
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        setUserRole(JSON.parse(userInfo).role || '');
      }
    } catch { /* ignore */ }
  }, []);

  // Show message
  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 3000);
  };

  // Fetch families
  const fetchFamilies = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des familles...');
      
      const response = await fetch(getApiUrl('settings/families'), {
        headers: {
          'X-Tenant': getTenant()
        }
      });
      const result = await response.json();
      
      console.log('📊 Réponse API families:', result);
      
      if (result.success && result.data) {
        console.log('🔍 Données familles reçues:', result.data);
        
        // L'API retourne un tableau d'objets avec la propriété 'famille'
        const familiesArray = Array.isArray(result.data) 
          ? result.data.map((item: any) => ({ 
              famille: String(item.famille || item) 
            }))
          : [];
        
        setFamilies(familiesArray);
        console.log('✅ Familles chargées:', familiesArray.length, familiesArray);
      } else {
        console.log('⚠️ Pas de familles trouvées');
        setFamilies([]);
        if (result.debug) {
          console.log('🔍 Debug info:', result.debug);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching families:', error);
      showMessage('Erreur de connexion', true);
    } finally {
      setLoading(false);
    }
  };

  // Create family
  const createFamily = async () => {
    if (!newFamily.trim()) {
      showMessage('Veuillez saisir un nom de famille', true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(getApiUrl('settings/families'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': getTenant()
        },
        body: JSON.stringify({ famille: newFamily.trim() })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNewFamily('');
        fetchFamilies();
        showMessage('Famille créée avec succès !');
      } else {
        showMessage(result.error || 'Erreur lors de la création', true);
      }
    } catch (error) {
      console.error('Error creating family:', error);
      showMessage('Erreur lors de la création', true);
    } finally {
      setLoading(false);
    }
  };

  // Delete family
  const deleteFamily = async (famille: string) => {
    if (!confirm(`Supprimer la famille "${famille}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`settings/families/${encodeURIComponent(famille)}`), {
        method: 'DELETE',
        headers: {
          'X-Tenant': getTenant()
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchFamilies();
        showMessage('Famille supprimée avec succès !');
      } else {
        showMessage(result.error || 'Erreur lors de la suppression', true);
      }
    } catch (error) {
      console.error('Error deleting family:', error);
      showMessage('Erreur lors de la suppression', true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch company info
  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des informations entreprise...');
      
      const response = await fetch(getApiUrl('settings/activities'), {
        headers: {
          'X-Tenant': getTenant()
        }
      });
      const result = await response.json();
      
      console.log('📊 Réponse API activities:', result);
      
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // L'API retourne un tableau, prendre le premier élément
        const data = result.data[0];
        
        // Créer un objet propre sans propriétés supplémentaires
        const cleanCompanyInfo: Activity = {
          id: typeof data.id === 'number' ? data.id : 1,
          nom_entreprise: String(data.nom_entreprise || data.raison_sociale || 'Mon Entreprise'),
          adresse: String(data.adresse || ''),
          telephone: String(data.telephone || data.tel_fixe || data.tel_port || ''),
          email: String(data.email || data.e_mail || ''),
          nif: String(data.nif || data.ident_fiscal || ''),
          rc: String(data.rc || data.nrc || ''),
          activite: String(data.activite || data.sous_domaine || ''),
          slogan: String(data.slogan || ''),
          created_at: String(data.created_at || new Date().toISOString())
        };
        
        setCompanyInfo(cleanCompanyInfo);
        console.log('✅ Informations entreprise chargées:', cleanCompanyInfo);
        console.log('🔍 Données brutes sous_domaine:', data.sous_domaine, 'activite:', data.activite);
      } else {
        console.log('⚠️ Pas de données, utilisation des valeurs par défaut');
        // Créer une activité par défaut si aucune n'existe
        setCompanyInfo({
          id: 0,
          nom_entreprise: '',
          adresse: '',
          telephone: '',
          email: '',
          nif: '',
          rc: '',
          activite: '',
          slogan: '',
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error fetching company info:', error);
      showMessage('Erreur de connexion', true);
    } finally {
      setLoading(false);
    }
  };

  // Update company info
  const updateCompanyInfo = async () => {
    if (!companyInfo) return;

    try {
      setLoading(true);
      
      let response;
      if (companyInfo.id === 0) {
        // Créer si n'existe pas
        response = await fetch(getApiUrl('settings/activities'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant': getTenant()
          },
          body: JSON.stringify(companyInfo)
        });
      } else {
        // Mettre à jour si existe - utiliser POST au lieu de PUT
        response = await fetch(getApiUrl('settings/activities'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant': getTenant()
          },
          body: JSON.stringify(companyInfo)
        });
      }
      
      const result = await response.json();
      
      if (result.success) {
        setEditingCompany(false);
        fetchCompanyInfo();
        showMessage('Informations mises à jour avec succès !');
      } else {
        showMessage(result.error || 'Erreur lors de la mise à jour', true);
      }
    } catch (error) {
      console.error('Error updating company info:', error);
      showMessage('Erreur lors de la mise à jour', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'families') {
      fetchFamilies();
    } else if (activeTab === 'company') {
      fetchCompanyInfo();
    } else if (activeTab === 'database') {
      fetchDatabaseConfig();
    }
  }, [activeTab]);

  // Fonctions pour la base de données (admin)
  const fetchDatabaseConfig = async () => {
    try {
      setDbLoading(true);
      setDbMessage(null);
      const res = await fetch(getApiUrl('database-config'), {
        headers: { 'X-Tenant': getTenant() }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const cfg = data.data;
        setDbConfig({
          type: cfg.type || 'mysql',
          name: cfg.name || 'MySQL Local',
          host: cfg.host || 'localhost',
          port: cfg.port || 3306,
          database: cfg.database || 'stock_management',
          username: cfg.username || 'root',
          supabaseUrl: cfg.supabaseUrl || ''
        });
      } else {
        setDbConfig({ type: 'mysql', name: 'MySQL Local', host: 'localhost', port: 3306, database: 'stock_management', username: 'root', supabaseUrl: '' });
      }
    } catch (err) {
      console.error('Erreur lecture config DB:', err);
      setDbMessage({ type: 'err', text: 'Impossible de lire la configuration.' });
    } finally {
      setDbLoading(false);
    }
  };

  const switchDatabase = async (apply: boolean, customConfig?: any) => {
    if (!dbConfig) return;
    setDbLoading(true);
    setDbMessage(null);
    try {
      const endpoint = apply ? 'database-config/switch' : 'database-config/test';
      let payload: any;
      if (customConfig) {
        payload = { config: customConfig };
      } else {
        payload = {
          config: {
            type: dbConfig.type,
            name: dbConfig.name,
            host: dbConfig.type === 'supabase' ? undefined : dbConfig.host,
            port: dbConfig.type === 'supabase' ? undefined : parseInt(dbConfig.port || 3306),
            database: dbConfig.type === 'supabase' ? undefined : (dbConfig.database || 'stock_management'),
            username: dbConfig.type === 'supabase' ? undefined : dbConfig.username,
            password: dbConfig.type === 'supabase' ? undefined : (dbConfig.password || ''),
            supabaseUrl: dbConfig.type === 'supabase' ? (dbConfig.supabaseUrl || undefined) : undefined,
            supabaseKey: dbConfig.type === 'supabase' ? (dbConfig.supabaseKey || undefined) : undefined
          }
        };
      }

      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': getTenant(),
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        if (apply) {
          setDbMessage({ type: 'ok', text: data.message || 'Base de données changée.' });
          // Mettre à jour localStorage pour le frontend (type normalisé côté backend)
          const normalizedType = dbConfig.type === 'mariadb' ? 'mysql' : dbConfig.type;
          localStorage.setItem('activeDbConfig', JSON.stringify({
            type: normalizedType,
            name: dbConfig.name,
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            username: dbConfig.username,
            supabaseUrl: dbConfig.supabaseUrl,
            isActive: true,
            lastTested: new Date().toISOString()
          }));
          window.location.reload();
        } else {
          setDbMessage({ type: 'ok', text: data.message || 'Connexion testée avec succès.' });
        }
      } else {
        setDbMessage({ type: 'err', text: data.error || 'Échec de la connexion.' });
      }
    } catch (err) {
      console.error('Erreur DB config:', err);
      setDbMessage({ type: 'err', text: 'Erreur lors de la requête.' });
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>⚙️ Paramètres du Système</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Gérez les paramètres de votre application
            </div>
          </div>
          <button 
            onClick={() => router.back()}
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
        
        {/* Navigation des onglets */}
        <nav style={{ 
          display: 'flex', 
          gap: '10px', 
          marginTop: '20px',
          borderBottom: '1px solid #dee2e6',
          paddingBottom: '10px'
        }}>
          <button
            onClick={() => setActiveTab('families')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'families' ? '#007bff' : 'transparent',
              color: activeTab === 'families' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📂 Familles d'Articles
          </button>
          <button
            onClick={() => setActiveTab('company')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'company' ? '#28a745' : 'transparent',
              color: activeTab === 'company' ? 'white' : '#28a745',
              border: '1px solid #28a745',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            🏢 Informations Entreprise
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('database')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'database' ? '#dc3545' : 'transparent',
                color: activeTab === 'database' ? 'white' : '#dc3545',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🗄️ Base de Données
            </button>
          )}
        </nav>
      </header>

      <main className={styles.main} style={{ paddingTop: '160px' }}>
        {/* Messages */}
        {message && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '5px',
            margin: '0 0 20px 0',
            border: '1px solid #c3e6cb'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '5px',
            margin: '0 0 20px 0',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Contenu des onglets */}
        {activeTab === 'families' && (
          <>
            {/* Add Family Section */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: '0 0 15px 0', color: '#212529' }}>Ajouter une Famille</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newFamily}
                  onChange={(e) => setNewFamily(e.target.value)}
                  placeholder="Nom de la famille (ex: Electricité, Plomberie...)"
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && createFamily()}
                  disabled={loading}
                />
                <button
                  onClick={createFamily}
                  disabled={loading || !newFamily.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Ajout...' : '➕ Ajouter'}
                </button>
              </div>
            </div>

            {/* Families List */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 15px 0', color: '#212529' }}>
                Familles Existantes ({families.length})
              </h2>

              {loading && families.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                  Chargement des familles...
                </div>
              ) : families.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#6c757d',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  border: '2px dashed #dee2e6'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📂</div>
                  <p style={{ margin: '0', fontSize: '16px' }}>Aucune famille créée</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Commencez par ajouter votre première famille</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {families.map((family, index) => (
                    <div
                      key={family.famille}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '15px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        background: '#f8f9fa'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          background: '#007bff', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          marginRight: '10px',
                          fontWeight: 'bold'
                        }}>
                          #{index + 1}
                        </span>
                        <span style={{ fontWeight: '500', fontSize: '16px' }}>
                          {family.famille}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteFamily(family.famille)}
                        disabled={loading}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={{
              background: '#e7f3ff',
              border: '1px solid #b8daff',
              padding: '15px',
              borderRadius: '4px',
              marginTop: '20px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#004085' }}>💡 Instructions</h3>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#004085' }}>
                <li>Créez les familles d'articles pour organiser votre stock</li>
                <li>Une fois les familles créées, vous pourrez créer des articles sans erreur</li>
                <li>Exemples de familles : Electricité, Plomberie, Outillage, Peinture</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === 'company' && (
          <>
            {/* Company Info Section */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', color: '#212529' }}>
                  🏢 Informations de l'Entreprise
                </h2>
                <button
                  onClick={() => setEditingCompany(!editingCompany)}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: editingCompany ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {editingCompany ? '❌ Annuler' : '✏️ Modifier'}
                </button>
              </div>

              {loading && !companyInfo ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                  Chargement des informations...
                </div>
              ) : companyInfo ? (
                <>
                  {editingCompany ? (
                    // Mode édition
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                          Nom de l'entreprise
                        </label>
                        <input
                          type="text"
                          value={companyInfo.nom_entreprise || ''}
                          onChange={(e) => setCompanyInfo({...companyInfo, nom_entreprise: e.target.value})}
                          placeholder="Nom de l'entreprise"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: '#f8f9fa'
                          }}
                          disabled={true}
                          title="Le nom de l'entreprise ne peut être modifié que par l'administrateur"
                        />
                        <small style={{ color: '#6c757d', fontSize: '12px' }}>
                          ⚠️ Modifiable uniquement par l'administrateur
                        </small>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={companyInfo.adresse || ''}
                          onChange={(e) => setCompanyInfo({...companyInfo, adresse: e.target.value})}
                          placeholder="Adresse de l'entreprise"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                          Téléphone
                        </label>
                        <input
                          type="text"
                          value={companyInfo.telephone || ''}
                          onChange={(e) => setCompanyInfo({...companyInfo, telephone: e.target.value})}
                          placeholder="Numéro de téléphone"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={companyInfo.email || ''}
                          onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                          placeholder="Adresse email"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                          NIF
                        </label>
                        <input
                          type="text"
                          value={companyInfo.nif || ''}
                          onChange={(e) => setCompanyInfo({...companyInfo, nif: e.target.value})}
                          placeholder="Numéro d'identification fiscale"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: '#f8f9fa'
                          }}
                          disabled={true}
                          title="Le NIF ne peut être modifié que par l'administrateur"
                        />
                        <small style={{ color: '#6c757d', fontSize: '12px' }}>
                          ⚠️ Modifiable uniquement par l'administrateur
                        </small>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                          RC
                        </label>
                        <input
                          type="text"
                          value={companyInfo.rc || ''}
                          onChange={(e) => setCompanyInfo({...companyInfo, rc: e.target.value})}
                          placeholder="Registre de commerce"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: '#f8f9fa'
                          }}
                          disabled={true}
                          title="Le RC ne peut être modifié que par l'administrateur"
                        />
                        <small style={{ color: '#6c757d', fontSize: '12px' }}>
                          ⚠️ Modifiable uniquement par l'administrateur
                        </small>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                          Activité
                        </label>
                        <textarea
                          value={companyInfo.activite || ''}
                          onChange={(e) => setCompanyInfo({...companyInfo, activite: e.target.value})}
                          placeholder="Description de l'activité principale"
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            resize: 'vertical'
                          }}
                          disabled={loading}
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                          Slogan
                        </label>
                        <input
                          type="text"
                          value={companyInfo.slogan || ''}
                          onChange={(e) => setCompanyInfo({...companyInfo, slogan: e.target.value})}
                          placeholder="Slogan de l'entreprise"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          disabled={loading}
                        />
                      </div>

                      <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                        <button
                          onClick={updateCompanyInfo}
                          disabled={loading}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: loading ? '#6c757d' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: '500'
                          }}
                        >
                          {loading ? 'Mise à jour...' : '✅ Enregistrer les Modifications'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                      <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#495057', fontSize: '16px' }}>
                          🏢 {companyInfo.nom_entreprise || 'Mon Entreprise'}
                        </h4>
                        {companyInfo.slogan && (
                          <p style={{ margin: '0', fontSize: '14px', color: '#6c757d', fontStyle: 'italic' }}>
                            "{companyInfo.slogan}"
                          </p>
                        )}
                      </div>

                      {companyInfo.adresse && (
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <strong style={{ color: '#495057' }}>📍 Adresse</strong><br />
                          <span style={{ fontSize: '14px' }}>{companyInfo.adresse}</span>
                        </div>
                      )}

                      {companyInfo.telephone && (
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <strong style={{ color: '#495057' }}>📞 Téléphone</strong><br />
                          <span style={{ fontSize: '14px' }}>{companyInfo.telephone}</span>
                        </div>
                      )}

                      {companyInfo.email && (
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <strong style={{ color: '#495057' }}>📧 Email</strong><br />
                          <span style={{ fontSize: '14px' }}>{companyInfo.email}</span>
                        </div>
                      )}

                      {companyInfo.nif && (
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <strong style={{ color: '#495057' }}>🆔 NIF</strong><br />
                          <span style={{ fontSize: '14px' }}>{companyInfo.nif}</span>
                        </div>
                      )}

                      {companyInfo.rc && (
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                          <strong style={{ color: '#495057' }}>📋 RC</strong><br />
                          <span style={{ fontSize: '14px' }}>{companyInfo.rc}</span>
                        </div>
                      )}

                      {companyInfo.activite && (
                        <div style={{ 
                          gridColumn: '1 / -1', 
                          padding: '15px', 
                          background: '#f8f9fa', 
                          borderRadius: '6px', 
                          border: '1px solid #dee2e6' 
                        }}>
                          <strong style={{ color: '#495057' }}>🎯 Activité</strong><br />
                          <span style={{ fontSize: '14px' }}>{companyInfo.activite}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#6c757d',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  border: '2px dashed #dee2e6'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏢</div>
                  <p style={{ margin: '0', fontSize: '16px' }}>Aucune information d'entreprise</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Contactez l'administrateur pour configurer votre entreprise</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={{
              background: '#e8f5e8',
              border: '1px solid #c3e6c3',
              padding: '15px',
              borderRadius: '4px',
              marginTop: '20px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>💡 Instructions</h3>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#155724' }}>
                <li><strong>Champs modifiables :</strong> Adresse, téléphone, email, activité, slogan</li>
                <li><strong>Champs protégés :</strong> Nom entreprise, NIF, RC (réservés à l'administrateur)</li>
                <li>Ces informations apparaîtront sur vos documents (factures, bons de livraison)</li>
                <li>Pour modifier les champs protégés, contactez l'administrateur système</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === 'database' && userRole === 'admin' && (
          <>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: '0 0 15px 0', color: '#212529' }}>
                🗄️ Configuration de la Base de Données
              </h2>
              <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px' }}>
                Configurez la source de données utilisée par StockApp. La modification est immédiate et persistante.
              </p>

              {dbMessage && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  background: dbMessage.type === 'ok' ? '#d4edda' : '#f8d7da',
                  color: dbMessage.type === 'ok' ? '#155724' : '#721c24',
                  border: `1px solid ${dbMessage.type === 'ok' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {dbMessage.text}
                </div>
              )}

              {dbLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
                  Chargement...
                </div>
              ) : dbConfig ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Type de base
                    </label>
                    <select
                      value={dbConfig.type}
                      onChange={(e) => setDbConfig({ ...dbConfig, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="mysql">🐬 MySQL / MariaDB local</option>
                      <option value="mariadb">🦭 MariaDB (WAMP, port 3307)</option>
                      <option value="supabase">☁️ Supabase Cloud</option>
                      <option value="postgresql">🐘 PostgreSQL local</option>
                    </select>
                  </div>

                  {(dbConfig.type === 'mysql' || dbConfig.type === 'mariadb') && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Hôte</label>
                          <input type="text" value={dbConfig.host || ''} onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })} placeholder="localhost" style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Port</label>
                          <input type="number" value={dbConfig.port || (dbConfig.type === 'mariadb' ? 3307 : 3306)} onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })} placeholder="3306" style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Base de données</label>
                          <input type="text" value={dbConfig.database || ''} onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })} placeholder="stock_management" style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Utilisateur</label>
                          <input type="text" value={dbConfig.username || ''} onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })} placeholder="root" style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Mot de passe</label>
                        <input type="password" value={dbConfig.password || ''} onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })} placeholder="••••••" style={inputStyle} />
                      </div>
                    </>
                  )}

                  {dbConfig.type === 'supabase' && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>URL Supabase</label>
                        <input type="text" value={dbConfig.supabaseUrl || ''} onChange={(e) => setDbConfig({ ...dbConfig, supabaseUrl: e.target.value })} placeholder="https://votre-projet.supabase.co" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Clé Service (Service Role Key)</label>
                        <input type="password" value={dbConfig.supabaseKey || ''} onChange={(e) => setDbConfig({ ...dbConfig, supabaseKey: e.target.value })} placeholder="eyJhbGci..." style={inputStyle} />
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#856404', background: '#fff3cd', padding: '10px', borderRadius: '4px', border: '1px solid #ffeeba' }}>
                        ⚠️ La clé sucrette n'est pas renvoyée par le serveur : re-saisissez-la si vous reconfigurez le cloud.
                      </p>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      onClick={() => switchDatabase(false)}
                      disabled={dbLoading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      🧪 Tester la connexion
                    </button>
                    <button
                      onClick={() => switchDatabase(true)}
                      disabled={dbLoading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: dbLoading ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: dbLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      💾 Appliquer et utiliser
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
                  Aucune donnée disponible.
                </div>
              )}
            </div>

            <div style={{
              background: '#e7f3ff',
              border: '1px solid #b8daff',
              padding: '15px',
              borderRadius: '4px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#004085' }}>💡 Conseil</h3>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#004085' }}>
                <li>Utilisez toujours <strong>Test</strong> avant d'appliquer une nouvelle base.</li>
                <li>Le mode pack offline utilise la base <strong>MariaDB locale embarquée</strong>.</li>
                <li>Le changement est immédiat et persiste après redémarrage.</li>
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}