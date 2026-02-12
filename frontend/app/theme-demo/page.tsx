'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function ThemeDemoPage() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Chargement...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎨 Démonstration du Système de Thème</h1>
        <p className={styles.subtitle}>
          Explorez toutes les fonctionnalités du système de thème dark/light
        </p>
        <div className={styles.themeInfo}>
          <span className={styles.badge}>
            Thème actuel : <strong>{theme === 'light' ? 'Clair' : 'Sombre'}</strong>
          </span>
          <button onClick={toggleTheme} className={styles.toggleButton}>
            {theme === 'light' ? '🌙 Passer en mode sombre' : '☀️ Passer en mode clair'}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📝 Typographie et Texte</h2>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Hiérarchie des Textes</h3>
          <p className={styles.textPrimary}>
            Texte principal - Utilisé pour les contenus importants (var(--text-primary))
          </p>
          <p className={styles.textSecondary}>
            Texte secondaire - Utilisé pour les descriptions (var(--text-secondary))
          </p>
          <p className={styles.textTertiary}>
            Texte tertiaire - Utilisé pour les métadonnées (var(--text-tertiary))
          </p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🎨 Palette de Couleurs</h2>
        <div className={styles.colorGrid}>
          <div className={styles.colorCard}>
            <div className={`${styles.colorSwatch} ${styles.primary}`}></div>
            <p className={styles.colorName}>Primary</p>
            <code className={styles.colorVar}>--primary-color</code>
          </div>
          <div className={styles.colorCard}>
            <div className={`${styles.colorSwatch} ${styles.success}`}></div>
            <p className={styles.colorName}>Success</p>
            <code className={styles.colorVar}>--success-color</code>
          </div>
          <div className={styles.colorCard}>
            <div className={`${styles.colorSwatch} ${styles.warning}`}></div>
            <p className={styles.colorName}>Warning</p>
            <code className={styles.colorVar}>--warning-color</code>
          </div>
          <div className={styles.colorCard}>
            <div className={`${styles.colorSwatch} ${styles.error}`}></div>
            <p className={styles.colorName}>Error</p>
            <code className={styles.colorVar}>--error-color</code>
          </div>
          <div className={styles.colorCard}>
            <div className={`${styles.colorSwatch} ${styles.info}`}></div>
            <p className={styles.colorName}>Info</p>
            <code className={styles.colorVar}>--info-color</code>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🔘 Boutons</h2>
        <div className={styles.buttonGrid}>
          <button className={styles.btnPrimary}>Bouton Principal</button>
          <button className={styles.btnSecondary}>Bouton Secondaire</button>
          <button className={styles.btnSuccess}>Bouton Succès</button>
          <button className={styles.btnWarning}>Bouton Avertissement</button>
          <button className={styles.btnError}>Bouton Erreur</button>
          <button className={styles.btnOutline}>Bouton Outline</button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🔔 Alertes et Notifications</h2>
        <div className={styles.alertsContainer}>
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <span className={styles.alertIcon}>✓</span>
            <div>
              <strong>Succès !</strong> Votre opération a été effectuée avec succès.
            </div>
          </div>
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            <span className={styles.alertIcon}>⚠</span>
            <div>
              <strong>Attention !</strong> Veuillez vérifier les informations saisies.
            </div>
          </div>
          <div className={`${styles.alert} ${styles.alertError}`}>
            <span className={styles.alertIcon}>✕</span>
            <div>
              <strong>Erreur !</strong> Une erreur s'est produite lors du traitement.
            </div>
          </div>
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            <span className={styles.alertIcon}>ℹ</span>
            <div>
              <strong>Information :</strong> Une nouvelle mise à jour est disponible.
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📋 Formulaires</h2>
        <div className={styles.card}>
          <form className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nom complet</label>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Entrez votre nom"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input 
                type="email" 
                className={styles.input} 
                placeholder="votre@email.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Message</label>
              <textarea 
                className={styles.textarea} 
                rows={4}
                placeholder="Votre message..."
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} />
                <span>J'accepte les conditions d'utilisation</span>
              </label>
            </div>
            <button type="submit" className={styles.btnPrimary}>
              Envoyer
            </button>
          </form>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🎯 Cartes et Surfaces</h2>
        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Carte Standard</h3>
            <p className={styles.cardText}>
              Une carte avec fond, bordure et ombre adaptés au thème.
            </p>
            <button className={styles.btnOutline}>En savoir plus</button>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Carte Interactive</h3>
            <p className={styles.cardText}>
              Survolez cette carte pour voir l'effet hover.
            </p>
            <button className={styles.btnPrimary}>Action</button>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Carte avec Badge</h3>
            <div className={styles.badges}>
              <span className={styles.badge}>Nouveau</span>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>Actif</span>
            </div>
            <p className={styles.cardText}>
              Exemple de carte avec des badges de statut.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📊 Tableau</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Élément 1</td>
                <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Actif</span></td>
                <td>12/02/2026</td>
                <td>
                  <button className={styles.btnSmall}>Modifier</button>
                </td>
              </tr>
              <tr>
                <td>Élément 2</td>
                <td><span className={`${styles.badge} ${styles.badgeWarning}`}>En attente</span></td>
                <td>11/02/2026</td>
                <td>
                  <button className={styles.btnSmall}>Modifier</button>
                </td>
              </tr>
              <tr>
                <td>Élément 3</td>
                <td><span className={`${styles.badge} ${styles.badgeError}`}>Inactif</span></td>
                <td>10/02/2026</td>
                <td>
                  <button className={styles.btnSmall}>Modifier</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>✨ Transitions et Animations</h2>
        <div className={styles.card}>
          <p className={styles.cardText}>
            Toutes les transitions utilisent <code>cubic-bezier(0.4, 0, 0.2, 1)</code> 
            pour une animation naturelle et fluide.
          </p>
          <div className={styles.animationDemo}>
            <div className={styles.animatedBox}>Survolez-moi !</div>
            <div className={styles.animatedBox}>Et moi aussi !</div>
            <div className={styles.animatedBox}>Moi trois !</div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p>✅ Système de thème professionnel avec transitions fluides</p>
        <p>✅ Contraste optimal pour une lisibilité maximale</p>
        <p>✅ Plus de 30 variables CSS disponibles</p>
        <a href="/" className={styles.backLink}>← Retour à l'accueil</a>
      </div>
    </div>
  );
}
