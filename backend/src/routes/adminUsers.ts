import express from 'express';
import crypto from 'crypto';
import { BackendDatabaseService } from '../services/databaseService.js';

const router = express.Router();

// Helper pour hasher les mots de passe
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// GET - Liste tous les utilisateurs
router.get('/admin/users', async (req, res) => {
  try {
    console.log('🔍 GET /admin/users - Récupération utilisateurs');
    
    const dbService = BackendDatabaseService.getInstance();
    const dbType = dbService.getActiveConfig()?.type || 'mysql';
    
    console.log(`📊 Base de données active: ${dbType}`);

    let users = [];

    if (dbType === 'supabase') {
      const { supabaseAdmin } = await import('../supabaseClient.js');
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      users = data || [];

    } else if (dbType === 'mysql') {
      const connection = await dbService.getConnection();
      const [rows] = await connection.query('SELECT * FROM users ORDER BY created_at DESC');
      users = rows as any[];

    } else if (dbType === 'postgresql') {
      const client = await dbService.getConnection();
      const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      users = result.rows;
    }

    console.log(`✅ ${users.length} utilisateurs trouvés`);

    res.json({
      success: true,
      data: users,
      database: dbType
    });

  } catch (error) {
    console.error('❌ Erreur GET users:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// POST - Créer un utilisateur
router.post('/admin/users', async (req, res) => {
  try {
    const { username, email, password, full_name, role, business_units } = req.body;

    console.log('📝 POST /admin/users - Création utilisateur:', { username, email, role });

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email et password sont requis'
      });
    }

    const password_hash = hashPassword(password);
    const dbService = BackendDatabaseService.getInstance();
    const dbType = dbService.getActiveConfig()?.type || 'mysql';

    console.log(`📊 Base de données active: ${dbType}`);

    let newUser = null;

    if (dbType === 'supabase') {
      const { supabaseAdmin } = await import('../supabaseClient.js');
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([{
          username,
          email,
          password_hash,
          full_name: full_name || '',
          role: role || 'user',
          business_units: business_units || [],
          active: true
        }])
        .select()
        .single();

      if (error) throw error;
      newUser = data;

    } else if (dbType === 'mysql') {
      const connection = await dbService.getConnection();
      const [result] = await connection.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, business_units, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
        [username, email, password_hash, full_name || '', role || 'user', JSON.stringify(business_units || [])]
      );
      
      const insertId = (result as any).insertId;
      const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [insertId]);
      newUser = (rows as any[])[0];

    } else if (dbType === 'postgresql') {
      const client = await dbService.getConnection();
      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, business_units, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
         RETURNING *`,
        [username, email, password_hash, full_name || '', role || 'user', business_units || []]
      );
      newUser = result.rows[0];
    }

    console.log('✅ Utilisateur créé:', newUser?.id);

    res.json({
      success: true,
      data: newUser,
      database: dbType,
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur POST user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// GET - Récupérer un utilisateur par ID
router.get('/admin/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID utilisateur invalide'
      });
    }

    console.log('🔍 GET /admin/users/:id - ID:', userId);

    const dbService = BackendDatabaseService.getInstance();
    const dbType = dbService.getActiveConfig()?.type || 'mysql';

    let user = null;

    if (dbType === 'supabase') {
      const { supabaseAdmin } = await import('../supabaseClient.js');
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      user = data;

    } else if (dbType === 'mysql') {
      const connection = await dbService.getConnection();
      const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = (rows as any[])[0];

    } else if (dbType === 'postgresql') {
      const client = await dbService.getConnection();
      const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      user = result.rows[0];
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    console.log('✅ Utilisateur trouvé:', user.username);

    res.json({
      success: true,
      data: user,
      database: dbType
    });

  } catch (error) {
    console.error('❌ Erreur GET user by ID:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// PUT - Mettre à jour un utilisateur
router.put('/admin/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID utilisateur invalide'
      });
    }

    const { username, email, password, full_name, role, business_units, active } = req.body;

    console.log('🔄 PUT /admin/users/:id - ID:', userId, 'Password change:', !!password);

    const dbService = BackendDatabaseService.getInstance();
    const dbType = dbService.getActiveConfig()?.type || 'mysql';

    const updateData: any = {
      username,
      email,
      full_name,
      role,
      business_units,
      active,
      updated_at: new Date().toISOString()
    };

    // Si un nouveau mot de passe est fourni, le hasher
    if (password && password.trim() !== '') {
      updateData.password_hash = hashPassword(password);
      console.log('🔐 Nouveau mot de passe hashé');
    }

    let updatedUser = null;

    if (dbType === 'supabase') {
      const { supabaseAdmin } = await import('../supabaseClient.js');
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      updatedUser = data;

    } else if (dbType === 'mysql') {
      const connection = await dbService.getConnection();
      
      const fields = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (key === 'business_units') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      values.push(userId);
      
      await connection.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
      updatedUser = (rows as any[])[0];

    } else if (dbType === 'postgresql') {
      const client = await dbService.getConnection();
      
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(updateData)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
      
      values.push(userId);
      
      const result = await client.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      updatedUser = result.rows[0];
    }

    console.log('✅ Utilisateur mis à jour:', updatedUser?.username);

    res.json({
      success: true,
      data: updatedUser,
      database: dbType,
      message: 'Utilisateur mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur PUT user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// DELETE - Supprimer un utilisateur
router.delete('/admin/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID utilisateur invalide'
      });
    }

    console.log('🗑️ DELETE /admin/users/:id - ID:', userId);

    const dbService = BackendDatabaseService.getInstance();
    const dbType = dbService.getActiveConfig()?.type || 'mysql';

    if (dbType === 'supabase') {
      const { supabaseAdmin } = await import('../supabaseClient.js');
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

    } else if (dbType === 'mysql') {
      const connection = await dbService.getConnection();
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);

    } else if (dbType === 'postgresql') {
      const client = await dbService.getConnection();
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    console.log('✅ Utilisateur supprimé');

    res.json({
      success: true,
      database: dbType,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur DELETE user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router;
