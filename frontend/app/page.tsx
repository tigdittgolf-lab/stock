'use client';

import { useRouter } from 'next/navigation';
import styles from './landing.module.css';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Gestion de Stock
              <span className={styles.heroTitleAccent}> Professionnelle</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Solution complète pour gérer vos stocks, achats, ventes et finances en toute simplicité
            </p>
            <div className={styles.heroButtons}>
              <button 
                onClick={() => router.push('/login')}
                className={styles.primaryButton}
              >
                🚀 Commencer maintenant
              </button>
              <button 
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={styles.secondaryButton}
              >
                📖 Découvrir les fonctionnalités
              </button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <span className={styles.dot} style={{ background: '#ff5f56' }}></span>
                <span className={styles.dot} style={{ background: '#ffbd2e' }}></span>
                <span className={styles.dot} style={{ background: '#27c93f' }}></span>
              </div>
              <div className={styles.heroCardContent}>
                <div className={styles.statsPreview}>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>📦</span>
                    <div>
                      <div className={styles.statValue}>9,823</div>
                      <div className={styles.statLabel}>Articles</div>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>💰</span>
                    <div>
                      <div className={styles.statValue}>3.4M DA</div>
                      <div className={styles.statLabel}>Valeur Stock</div>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>⚠️</span>
                    <div>
                      <div className={styles.statValue}>8,255</div>
                      <div className={styles.statLabel}>Alertes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Fonctionnalités Complètes</h2>
          <p className={styles.sectionSubtitle}>
            Tout ce dont vous avez besoin pour gérer efficacement votre entreprise
          </p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📦</div>
            <h3 className={styles.featureTitle}>Gestion des Articles</h3>
            <p className={styles.featureDescription}>
              Catalogue complet avec familles, fournisseurs, prix d'achat et de vente, marges automatiques
            </p>
            <ul className={styles.featureList}>
              <li>✓ Gestion des stocks (BL et Factures)</li>
              <li>✓ Alertes de stock faible</li>
              <li>✓ Valorisation en temps réel</li>
            </ul>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🛒</div>
            <h3 className={styles.featureTitle}>Achats Fournisseurs</h3>
            <p className={styles.featureDescription}>
              Gestion complète des achats avec bons de livraison et factures fournisseurs
            </p>
            <ul className={styles.featureList}>
              <li>✓ Bons de livraison d'achat</li>
              <li>✓ Factures fournisseurs</li>
              <li>✓ Entrée de stock automatique</li>
            </ul>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💰</div>
            <h3 className={styles.featureTitle}>Ventes Clients</h3>
            <p className={styles.featureDescription}>
              Facturation complète avec gestion des bons de livraison et suivi des paiements
            </p>
            <ul className={styles.featureList}>
              <li>✓ Bons de livraison de vente</li>
              <li>✓ Factures clients</li>
              <li>✓ Sortie de stock automatique</li>
            </ul>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💳</div>
            <h3 className={styles.featureTitle}>Gestion des Paiements</h3>
            <p className={styles.featureDescription}>
              Suivi complet des paiements clients et fournisseurs avec historique détaillé
            </p>
            <ul className={styles.featureList}>
              <li>✓ Paiements clients</li>
              <li>✓ Paiements fournisseurs</li>
              <li>✓ Soldes en temps réel</li>
            </ul>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>👥</div>
            <h3 className={styles.featureTitle}>Clients & Fournisseurs</h3>
            <p className={styles.featureDescription}>
              Base de données complète avec historique des transactions et statistiques
            </p>
            <ul className={styles.featureList}>
              <li>✓ Fiches détaillées</li>
              <li>✓ Chiffre d'affaires par client</li>
              <li>✓ Historique complet</li>
            </ul>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>Tableaux de Bord</h3>
            <p className={styles.featureDescription}>
              Visualisation en temps réel de toutes vos données avec statistiques avancées
            </p>
            <ul className={styles.featureList}>
              <li>✓ Statistiques en temps réel</li>
              <li>✓ Graphiques interactifs</li>
              <li>✓ Rapports personnalisés</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className={styles.technical}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Architecture Technique</h2>
          <p className={styles.sectionSubtitle}>
            Une solution robuste et évolutive
          </p>
        </div>

        <div className={styles.technicalGrid}>
          <div className={styles.technicalCard}>
            <div className={styles.technicalIcon}>🏢</div>
            <h3>Multi-tenant</h3>
            <p>Gestion de plusieurs business units et exercices comptables</p>
          </div>

          <div className={styles.technicalCard}>
            <div className={styles.technicalIcon}>🗄️</div>
            <h3>Multi-base</h3>
            <p>Support MySQL, PostgreSQL et Supabase (Cloud)</p>
          </div>

          <div className={styles.technicalCard}>
            <div className={styles.technicalIcon}>🔐</div>
            <h3>Sécurisé</h3>
            <p>Authentification, rôles utilisateurs et permissions</p>
          </div>

          <div className={styles.technicalCard}>
            <div className={styles.technicalIcon}>🌙</div>
            <h3>Mode Sombre</h3>
            <p>Interface adaptative pour un confort optimal</p>
          </div>

          <div className={styles.technicalCard}>
            <div className={styles.technicalIcon}>📱</div>
            <h3>Responsive</h3>
            <p>Fonctionne sur tous les appareils</p>
          </div>

          <div className={styles.technicalCard}>
            <div className={styles.technicalIcon}>⚡</div>
            <h3>Performant</h3>
            <p>Chargement rapide et interface fluide</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Prêt à optimiser votre gestion ?</h2>
          <p className={styles.ctaSubtitle}>
            Commencez dès maintenant et découvrez toutes les fonctionnalités
          </p>
          <button 
            onClick={() => router.push('/login')}
            className={styles.ctaButton}
          >
            🚀 Accéder à l'application
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>📦 Gestion de Stock</h4>
            <p>Solution professionnelle pour la gestion d'entreprise</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Liens rapides</h4>
            <a href="/login">Connexion</a>
            <a href="/dashboard">Dashboard</a>
          </div>
          <div className={styles.footerSection}>
            <h4>Système</h4>
            <p>Version 2.0</p>
            <p>© 2025 StockApp</p>
          </div>
        </div>
      </footer>
    </div>
  );
}