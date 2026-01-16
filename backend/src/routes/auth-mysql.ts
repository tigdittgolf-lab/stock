import { Hono } from 'hono';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const app = new Hono();

// Configuration MySQL pour stock_management_auth
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: 'stock_management_auth'
};

// Helper pour créer une connexion MySQL
async function getMySQLConnection() {
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    return connection;
  } catch (error) {
    console.error('❌ MySQL connection error:', error);
    throw error;
  }
}

// Helper pour hasher les mots de passe (SHA-256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth-mysql/login - Authentification MySQL
app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    console.log('🔐 MySQL Login attempt:', { username });

    if (!username || !password) {
      return c.json({
        success: false,
        error: 'Username et password requis'
      }, 400);
    }

    const connection = await getMySQLConnection();

    try {
      // Appeler la fonction authenticate_user()
      const [rows] = await connection.query(
        'SELECT authenticate_user(?, ?) as result',
        [username, password]
      );

      const result = (rows as any[])[0]?.result;
      
      if (!result) {
        throw new Error('Aucun résultat de la fonction authenticate_user');
      }

      // Parser le résultat JSON
      const authResult = typeof result === 'string' ? JSON.parse(result) : result;

      console.log('🔍 Auth result:', authResult);

      if (authResult.success) {
        console.log('✅ MySQL authentication successful:', authResult.user.username);
        
        return c.json({
          success: true,
          user: authResult.user,
          message: 'Connexion réussie'
        });
      } else {
        console.log('❌ MySQL authentication failed:', authResult.error);
        
        return c.json({
          success: false,
          error: authResult.error || 'Authentification échouée'
        }, 401);
      }

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ MySQL login error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// GET /api/auth-mysql/users - Liste des utilisateurs
app.get('/users', async (c) => {
  try {
    console.log('📋 MySQL GET users');

    const connection = await getMySQLConnection();

    try {
      const [rows] = await connection.query(
        'SELECT id, username, email, full_name, role, business_units, active, last_login, created_at, updated_at FROM users ORDER BY created_at DESC'
      );

      const users = rows as any[];
      console.log(`✅ Found ${users.length} users`);

      return c.json({
        success: true,
        data: users,
        database: 'mysql'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ MySQL get users error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// POST /api/auth-mysql/users - Créer un utilisateur
app.post('/users', async (c) => {
  try {
    const { username, email, password, full_name, role, business_units } = await c.req.json();

    console.log('➕ MySQL CREATE user:', { username, email, role });

    if (!username || !email || !password) {
      return c.json({
        success: false,
        error: 'Username, email et password requis'
      }, 400);
    }

    const connection = await getMySQLConnection();

    try {
      // Appeler la procédure create_user()
      const businessUnitsJson = JSON.stringify(business_units || []);
      
      await connection.query(
        'CALL create_user(?, ?, ?, ?, ?, ?)',
        [
          username,
          email,
          password,
          full_name || '',
          role || 'user',
          businessUnitsJson
        ]
      );

      // Récupérer l'utilisateur créé
      const [rows] = await connection.query(
        'SELECT id, username, email, full_name, role, business_units, active, created_at FROM users WHERE username = ?',
        [username]
      );

      const newUser = (rows as any[])[0];
      console.log('✅ MySQL user created:', newUser?.id);

      return c.json({
        success: true,
        data: newUser,
        database: 'mysql',
        message: 'Utilisateur créé avec succès'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ MySQL create user error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// GET /api/auth-mysql/users/:id - Récupérer un utilisateur
app.get('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    if (isNaN(userId)) {
      return c.json({
        success: false,
        error: 'ID utilisateur invalide'
      }, 400);
    }

    console.log('🔍 MySQL GET user:', userId);

    const connection = await getMySQLConnection();

    try {
      const [rows] = await connection.query(
        'SELECT id, username, email, full_name, role, business_units, active, last_login, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );

      const user = (rows as any[])[0];

      if (!user) {
        return c.json({
          success: false,
          error: 'Utilisateur non trouvé'
        }, 404);
      }

      console.log('✅ MySQL user found:', user.username);

      return c.json({
        success: true,
        data: user,
        database: 'mysql'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ MySQL get user error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// PUT /api/auth-mysql/users/:id - Mettre à jour un utilisateur
app.put('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    if (isNaN(userId)) {
      return c.json({
        success: false,
        error: 'ID utilisateur invalide'
      }, 400);
    }

    const { username, email, password, full_name, role, business_units, active } = await c.req.json();

    console.log('🔄 MySQL UPDATE user:', userId, 'Password change:', !!password);

    const connection = await getMySQLConnection();

    try {
      // Appeler la procédure update_user()
      const businessUnitsJson = JSON.stringify(business_units || []);
      
      await connection.query(
        'CALL update_user(?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          username,
          email,
          password || null, // NULL si pas de changement de mot de passe
          full_name || '',
          role || 'user',
          businessUnitsJson,
          active !== undefined ? active : true
        ]
      );

      // Récupérer l'utilisateur mis à jour
      const [rows] = await connection.query(
        'SELECT id, username, email, full_name, role, business_units, active, last_login, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );

      const updatedUser = (rows as any[])[0];
      console.log('✅ MySQL user updated:', updatedUser?.username);

      return c.json({
        success: true,
        data: updatedUser,
        database: 'mysql',
        message: 'Utilisateur mis à jour avec succès'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ MySQL update user error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// DELETE /api/auth-mysql/users/:id - Supprimer un utilisateur
app.delete('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    if (isNaN(userId)) {
      return c.json({
        success: false,
        error: 'ID utilisateur invalide'
      }, 400);
    }

    console.log('🗑️ MySQL DELETE user:', userId);

    const connection = await getMySQLConnection();

    try {
      // Appeler la procédure delete_user()
      await connection.query('CALL delete_user(?)', [userId]);

      console.log('✅ MySQL user deleted');

      return c.json({
        success: true,
        database: 'mysql',
        message: 'Utilisateur supprimé avec succès'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ MySQL delete user error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

export default app;
