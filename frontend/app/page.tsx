import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          🎉 Application Stock Management
        </h1>
        
        <p className={styles.subtitle}>
          Système de gestion de stock avec migration de base de données complète
        </p>
        
        <div className={styles.cardGrid}>
          <a href="/login" className={styles.card}>
            <div className={styles.cardIcon}>🔐</div>
            <h3 className={styles.cardTitle}>Connexion</h3>
            <p className={styles.cardDescription}>Accéder à l'application</p>
          </a>
          
          <a href="/admin/database-migration" className={styles.card}>
            <div className={styles.cardIcon}>🔄</div>
            <h3 className={styles.cardTitle}>Migration</h3>
            <p className={styles.cardDescription}>Système de migration de base de données</p>
          </a>
          
          <a href="/dashboard" className={styles.card}>
            <div className={styles.cardIcon}>📊</div>
            <h3 className={styles.cardTitle}>Dashboard</h3>
            <p className={styles.cardDescription}>Tableau de bord principal</p>
          </a>
        </div>
        
        <div className={styles.statusSection}>
          <div className={styles.statusItem}>✅ Migration MySQL : 100% fonctionnelle</div>
          <div className={styles.statusItem}>✅ Migration PostgreSQL : 100% fonctionnelle</div>
          <div className={styles.statusItem}>✅ Système multi-tenant complet</div>
          <div className={styles.statusItem}>✅ 60 tables migrées avec succès</div>
        </div>
      </div>
    </div>
  );
}