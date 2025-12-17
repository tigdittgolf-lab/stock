import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { sign, verify } from 'hono/jwt';

// Note: JWT est inclus dans Hono, pas besoin d'installation séparée

const authReal = new Hono();

// Secret pour JWT (à mettre dans .env en production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ==================== AUTHENTIFICATION ====================

// POST /api/auth-real/login - Authentification
authReal.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    console.log(`🔐 Tentative de connexion: ${username}`);

    if (!username || !password) {
      return c.json({ 
        success: false, 
        error: 'Username et password requis' 
      }, 400);
    }

    // Authentifier via RPC
    const { data, error } = await supabaseAdmin.rpc('authenticate_user', {
      p_username: username,
      p_password: password
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      return c.json({ 
        success: false, 
        error: 'Erreur lors de l\'authentification' 
      }, 500);
    }

    // Parser la réponse JSON
    const authResult = typeof data === 'string' ? JSON.parse(data) : data;

    if (!authResult.success) {
      console.log(`❌ Authentification échouée: ${authResult.error}`);
      return c.json({ 
        success: false, 
        error: authResult.error 
      }, 401);
    }

    const user = authResult.user;

    // Générer un token JWT
    const token = await sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 heures
      },
      JWT_SECRET
    );

    // Créer une session dans la base de données
    const { data: sessionData, error: sessionError } = await supabaseAdmin.rpc('create_session', {
      p_user_id: user.id,
      p_token: token,
      p_ip_address: c.req.header('x-forwarded-for') || 'unknown',
      p_user_agent: c.req.header('user-agent') || 'unknown',
      p_expires_in_hours: 24
    });

    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
    }

    console.log(`✅ Connexion réussie: ${username} (${user.role})`);

    return c.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        business_units: user.business_units
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la connexion' 
    }, 500);
  }
});

// POST /api/auth-real/logout - Déconnexion
authReal.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        error: 'Token manquant' 
      }, 401);
    }

    const token = authHeader.substring(7);

    // Supprimer la session
    const { data, error } = await supabaseAdmin.rpc('logout_user', {
      p_token: token
    });

    if (error) {
      console.error('❌ Logout Error:', error);
    }

    console.log('✅ Déconnexion réussie');

    return c.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Error during logout:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la déconnexion' 
    }, 500);
  }
});

// GET /api/auth-real/validate - Valider le token
authReal.get('/validate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        error: 'Token manquant' 
      }, 401);
    }

    const token = authHeader.substring(7);

    // Vérifier le JWT
    try {
      const payload = await verify(token, JWT_SECRET);
      
      // Vérifier aussi dans la base de données
      const { data, error } = await supabaseAdmin.rpc('validate_session', {
        p_token: token
      });

      if (error) {
        console.error('❌ Validation Error:', error);
        return c.json({ 
          success: false, 
          error: 'Session invalide' 
        }, 401);
      }

      const validationResult = typeof data === 'string' ? JSON.parse(data) : data;

      if (!validationResult.success) {
        return c.json({ 
          success: false, 
          error: validationResult.error 
        }, 401);
      }

      return c.json({
        success: true,
        user: validationResult.user
      });

    } catch (jwtError) {
      console.error('❌ JWT Error:', jwtError);
      return c.json({ 
        success: false, 
        error: 'Token invalide ou expiré' 
      }, 401);
    }

  } catch (error) {
    console.error('Error during validation:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la validation' 
    }, 500);
  }
});

// GET /api/auth-real/me - Récupérer les infos de l'utilisateur connecté
authReal.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        error: 'Token manquant' 
      }, 401);
    }

    const token = authHeader.substring(7);

    // Vérifier le token
    const payload = await verify(token, JWT_SECRET);

    // Récupérer les infos complètes depuis la base
    const { data, error } = await supabaseAdmin.rpc('validate_session', {
      p_token: token
    });

    if (error) {
      return c.json({ 
        success: false, 
        error: 'Session invalide' 
      }, 401);
    }

    const validationResult = typeof data === 'string' ? JSON.parse(data) : data;

    if (!validationResult.success) {
      return c.json({ 
        success: false, 
        error: validationResult.error 
      }, 401);
    }

    return c.json({
      success: true,
      user: validationResult.user
    });

  } catch (error) {
    console.error('Error getting user info:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération des informations' 
    }, 500);
  }
});

// POST /api/auth-real/check-permission - Vérifier une permission
authReal.post('/check-permission', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        error: 'Token manquant' 
      }, 401);
    }

    const token = authHeader.substring(7);
    const body = await c.req.json();
    const { module, action } = body;

    // Vérifier le token et récupérer l'utilisateur
    const payload = await verify(token, JWT_SECRET);

    // Vérifier la permission
    const { data, error } = await supabaseAdmin.rpc('check_user_permission', {
      p_user_id: payload.userId,
      p_module: module,
      p_action: action
    });

    if (error) {
      console.error('❌ Permission Check Error:', error);
      return c.json({ 
        success: false, 
        hasPermission: false 
      });
    }

    return c.json({
      success: true,
      hasPermission: data || false
    });

  } catch (error) {
    console.error('Error checking permission:', error);
    return c.json({ 
      success: false, 
      hasPermission: false 
    });
  }
});

// ==================== RÉCUPÉRATION DE MOT DE PASSE ====================

// POST /api/auth-real/forgot-password - Demander une réinitialisation
authReal.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ 
        success: false, 
        error: 'Email ou username requis' 
      }, 400);
    }

    console.log(`🔑 Demande de récupération pour: ${email}`);

    const { data, error } = await supabaseAdmin.rpc('request_password_reset', {
      p_email_or_username: email
    });

    if (error) {
      console.error('❌ Password reset request error:', error);
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la demande de récupération' 
      }, 500);
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return c.json(result);

  } catch (error) {
    console.error('Error requesting password reset:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la demande de récupération' 
    }, 500);
  }
});

// GET /api/auth-real/validate-reset-token/:token - Valider un token de récupération
authReal.get('/validate-reset-token/:token', async (c) => {
  try {
    const token = c.req.param('token');

    const { data, error } = await supabaseAdmin.rpc('validate_reset_token', {
      p_token: token
    });

    if (error) {
      console.error('❌ Token validation error:', error);
      return c.json({ 
        success: false, 
        error: 'Token invalide' 
      }, 400);
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return c.json(result);

  } catch (error) {
    console.error('Error validating reset token:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la validation du token' 
    }, 500);
  }
});

// POST /api/auth-real/reset-password - Réinitialiser le mot de passe
authReal.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const { token, password } = body;

    if (!token || !password) {
      return c.json({ 
        success: false, 
        error: 'Token et nouveau mot de passe requis' 
      }, 400);
    }

    if (password.length < 6) {
      return c.json({ 
        success: false, 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      }, 400);
    }

    console.log(`🔑 Réinitialisation de mot de passe avec token: ${token.substring(0, 10)}...`);

    const { data, error } = await supabaseAdmin.rpc('reset_password', {
      p_token: token,
      p_new_password: password
    });

    if (error) {
      console.error('❌ Password reset error:', error);
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la réinitialisation' 
      }, 500);
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return c.json(result);

  } catch (error) {
    console.error('Error resetting password:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la réinitialisation' 
    }, 500);
  }
});

// GET /api/auth-real/cleanup-sessions - Nettoyer les sessions expirées (admin only)
authReal.get('/cleanup-sessions', async (c) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('cleanup_expired_sessions');

    if (error) {
      console.error('❌ Cleanup Error:', error);
      return c.json({ 
        success: false, 
        error: 'Erreur lors du nettoyage' 
      }, 500);
    }

    console.log(`🧹 ${data} sessions expirées supprimées`);

    return c.json({
      success: true,
      deleted_count: data
    });

  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return c.json({ 
      success: false, 
      error: 'Erreur lors du nettoyage' 
    }, 500);
  }
});

export default authReal;
