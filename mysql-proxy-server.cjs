/**
 * Serveur proxy MySQL pour Tailscale Funnel
 * Permet à Vercel d'accéder à MySQL local via HTTPS
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3308;

// Configuration
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configuration MySQL
const MYSQL_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'stock_management'
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint pour exécuter des requêtes MySQL
app.post('/api/mysql/query', async (req, res) => {
  try {
    const { sql, params = [], database } = req.body;

    // Validation
    if (!sql) {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      });
    }

    // Créer la connexion
    const config = { ...MYSQL_CONFIG };
    if (database) {
      config.database = database;
    }

    const connection = await mysql.createConnection(config);

    try {
      // Exécuter la requête
      const [rows] = await connection.execute(sql, params);
      
      res.json({
        success: true,
        data: rows
      });
    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('MySQL Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 MySQL Proxy Server running on port ${PORT}`);
  console.log(`📊 MySQL: ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}`);
  console.log(`💾 Database: ${MYSQL_CONFIG.database}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Test locally: curl http://localhost:3307/health');
  console.log('2. Enable Tailscale Funnel: tailscale funnel 3307');
  console.log('3. Get public URL: tailscale status');
});
