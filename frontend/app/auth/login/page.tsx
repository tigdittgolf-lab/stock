'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

interface BusinessUnit {
  id: string;
  name: string;
  description: string;
}

interface Exercise {
  year: number;
  description: string;
  active: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'business-unit' | 'exercise'>('login');
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [selectedBU, setSelectedBU] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock data - à remplacer par des appels API
  const businessUnits: BusinessUnit[] = [
    { id: 'bu01', name: 'Unité Principale', description: 'Activité principale de l\'entreprise' },
    { id: 'bu02', name: 'Succursale Nord', description: 'Succursale région Nord' },
    { id: 'bu03', name: 'Succursale Sud', description: 'Succursale région Sud' }
  ];

  const exercises: Exercise[] = [
    { year: 2025, description: 'Exercice 2025', active: true },
    { year: 2024, description: 'Exercice 2024', active: true },
    { year: 2023, description: 'Exercice 2023', active: false }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulation de l'authentification
      if (credentials.username && credentials.password) {
        // Stocker les informations utilisateur
        sessionStorage.setItem('user', JSON.stringify({
          username: credentials.username,
          authenticated: true
        }));
        setStep('business-unit');
      } else {
        setError('Veuillez saisir vos identifiants');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessUnitSelection = () => {
    if (!selectedBU) {
      setError('Veuillez sélectionner une unité d\'affaires');
      return;
    }
    
    sessionStorage.setItem('businessUnit', selectedBU);
    setStep('exercise');
    setError('');
  };

  const handleExerciseSelection = () => {
    if (!selectedYear) {
      setError('Veuillez sélectionner un exercice');
      return;
    }

    // Créer le contexte complet
    const context = {
      username: credentials.username,
      businessUnit: selectedBU,
      year: selectedYear,
      schema: `${selectedYear}_${selectedBU}`,
      authenticated: true,
      loginTime: new Date().toISOString()
    };

    // Stocker le contexte complet
    sessionStorage.setItem('appContext', JSON.stringify(context));
    localStorage.setItem('lastContext', JSON.stringify({
      businessUnit: selectedBU,
      year: selectedYear
    }));

    // Rediriger vers l'application
    router.push('/dashboard');
  };

  const renderLoginForm = () => (
    <div className={styles.loginCard}>
      <div className={styles.header}>
        <h1>Système de Gestion de Stock</h1>
        <p>Connexion utilisateur</p>
      </div>

      <form onSubmit={handleLogin} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="username">Nom d'utilisateur</label>
          <input
            id="username"
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            placeholder="Saisissez votre nom d'utilisateur"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            placeholder="Saisissez votre mot de passe"
            required
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} className={styles.loginButton}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );

  const renderBusinessUnitSelection = () => (
    <div className={styles.loginCard}>
      <div className={styles.header}>
        <h1>Sélection Unité d'Affaires</h1>
        <p>Choisissez votre unité d'affaires</p>
      </div>

      <div className={styles.selectionGrid}>
        {businessUnits.map((bu) => (
          <div
            key={bu.id}
            className={`${styles.selectionCard} ${selectedBU === bu.id ? styles.selected : ''}`}
            onClick={() => setSelectedBU(bu.id)}
          >
            <h3>{bu.name}</h3>
            <p>{bu.description}</p>
            <span className={styles.buId}>{bu.id.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button onClick={() => setStep('login')} className={styles.backButton}>
          Retour
        </button>
        <button 
          onClick={handleBusinessUnitSelection}
          disabled={!selectedBU}
          className={styles.nextButton}
        >
          Continuer
        </button>
      </div>
    </div>
  );

  const renderExerciseSelection = () => (
    <div className={styles.loginCard}>
      <div className={styles.header}>
        <h1>Sélection Exercice</h1>
        <p>Choisissez l'exercice comptable</p>
      </div>

      <div className={styles.exerciseList}>
        {exercises.map((exercise) => (
          <div
            key={exercise.year}
            className={`${styles.exerciseCard} ${selectedYear === exercise.year ? styles.selected : ''} ${!exercise.active ? styles.disabled : ''}`}
            onClick={() => exercise.active && setSelectedYear(exercise.year)}
          >
            <div className={styles.exerciseYear}>{exercise.year}</div>
            <div className={styles.exerciseDescription}>{exercise.description}</div>
            {!exercise.active && <span className={styles.inactiveLabel}>Inactif</span>}
          </div>
        ))}
      </div>

      <div className={styles.contextSummary}>
        <h3>Contexte sélectionné:</h3>
        <p><strong>Utilisateur:</strong> {credentials.username}</p>
        <p><strong>Unité d'affaires:</strong> {businessUnits.find(bu => bu.id === selectedBU)?.name}</p>
        <p><strong>Schéma:</strong> {selectedYear}_{selectedBU}</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button onClick={() => setStep('business-unit')} className={styles.backButton}>
          Retour
        </button>
        <button 
          onClick={handleExerciseSelection}
          disabled={!selectedYear}
          className={styles.nextButton}
        >
          Accéder à l'application
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        {step === 'login' && renderLoginForm()}
        {step === 'business-unit' && renderBusinessUnitSelection()}
        {step === 'exercise' && renderExerciseSelection()}
      </div>
    </div>
  );
}