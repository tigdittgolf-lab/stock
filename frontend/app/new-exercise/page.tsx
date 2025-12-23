'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

interface Exercise {
  year: number;
  status: 'active' | 'closed' | 'archived';
}

export default function NewExercise() {
  const router = useRouter();
  const [businessUnits, setBusinessUnits] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedBU, setSelectedBU] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [newYear, setNewYear] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBusinessUnits();
    loadExercises();
  }, []);

  const loadBusinessUnits = async () => {
    try {
      const response = await fetch('getApiUrl('auth/business-units')');
      const data = await response.json();
      if (data.success) {
        setBusinessUnits(data.data.map((bu: any) => bu.id));
      }
    } catch (error) {
      console.error('Error loading business units:', error);
      setBusinessUnits(['bu01', 'bu02', 'bu03']);
    }
  };

  const loadExercises = async () => {
    try {
      const response = await fetch('getApiUrl('auth/exercises')');
      const data = await response.json();
      if (data.success) {
        setExercises(data.data);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      const currentYear = new Date().getFullYear();
      setExercises([
        { year: currentYear, status: 'active' },
        { year: currentYear - 1, status: 'closed' }
      ]);
    }
  };

  const handleCreateExercise = async () => {
    if (!selectedBU || !currentYear || !newYear) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (parseInt(newYear) <= parseInt(currentYear)) {
      alert('La nouvelle année doit être supérieure à l\'année actuelle');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('getApiUrl('auth/create-new-exercise')', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_unit: selectedBU,
          current_year: parseInt(currentYear),
          new_year: parseInt(newYear)
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Nouvel exercice ${newYear} créé avec succès!\n\nDonnées copiées:\n- Familles d'articles\n- Fournisseurs\n- Clients\n- Articles (avec stock actuel)\n\nLes factures et bons de livraison ne sont pas copiés.`);
        router.push('/dashboard');
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
      alert('Erreur lors de la création de l\'exercice');
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
          minWidth: '500px',
          maxWidth: '600px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#333', marginBottom: '10px' }}>Créer un Nouvel Exercice</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Copie les données de référence (clients, fournisseurs, articles avec stock) vers une nouvelle année
            </p>
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
                <option key={bu} value={bu}>
                  {bu.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Exercice Actuel (Source):
            </label>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="">Sélectionner l'exercice source</option>
              {exercises.map(ex => (
                <option key={ex.year} value={ex.year}>
                  {ex.year} ({ex.status === 'active' ? 'Actif' : ex.status === 'closed' ? 'Clôturé' : 'Archivé'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Nouvel Exercice (Destination):
            </label>
            <input
              type="number"
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 5}
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="Ex: 2026"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#e8f4fd',
            borderRadius: '5px',
            border: '1px solid #bee5eb'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>Données qui seront copiées:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c5460' }}>
              <li>✅ Familles d'articles</li>
              <li>✅ Fournisseurs</li>
              <li>✅ Clients</li>
              <li>✅ Articles (avec stock actuel)</li>
            </ul>
            <h4 style={{ margin: '15px 0 10px 0', color: '#721c24' }}>Données qui ne seront PAS copiées:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#721c24' }}>
              <li>❌ Factures</li>
              <li>❌ Bons de livraison</li>
              <li>❌ Historique des mouvements</li>
            </ul>
          </div>

          <button
            onClick={handleCreateExercise}
            disabled={loading || !selectedBU || !currentYear || !newYear}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: (!selectedBU || !currentYear || !newYear) ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (!selectedBU || !currentYear || !newYear) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {loading ? 'Création en cours...' : 'Créer le Nouvel Exercice'}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              ← Retour à la sélection
            </button>
          </div>

          {selectedBU && currentYear && newYear && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                <strong>Schéma source:</strong> {currentYear}_{selectedBU}<br/>
                <strong>Nouveau schéma:</strong> {newYear}_{selectedBU}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}