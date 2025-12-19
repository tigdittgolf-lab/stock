'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../page.module.css";

interface AdminStats {
  totalBU: number;
  totalUsers: number;
  activeBU: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalBU: 0,
    totalUsers: 0,
    activeBU: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${window.location.origin}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>👨‍💼 Administration Système</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Gestion globale de l'application
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Retour au Dashboard
          </button>
        </div>
      </header>

      <main className={styles.main} style={{ paddingTop: '40px' }}>
        {/* Statistiques globales */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>Business Units</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.totalBU}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              {stats.activeBU} actives
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>Utilisateurs</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.totalUsers}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              {stats.activeUsers} actifs
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>Schémas DB</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.totalBU}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              Schémas créés
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>Système</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>✅ Opérationnel</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              Tous les services actifs
            </div>
          </div>
        </div>

        {/* Modules d'administration */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#212529' }}>🎛️ Modules d'Administration</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Gestion des BU */}
            <div 
              onClick={() => router.push('/admin/business-units')}
              style={{
                padding: '25px',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: '#f8f9ff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏢</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#667eea', fontSize: '20px' }}>
                Business Units
              </h3>
              <p style={{ margin: '0', color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
                Créer et gérer les unités commerciales, configurer les informations d'entreprise, gérer les années fiscales
              </p>
              <div style={{ 
                marginTop: '15px', 
                padding: '8px 16px', 
                background: '#667eea', 
                color: 'white', 
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Gérer les BU →
              </div>
            </div>

            {/* Configuration Base de Données */}
            <div 
              onClick={() => router.push('/admin/database-config')}
              style={{
                padding: '25px',
                border: '2px solid #6f42c1',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: '#f8f6ff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(111, 66, 193, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🗄️</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#6f42c1', fontSize: '20px' }}>
                Base de Données
              </h3>
              <p style={{ margin: '0', color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
                Configurer les connexions, switcher entre cloud et local, tester les configurations de base de données
              </p>
              <div style={{ 
                marginTop: '15px', 
                padding: '8px 16px', 
                background: '#6f42c1', 
                color: 'white', 
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Configurer DB →
              </div>
            </div>

            {/* Gestion des Utilisateurs */}
            <div 
              onClick={() => router.push('/admin/users')}
              style={{
                padding: '25px',
                border: '2px solid #f5576c',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: '#fff8f9'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 87, 108, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#f5576c', fontSize: '20px' }}>
                Utilisateurs
              </h3>
              <p style={{ margin: '0', color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
                Créer des comptes utilisateurs, assigner aux BU, gérer les rôles et permissions d'accès
              </p>
              <div style={{ 
                marginTop: '15px', 
                padding: '8px 16px', 
                background: '#f5576c', 
                color: 'white', 
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Gérer les Utilisateurs →
              </div>
            </div>

            {/* Test Base de Données */}
            <div 
              onClick={() => router.push('/admin/database-test')}
              style={{
                padding: '25px',
                border: '2px solid #17a2b8',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: '#f0fcff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(23, 162, 184, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🧪</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#17a2b8', fontSize: '20px' }}>
                Test Base de Données
              </h3>
              <p style={{ margin: '0', color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
                Tester la connectivité et les fonctions de la base de données active, vérifier le système hybride
              </p>
              <div style={{ 
                marginTop: '15px', 
                padding: '8px 16px', 
                background: '#17a2b8', 
                color: 'white', 
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Tester DB →
              </div>
            </div>

            {/* Logs et Monitoring */}
            <div 
              onClick={() => router.push('/admin/logs')}
              style={{
                padding: '25px',
                border: '2px solid #4facfe',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: '#f8fcff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(79, 172, 254, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#4facfe', fontSize: '20px' }}>
                Logs & Monitoring
              </h3>
              <p style={{ margin: '0', color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
                Consulter les logs système, surveiller les performances, analyser l'activité des utilisateurs
              </p>
              <div style={{ 
                marginTop: '15px', 
                padding: '8px 16px', 
                background: '#4facfe', 
                color: 'white', 
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Voir les Logs →
              </div>
            </div>
          </div>
        </div>

        {/* Informations système */}
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>⚠️ Informations Importantes</h3>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#856404', lineHeight: '1.8' }}>
            <li>L'accès à cette section est réservé aux super-administrateurs</li>
            <li>La création d'une BU génère automatiquement son schéma de base de données</li>
            <li>Les utilisateurs doivent être assignés à au moins une BU pour accéder à l'application</li>
            <li>Les modifications sur les BU peuvent impacter les utilisateurs associés</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
