'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';

interface FiscalSettings {
  tva_normal: number;
  tva_reduit: number;
  tva_super_reduit: number;
  tap_rate: number;
  timbre_fiscal: number;
  ias_rate: number;
  currency: string;
}

const DEFAULTS: FiscalSettings = {
  tva_normal: 19,
  tva_reduit: 9,
  tva_super_reduit: 0,
  tap_rate: 2,
  timbre_fiscal: 0.5,
  ias_rate: 0,
  currency: 'DZD'
};

export default function FiscalSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<FiscalSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const res = await fetch('/api/fiscal/settings', {
        headers: { 'X-Tenant': tenant }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({ ...DEFAULTS, ...data.data });
      }
    } catch (e) {
      // use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const tenant = localStorage.getItem('selectedTenant') || '2025_bu01';
      const res = await fetch('/api/fiscal/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Paramètres sauvegardés');
      } else {
        setMessage('❌ Erreur: ' + (data.error || 'Inconnue'));
      }
    } catch (e) {
      setMessage('❌ Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof FiscalSettings,
    unit: string,
    description?: string
  ) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
        {label}
      </label>
      {description && (
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 6px' }}>{description}</p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={settings[key] as number}
          onChange={e => setSettings(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
          style={{
            width: 100,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: 14
          }}
        />
        <span style={{ color: '#666', fontSize: 14 }}>{unit}</span>
      </div>
    </div>
  );

  if (loading) return <div className={styles.container}><p>Chargement...</p></div>;

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.push('/fiscal')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>←</button>
          <h1 style={{ margin: 0, fontSize: 22 }}>Paramètres fiscaux</h1>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 16, marginBottom: 20, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
            Taux TVA
          </h2>
          {field('TVA taux normal', 'tva_normal', '%', 'Taux standard applicable à la majorité des biens et services')}
          {field('TVA taux réduit', 'tva_reduit', '%', 'Taux réduit pour certains produits (alimentation, médicaments...)')}
          {field('TVA taux super réduit / exonéré', 'tva_super_reduit', '%', '0% pour les produits exonérés')}

          <h2 style={{ fontSize: 16, marginBottom: 20, marginTop: 24, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
            Autres taxes
          </h2>
          {field('TAP — Taxe sur l\'Activité Professionnelle', 'tap_rate', '%', 'Appliquée sur le chiffre d\'affaires HT')}
          {field('Timbre fiscal', 'timbre_fiscal', 'DA', 'Montant fixe par facture')}
          {field('IAS — Impôt sur les Activités Spécifiques', 'ias_rate', '%', '0% si non applicable à votre activité')}
        </div>

        {message && (
          <div style={{
            marginTop: 16,
            padding: '10px 16px',
            borderRadius: 8,
            background: message.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
            color: message.startsWith('✅') ? '#166534' : '#991b1b',
            fontSize: 14
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={() => { setSettings(DEFAULTS); setMessage(''); }}
            style={{
              padding: '10px 24px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}
