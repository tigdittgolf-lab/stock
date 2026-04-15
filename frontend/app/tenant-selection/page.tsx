'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';

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
      
      const userInfoStr = localStorage.getItem('user_info');
      if (!userInfoStr) {
        console.error('No user info found, redirecting to login');
        router.push('/login');
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      console.log('👤 User info:', userInfo);

      const userBusinessUnits = userInfo.business_units || [];
      
      // CORRECTION CRITIQUE: Si admin, ne pas vérifier business_units
      if (userInfo.role !== 'admin' && userBusinessUnits.length === 0) {
        console.warn('⚠️ User has no business units assigned');
        setBusinessUnits([]);
        return;
      }

      if (userInfo.role === 'admin') {
        console.log('👨‍💼 Utilisateur ADMIN détecté: accès complet à tous les schémas');
      } else {
        console.log('🔐 BU autorisées pour cet utilisateur:', userBusinessUnits);
      }

      const dbConfig = localStorage.getItem('activeDbConfig');
      const dbType = dbConfig ? JSON.parse(dbConfig).type : 'supabase';
      
      console.log('📊 Base de données active:', dbType);

      // Priorité 1: utiliser business_units (registre officiel) — inclut les schémas enregistrés
      if (dbType === 'supabase') {
        try {
          const response = await fetch('/api/admin/business-units');
          const data = await response.json();
          
          if (data.success && data.data && data.data.length > 0) {
            let buData = data.data;
            
            // Filtrer selon les permissions si non-admin
            if (userInfo.role !== 'admin') {
              buData = buData.filter((bu: any) => userBusinessUnits.includes(bu.schema_name));
            }

            // Trier par année décroissante
            buData.sort((a: any, b: any) => (b.year || 0) - (a.year || 0));

            const buList = buData.map((bu: any) => {
              const year = bu.year || bu.schema_name?.split('_')[0] || '?';
              const buCode = bu.bu_code || bu.schema_name?.split('_')[1]?.toUpperCase() || '';
              const nom = bu.nom_entreprise || '';
              return {
                id: bu.schema_name,
                name: nom
                  ? `${nom} (${year} · ${buCode})`
                  : `${buCode} — ${year}`,
                description: bu.schema_name,
              };
            });

            console.log('🏢 BU disponibles depuis registre:', buList.map((b: any) => b.id));
            setBusinessUnits(buList);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erreur chargement business_units, fallback découverte:', error);
        }

        // Fallback: discover_tenant_schemas
        try {
          const response = await fetch('/api/admin/discover-supabase-schemas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: 'https://szgodrjglbpzkrksnroi.supabase.co',
              key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
            })
          });
          const data = await response.json();
          if (data.success && data.databases) {
            const allSchemas = [...data.databases.tenant, ...data.databases.other].map((db: any) => db.name);
            let filteredSchemas = userInfo.role === 'admin' ? allSchemas : allSchemas.filter((s: string) => userBusinessUnits.includes(s));
            const buList = filteredSchemas.map((schema: string) => {
              const parts = schema.split('_');
              const year = parts[0];
              const buCode = parts[1]?.replace('bu','').toUpperCase() || '';
              return { id: schema, name: `BU ${buCode} (${year})`, description: schema };
            });
            setBusinessUnits(buList);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Erreur découverte Supabase, fallback sur API exercises:', error);
        }
      }

      // Fallback: utiliser l'API exercises
      const response = await fetch(getApiUrl('auth/exercises'), {
        headers: {
          'X-Database-Type': dbType
        }
      });
      const data = await response.json();
      
      console.log('📊 Tous les BU disponibles depuis', dbType, ':', data);
      
      if (data.success && data.data && data.data.length > 0) {
        // CORRECTION CRITIQUE: Si admin, montrer TOUS les exercices
        let filteredBUs;
        if (userInfo.role === 'admin') {
          console.log('👨‍💼 Utilisateur ADMIN: accès à TOUS les exercices');
          filteredBUs = data.data;
        } else {
          filteredBUs = data.data.filter((exercise: any) => {
            return userBusinessUnits.includes(exercise.schema_name);
          });
        }

        console.log('✅ BU filtrées:', filteredBUs);

        const buList = filteredBUs.map((exercise: any) => {
          const year = exercise.year || exercise.schema_name?.split('_')[0] || '?';
          const buCode = exercise.bu_code || exercise.schema_name?.split('_')[1]?.toUpperCase() || '';
          const nom = exercise.nom_entreprise || '';
          return {
            id: exercise.schema_name,
            name: nom ? `${nom} (${year} · ${buCode})` : `${buCode} — ${year}`,
            description: exercise.schema_name,
          };
        });

        console.log('🏢 BU disponibles pour l\'utilisateur:', buList);
        setBusinessUnits(buList);
        return;
      }

      console.log('⚠️ API échouée, utilisation des BU de l\'utilisateur...');
      
      // CORRECTION: Si admin et API échoue, essayer de lister tous les schémas
      if (userInfo.role === 'admin') {
        console.log('👨‍💼 Admin: tentative de liste complète des schémas...');
        // Pour l'instant, utiliser les BU de l'utilisateur comme fallback
      }
      
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
      setBusinessUnits([]);
    }
  };

  const loadExercises = async () => {
    try {
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
      const schema = selectedBU;
      const parts = schema.split('_');
      const year = parseInt(parts[0]);
      const buCode = parts[1];

      const tenantInfo = {
        business_unit: buCode,
        year: year,
        schema: schema
      };

      localStorage.setItem('selectedTenant', schema);
      localStorage.setItem('tenant_info', JSON.stringify(tenantInfo));

      console.log('✅ Tenant sélectionné:', tenantInfo);

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
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Effet de fond décoratif */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(80px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '50%',
        filter: 'blur(80px)'
      }} />

      <div style={{
        background: 'var(--card-background)',
        padding: '48px',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '700px',
        border: '1px solid var(--border-color)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
          }}>
            🏢
          </div>
          
          <h1 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: '12px',
            fontSize: '2.5rem',
            fontWeight: '700',
            letterSpacing: '-0.5px'
          }}>
            Sélection du Contexte
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '18px',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Choisissez votre unité d'affaires pour continuer
          </p>
            
          {/* Badges d'information */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginBottom: '8px'
          }}>
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
                  let displayType = config.type;
                  if (config.type === 'mysql' && config.port === 3307) {
                    displayType = 'mariadb';
                  }
                  
                  return (
                    <div style={{ 
                      padding: '10px 20px',
                      background: 'var(--background-secondary)',
                      border: `2px solid ${dbColors[displayType]}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>{dbIcons[displayType]}</span>
                      <span>{config.name}</span>
                    </div>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}
            
            {/* Badge utilisateur */}
            {(() => {
              try {
                const userInfo = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
                const user = userInfo ? JSON.parse(userInfo) : null;
                if (user) {
                  const roleIcon = user.role === 'admin' ? '👨‍💼' : user.role === 'manager' ? '👔' : '👤';
                  const roleLabel = user.role === 'admin' ? 'Administrateur' : user.role === 'manager' ? 'Manager' : 'Utilisateur';
                  const roleColor = user.role === 'admin' ? 'var(--error-color)' : user.role === 'manager' ? 'var(--warning-color)' : 'var(--info-color)';
                  
                  return (
                    <div style={{ 
                      padding: '10px 20px',
                      background: 'var(--background-secondary)',
                      border: `2px solid ${roleColor}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>{roleIcon}</span>
                      <span>{roleLabel}</span>
                    </div>
                  );
                }
                return null;
              } catch {
                return null;
              }
            })()}
          </div>
        </div>

        {/* Formulaire de sélection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '12px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            fontSize: '16px'
          }}>
            📊 Unité d'Affaires
          </label>
          <select
            value={selectedBU}
            onChange={(e) => setSelectedBU(e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '16px',
              backgroundColor: 'var(--background)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: '500'
            }}
          >
            <option value="">Sélectionner une unité d'affaires</option>
            {businessUnits.map((bu, index) => (
              <option key={`${bu.id}-${index}`} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </select>
          
          {businessUnits.length === 0 && (
            <p style={{ 
              marginTop: '12px', 
              color: 'var(--warning-color)', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ Aucune unité d'affaires disponible
            </p>
          )}
        </div>

        {/* Aperçu de la sélection */}
        {selectedBU && (
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: 'var(--background-secondary)',
            borderRadius: '12px',
            border: '2px solid var(--primary-color)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '24px' }}>✅</span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--text-primary)' 
              }}>
                Schéma sélectionné
              </span>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '15px', 
              color: 'var(--text-secondary)',
              paddingLeft: '36px',
              fontFamily: 'monospace'
            }}>
              {selectedBU}
            </p>
          </div>
        )}

        {/* Bouton de connexion */}
        <button
          onClick={handleConnect}
          disabled={loading || !selectedBU}
          style={{
            width: '100%',
            padding: '18px',
            background: !selectedBU 
              ? 'var(--background-tertiary)' 
              : 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%)',
            color: !selectedBU ? 'var(--text-tertiary)' : 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: !selectedBU ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: !selectedBU ? 'none' : '0 4px 16px rgba(102, 126, 234, 0.4)',
            transform: loading ? 'scale(0.98)' : 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (selectedBU && !loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedBU && !loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
            }
          }}
        >
          {loading ? '⏳ Connexion en cours...' : '🚀 Se Connecter'}
        </button>

        {/* Actions secondaires */}
        <div style={{ 
          marginTop: '32px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--background-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
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
                    background: 'var(--success-color-light)',
                    border: '2px solid var(--success-color)',
                    color: 'var(--success-color)',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--success-color)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--success-color-light)';
                    e.currentTarget.style.color = 'var(--success-color)';
                  }}
                >
                  ➕ Nouvel exercice
                </button>
              ) : null;
            } catch {
              return null;
            }
          })()}
        </div>
      </div>
    </div>
  );
}
