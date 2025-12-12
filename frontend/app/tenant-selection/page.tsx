'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    loadBusinessUnits();
    loadExercises();
  }, []);

  const loadBusinessUnits = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/auth/business-units');
      const data = await response.json();
      if (data.success) {
        setBusinessUnits(data.data);
      }
    } catch (error) {
      console.error('Error loading business units:', error);
      // Fallback data
      setBusinessUnits([
        { id: 'bu01', name: 'Business Unit 01', description: 'Unité principale' },
        { id: 'bu02', name: 'Business Unit 02', description: 'Unité secondaire' },
        { id: 'bu03', name: 'Business Unit 03', description: 'Unité tertiaire' }
      ]);
    }
  };

  const loadExercises = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/auth/exercises');
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
    if (!selectedBU || !selectedYear) {
      alert('Veuillez sélectionner une unité d\'affaires et un exercice');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3005/api/auth/set-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_unit: selectedBU,
          year: parseInt(selectedYear)
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Store tenant info in localStorage
        localStorage.setItem('tenant_info', JSON.stringify({
          business_unit: selectedBU,
          year: parseInt(selectedYear),
          schema: `${selectedYear}_${selectedBU}`
        }));

        // Store tenant info in localStorage for dashboard
        localStorage.setItem('currentTenant', data.data.schema);

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error setting tenant:', error);
      alert('Erreur de connexion');
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
            <p style={{ color: '#666', fontSize: '14px' }}>Sélectionnez votre unité d'affaires et exercice</p>
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
              {businessUnits.map(bu => (
                <option key={bu.id} value={bu.id}>
                  {bu.name} - {bu.description}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Exercice (Année):
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="">Sélectionner un exercice</option>
              {exercises.map(ex => (
                <option key={ex.year} value={ex.year}>
                  {ex.year} ({ex.status === 'active' ? 'Actif' : ex.status === 'closed' ? 'Clôturé' : 'Archivé'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading || !selectedBU || !selectedYear}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: (!selectedBU || !selectedYear) ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (!selectedBU || !selectedYear) ? 'not-allowed' : 'pointer',
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
          </div>

          {selectedBU && selectedYear && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                <strong>Schéma sélectionné:</strong> {selectedYear}_{selectedBU}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}