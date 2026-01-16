import { Hono } from 'hono';
import { Client } from 'pg';
import crypto from 'crypto';

const app = new Hono();

// Configuration PostgreSQL pour stock_management_auth
const pgConfig = {
  host: process.env.POSTGRESQL_HOST || 'localhost',
  port: parseInt(process.env.POSTGRESQL_PORT || '5432'),
  user: process.env.POSTGRESQL_USER || 'postgres',
  password: process.env.POSTGRESQL_PASSWORD || 'postgres',
  database: 'postgres' // Base principale avec schéma public pour auth
};

// Helper pour créer une connexion PostgreSQL
async function getPostgreSQLClient() {
  try {
    const client = new Client(pgConfig);
    await client.connect();
    return client;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    throw error;
  }
}

// Helper pour hasher les mots de passe (SHA-256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth-postgresql/login - Authentification PostgreSQL
app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    console.log('🔐 PostgreSQL Login attempt:', { username });

    if (!username || !password) {
      return c.json({
        success: false,
        error: 'Username et password requis'
      }, 400);
    }

    const client = await getPostgreSQLClient();

    try {
      // Appeler la fonction authenticate_user()
      const result = await client.query(
        'SELECT authenticate_user($1, $2) as result',
        [username, password]
      );

      const authResult = result.rows[0]?.result;

      if (!authResult) {
        throw new Error('Aucun résultat de la fonction authenticate_user');
      }

      console.log('🔍 Auth result:', authResult);

      if (authResult.success) {
        console.log('✅ PostgreSQL authentication successful:', authResult.user.username);
        
        return c.json({
          success: true,
          user: authResult.user,
          message: 'Connexion réussie'
        });
      } else {
        console.log('❌ PostgreSQL authentication failed:', authResult.error);
        
        return c.json({
          success: false,
          error: authResult.error || 'Authentification échouée'
        }, 401);
      }

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ PostgreSQL login error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// GET /api/auth-postgresql/users - Liste des utilisateurs
app.get('/users', async (c) => {
  try {
    console.log('📋 PostgreSQL GET users');

    const client = await getPostgreSQLClient();

    try {
      const result = await client.query(
        'SELECT id, username, email, full_name, role, business_units, active, last_login, created_at, updated_at FROM users ORDER BY created_at DESC'
      );

      const users = result.rows;
      console.log(`✅ Found ${users.length} users`);

      return c.json({
        success: true,
        data: users,
        database: 'postgresql'
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ PostgreSQL get users error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// POST /api/auth-postgresql/users - Créer un utilisateur
app.post('/users', async (c) => {
  try {
    const { username, email, password, full_name, role, business_units } = await c.req.json();

    console.log('➕ PostgreSQL CREATE user:', { username, email, role });

    if (!username || !email || !password) {
      return c.json({
        success: false,
        error: 'Username, email et password requis'
      }, 400);
    }

    const client = await getPostgreSQLClient();

    try {
      // Appeler la fonction create_user()
      await client.query(
        'SELECT create_user($1, $2, $3, $4, $5, $6)',
        [
          username,
          email,
          password,
          full_name || '',
          role || 'user',
          business_units || []
        ]
      );

      // Récupérer l'utilisateur créé
      const result = await client.query(
        'SELECT id, username, email, full_name, role, business_units, active, created_at FROM users WHERE username = $1',
        [username]
      );

      const newUser = result.rows[0];
      console.log('✅ PostgreSQL user created:', newUser?.id);

      return c.json({
        success: true,
        data: newUser,
        database: 'postgresql',
        message: 'Utilisateur créé avec succès'
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ PostgreSQL create user error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// GET /api/auth-postgresql/users/:id - Récupérer un utilisateur
app.get('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    if (isNaN(userId)) {
      return c.json({
        success: false,
        error: 'ID utilisateur invalide'
      }, 400);
    }

    console.log('🔍 PostgreSQL GET user:', userId);

    const client = await getPostgreSQLClient();

    try {
      const result = await client.query(
        'SELECT id, username, email, full_name, role, business_units, active, last_login, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      const user = result.rows[0];

      if (!user) {
        return c.json({
          success: false,
          error: 'Utilisateur non trouvé'
        }, 404);
      }

      console.log('✅ PostgreSQL user found:', user.username);

      return c.json({
        success: true,
        data: user,
        database: 'postgresql'
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ PostgreSQL get user error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// PUT /api/auth-postgresql/users/:id - Mettre à jour un utilisateur
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

    console.log('🔄 PostgreSQL UPDATE user:', userId, 'Password change:', !!password);

    const client = await getPostgreSQLClient();

    try {
      // Appeler la fonction update_user()
      await client.query(
        'SELECT update_user($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          userId,
          username,
          email,
          password || null, // NULL si pas de changement de mot de passe
          full_name || '',
          role || 'user',
          business_units || [],
          active !== undefined ? active : true
        ]
      );

      // Récupérer l'utilisateur mis à jour
      const result = await client.query(
        'SELECT id, username, email, full_name, role, business_units, active, last_login, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      const updatedUser = result.rows[0];
      console.log('✅ PostgreSQL user updated:', updatedUser?.username);

      return c.json({
        success: true,
        data: updatedUser,
        database: 'postgresql',
        message: 'Utilisateur mis à jour avec succès'
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ PostgreSQL update user error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

// DELETE /api/auth-postgresql/users/:id - Supprimer un utilisateur
app.delete('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));

    if (isNaN(userId)) {
      return c.json({
        success: false,
        error: 'ID utilisateur invalide'
      }, 400);
    }

    console.log('🗑️ PostgreSQL DELETE user:', userId);

    const client = await getPostgreSQLClient();

    try {
      // Appeler la fonction delete_user()
      await client.query('SELECT delete_user($1)', [userId]);

      console.log('✅ PostgreSQL user deleted');

      return c.json({
        success: true,
        database: 'postgresql',
        message: 'Utilisateur supprimé avec succès'
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ PostgreSQL delete user error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, 500);
  }
});

export default app;
