export default function HomePage() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
        🎉 Application Stock Management
      </h1>
      
      <p style={{ fontSize: '1.2rem', marginBottom: '40px' }}>
        Système de gestion de stock avec migration de base de données complète
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <a 
          href="/login" 
          style={{ 
            padding: '20px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '10px',
            textDecoration: 'none',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <h3>🔐 Connexion</h3>
          <p>Accéder à l'application</p>
        </a>
        
        <a 
          href="/admin/database-migration" 
          style={{ 
            padding: '20px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '10px',
            textDecoration: 'none',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <h3>🔄 Migration</h3>
          <p>Système de migration de base de données</p>
        </a>
        
        <a 
          href="/dashboard" 
          style={{ 
            padding: '20px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '10px',
            textDecoration: 'none',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <h3>📊 Dashboard</h3>
          <p>Tableau de bord principal</p>
        </a>
      </div>
      
      <div style={{ marginTop: '60px', fontSize: '14px', opacity: '0.8' }}>
        <p>✅ Migration MySQL : 100% fonctionnelle</p>
        <p>✅ Migration PostgreSQL : 100% fonctionnelle</p>
        <p>✅ Système multi-tenant complet</p>
        <p>✅ 60 tables migrées avec succès</p>
      </div>
    </div>
  );
}