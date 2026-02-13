'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import styles from '../page.module.css';

interface BusinessUnit {
  id: string;
  name: string;
  description: string;
}

interface Exercise {
  year: number;
  status: 'active' | 'closed' | 'archived';
}

export default function TenantSelection() {
  const router = useRouter();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedBU, setSelectedBU] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserBusinessUnits();
    loadExercises();
  }, []);

  const loadUserBusinessUnits = async () => {
    try {
      console.log('🔍 Chargement des BU autorisées pour l\'utilisateur...');
      
      // CORRECTION: Récupérer les BU autorisées depuis user_info
      const userInfoStr = localStorage.getItem('user_info');
      if (!userInfoStr) {
        console.error('No user info found, redirecting to login');
        router.push('/login');
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      console.log('👤 User info:', userInfo);

      const userBusinessUnits = userInfo.business_units || [];
      
      if (userBusinessUnits.length === 0) {
        console.warn('⚠️ User has no business units assigned');
        setBusinessUnits([]);
        return;
      }

      console.log('🔐 BU autorisées pour cet utilisateur:', userBusinessUnits);

      // Récupérer la config de la base de données active
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      console.log('📊 Base de données active:', dbType);

      // Charger TOUS les BU disponibles depuis l'API avec le bon type de base
      const response = await fetch(getApiUrl('auth/exercises'), {
        headers: {
          'X-Database-Type': dbType
        }
      });
      const data = await response.json();
      
      console.log('📊 Tous les BU disponibles depuis', dbType, ':', data);
      
      if (data.success && data.data && data.data.length > 0) {
        // FILTRER uniquement les BU auxquelles l'utilisateur a accès
        const filteredBUs = data.data.filter((exercise: any) => {
          return userBusinessUnits.includes(exercise.schema_name);
        });

        console.log('✅ BU filtrées (autorisées):', filteredBUs);

        // Transformer les données filtrées en objets BusinessUnit
        const buList = filteredBUs.map((exercise: any) => {
          return {
            id: exercise.schema_name,
            name: `Business Unit ${exercise.bu_code} (${exercise.year})`,
            description: `${exercise.nom_entreprise} - ${exercise.schema_name}`
          };
        });

        console.log('🏢 BU disponibles pour l\'utilisateur:', buList);
        setBusinessUnits(buList);
        return;
      }

      // Fallback: utiliser directement les BU de l'utilisateur
      console.log('⚠️ API échouée, utilisation des BU de l\'utilisateur...');
      
      // Transformer les schémas en objets BusinessUnit
      const buList = userBusinessUnits.map((schema: string) => {
        const parts = schema.split('_');
        const year = parts[0];
        const buCode = parts[1];
        
        return {
          id: schema,
          name: `Business Unit ${buCode.replace('bu', '')} (${year})`,
          description: `Schéma: ${schema}`
        };
      });

      console.log('🏢 BU disponibles (fallback):', buList);
      setBusinessUnits(buList);
    } catch (error) {
      console.error('❌ Error loading business units:', error);
      // En cas d'erreur, ne pas afficher de BU par défaut
      setBusinessUnits([]);
    }
  };

  const loadExercises = async () => {
    try {
      // Récupérer la config de la base de données active
      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      const response = await fetch(getApiUrl('auth/exercises'), {
        headers: {
          'X-Database-Type': dbType
        }
      });
      const data = await response.json();
      if (data.success) {
        setExercises(data.data);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      // Fallback data
      const currentYear = new Date().getFullYear();
      setExercises([
        { year: currentYear, status: 'active' },
        { year: currentYear - 1, status: 'closed' },
        { year: currentYear - 2, status: 'archived' }
      ]);
    }
  };

  const handleConnect = async () => {
    if (!selectedBU) {
      alert('Veuillez sélectionner une unité d\'affaires');
      return;
    }

    setLoading(true);
    try {
      // Le selectedBU contient déjà le schéma complet (ex: "2025_bu01")
      const schema = selectedBU;
      const parts = schema.split('_');
      const year = parseInt(parts[0]);
      const buCode = parts[1];

      // Stocker les informations du tenant
      const tenantInfo = {
        business_unit: buCode,
        year: year,
        schema: schema
      };

      localStorage.setItem('selectedTenant', schema);
      localStorage.setItem('tenant_info', JSON.stringify(tenantInfo));

      console.log('✅ Tenant sélectionné:', tenantInfo);

      // Rediriger vers le dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error setting tenant:', error);
      alert('Erreur lors de la connexion au tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          minWidth: '400px',
          maxWidth: '500px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>Système de Gestion de Stock</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>Sélectionnez votre unité d'affaires</p>
            
            {/* Indicateur de base de données active */}
            {(() => {
              try {
                const dbConfig = typeof window !== 'undefined' ? localStorage.getItem('activeDbConfig') : null;
                const config = dbConfig ? JSON.parse(dbConfig) : null;
                if (config) {
                  const dbIcons: Record<string, string> = {
                    'supabase': '☁️',
                    'mysql': '🐬',
                    'mariadb': '🦭',
                    'postgresql': '🐘'
                  };
                  const dbColors: Record<string, string> = {
                    'supabase': '#3ecf8e',
                    'mysql': '#00758f',
                    'mariadb': '#c0765a',
                    'postgresql': '#336791'
                  };
                  // Déterminer l'icône et la couleur basée sur le port pour MariaDB
                  let displayType = config.type;
                  if (config.type === 'mysql' && config.port === 3307) {
                    displayType = 'mariadb';
                  }
                  
                  return (
                    <div style={{ 
                      marginTop: '10px',
                      padding: '8px 16px',
                      background: `${dbColors[displayType]}15`,
                      border: `1px solid ${dbColors[displayType]}`,
                      borderRadius: '20px',
                      display: 'inline-block',
                      fontSize: '13px',
                      color: dbColors[displayType],
                      fontWeight: '500'
                    }}>
                      {dbIcons[displayType]} Base de données: <strong>{config.name}</strong>
                    </div>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}
            
            {(() => {
              try {
                const userInfo = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
                const user = userInfo ? JSON.parse(userInfo) : null;
                if (user) {
                  const roleIcon = user.role === 'admin' ? '👨‍💼' : user.role === 'manager' ? '👔' : '👤';
                  const roleLabel = user.role === 'admin' ? 'Administrateur' : user.role === 'manager' ? 'Manager' : 'Utilisateur';
                  return (
                    <div style={{ 
                      marginTop: '10px',
                      padding: '8px 16px',
                      background: user.role === 'admin' ? '#e7f3ff' : user.role === 'manager' ? '#fff3cd' : '#f8f9fa',
                      borderRadius: '20px',
                      display: 'inline-block',
                      fontSize: '13px',
                      color: '#495057'
                    }}>
                      {roleIcon} Connecté en tant que <strong>{roleLabel}</strong> ({user.username})
                    </div>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Unité d'Affaires:
            </label>
            <select
              value={selectedBU}
              onChange={(e) => setSelectedBU(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="">Sélectionner une unité d'affaires</option>
              {businessUnits.map((bu, index) => (
                <option key={`${bu.id}-${index}`} value={bu.id}>
                  {bu.name} - {bu.description}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading || !selectedBU}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: !selectedBU ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: !selectedBU ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {loading ? 'Connexion...' : 'Se Connecter'}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              ← Retour à la connexion
            </button>
            
            {/* Bouton Créer exercice - Visible uniquement pour les admins */}
            {(() => {
              try {
                const userInfo = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
                const user = userInfo ? JSON.parse(userInfo) : null;
                return user?.role === 'admin' ? (
                  <button
                    onClick={() => router.push('/new-exercise')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#28a745',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ➕ Créer un nouvel exercice
                  </button>
                ) : null;
              } catch {
                return null;
              }
            })()}
          </div>

          {selectedBU && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                <strong>Schéma sélectionné:</strong> {selectedBU}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}