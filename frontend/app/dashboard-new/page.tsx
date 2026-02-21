'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

export default function DashboardNew() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className={styles.container}>
      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Hamburger Button - Mobile only */}
      <button 
        className={styles.hamburger}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>📦</div>
          <h2>Gestion Stock</h2>
        </div>

        <nav className={styles.sidebarNav}>
          <button 
            className={activeTab === 'dashboard' ? styles.active : ''}
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileMenuOpen(false);
            }}
          >
            <span>📊</span>
            <span>Tableau de Bord</span>
          </button>
          
          <button 
            className={activeTab === 'articles' ? styles.active : ''}
            onClick={() => {
              setActiveTab('articles');
              setIsMobileMenuOpen(false);
            }}
          >
            <span>📦</span>
            <span>Articles</span>
            <span className={styles.badge}>8190</span>
          </button>
          
          <button 
            className={activeTab === 'clients' ? styles.active : ''}
            onClick={() => {
              setActiveTab('clients');
              setIsMobileMenuOpen(false);
            }}
          >
            <span>👥</span>
            <span>Clients</span>
            <span className={styles.badge}>1284</span>
          </button>
          
          <button 
            className={activeTab === 'suppliers' ? styles.active : ''}
            onClick={() => {
              setActiveTab('suppliers');
              setIsMobileMenuOpen(false);
            }}
          >
            <span>🏭</span>
            <span>Fournisseurs</span>
            <span className={styles.badge}>457</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h1>📦 Gestion de Stock</h1>
          <div className={styles.topBarActions}>
            <button className={styles.btnPrimary}>➕ Ajouter</button>
            <button className={styles.btnSecondary}>🔄 Actualiser</button>
          </div>
        </div>

        <div className={styles.content}>
          {activeTab === 'dashboard' && (
            <div>
              <h2>Tableau de Bord</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Articles</h3>
                  <p className={styles.statValue}>8,190</p>
                </div>
                <div className={styles.statCard}>
                  <h3>Clients</h3>
                  <p className={styles.statValue}>1,284</p>
                </div>
                <div className={styles.statCard}>
                  <h3>Fournisseurs</h3>
                  <p className={styles.statValue}>457</p>
                </div>
                <div className={styles.statCard}>
                  <h3>Stock Total</h3>
                  <p className={styles.statValue}>€2.5M</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'articles' && (
            <div>
              <h2>Liste des Articles</h2>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Désignation</th>
                      <th>Prix</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>ART001</td>
                      <td>Article Test 1</td>
                      <td>100.00 €</td>
                      <td>50</td>
                      <td>
                        <button className={styles.btnEdit}>✏️</button>
                        <button className={styles.btnDelete}>🗑️</button>
                      </td>
                    </tr>
                    <tr>
                      <td>ART002</td>
                      <td>Article Test 2</td>
                      <td>200.00 €</td>
                      <td>30</td>
                      <td>
                        <button className={styles.btnEdit}>✏️</button>
                        <button className={styles.btnDelete}>🗑️</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div>
              <h2>Liste des Clients</h2>
              <p>Contenu clients...</p>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div>
              <h2>Liste des Fournisseurs</h2>
              <p>Contenu fournisseurs...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
