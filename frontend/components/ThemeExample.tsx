'use client';

import styles from './ThemeExample.module.css';

/**
 * Composant d'exemple montrant comment utiliser le système de thème
 * dans vos propres composants
 */
export default function ThemeExample() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Exemple de Composant Thématisé</h2>
        <p className={styles.text}>
          Ce composant utilise les variables CSS du thème pour s'adapter automatiquement
          au mode clair ou sombre.
        </p>
        
        <div className={styles.buttonGroup}>
          <button className={styles.primaryButton}>
            Bouton Principal
          </button>
          <button className={styles.secondaryButton}>
            Bouton Secondaire
          </button>
        </div>
        
        <div className={styles.alertsGrid}>
          <div className={`${styles.alert} ${styles.success}`}>
            ✓ Succès : Opération réussie
          </div>
          <div className={`${styles.alert} ${styles.warning}`}>
            ⚠ Attention : Vérifiez les données
          </div>
          <div className={`${styles.alert} ${styles.error}`}>
            ✕ Erreur : Une erreur s'est produite
          </div>
          <div className={`${styles.alert} ${styles.info}`}>
            ℹ Info : Nouvelle mise à jour disponible
          </div>
        </div>
      </div>
    </div>
  );
}
