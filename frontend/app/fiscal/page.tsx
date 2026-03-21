'use client';

import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

const modules = [
  {
    title: 'Déclaration G50',
    subtitle: 'TVA + TAP mensuelle',
    icon: '📋',
    href: '/fiscal/g50',
    color: '#2563eb',
    description: 'Calcul automatique TVA collectée, TVA déductible et TAP. Export PDF prêt à déposer.'
  },
  {
    title: 'Paramètres fiscaux',
    subtitle: 'Taux TVA, TAP, timbre...',
    icon: '⚙️',
    href: '/fiscal/settings',
    color: '#7c3aed',
    description: 'Configurez les taux applicables à votre activité (TVA 19%/9%, TAP 2%, etc.)'
  }
];

export default function FiscalPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>←</button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Module Fiscal</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#666' }}>Déclarations fiscales algériennes</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 28 }}>
          {modules.map(mod => (
            <div
              key={mod.href}
              onClick={() => router.push(mod.href)}
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                borderTop: `4px solid ${mod.color}`,
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{mod.icon}</div>
              <h2 style={{ margin: '0 0 4px', fontSize: 17, color: mod.color }}>{mod.title}</h2>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#888' }}>{mod.subtitle}</p>
              <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.5 }}>{mod.description}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: 16, background: '#f0f9ff', borderRadius: 10, fontSize: 13, color: '#0369a1' }}>
          <strong>ℹ️ Note :</strong> Les calculs sont basés sur les factures et BL enregistrés dans le système.
          Vérifiez toujours les montants avant dépôt officiel à la Direction Générale des Impôts (DGI).
        </div>
      </div>
    </div>
  );
}
