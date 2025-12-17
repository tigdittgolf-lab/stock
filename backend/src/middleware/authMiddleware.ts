import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { supabaseAdmin } from '../supabaseClient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  business_units: string[];
}

// Middleware d'authentification
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        error: 'Token d\'authentification requis' 
      }, 401);
    }

    const token = authHeader.substring(7);

    // Vérifier le JWT
    const payload = await verify(token, JWT_SECRET);

    // Vérifier la session dans la base de données
    const { data, error } = await supabaseAdmin.rpc('validate_session', {
      p_token: token
    });

    if (error) {
      console.error('❌ Session validation error:', error);
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

    // Stocker les infos utilisateur dans le contexte
    c.set('user', validationResult.user as AuthUser);
    
    await next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return c.json({ 
      success: false, 
      error: 'Token invalide ou expiré' 
    }, 401);
  }
};

// Middleware de vérification des rôles
export const requireRole = (allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Utilisateur non authentifié' 
      }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        success: false, 
        error: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}` 
      }, 403);
    }

    await next();
  };
};

// Middleware pour admin uniquement
export const requireAdmin = requireRole(['admin']);

// Middleware pour admin et manager
export const requireAdminOrManager = requireRole(['admin', 'manager']);

// Middleware de vérification des permissions
export const requirePermission = (module: string, action: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Utilisateur non authentifié' 
      }, 401);
    }

    // Les admins ont tous les droits
    if (user.role === 'admin') {
      await next();
      return;
    }

    // Vérifier la permission spécifique
    const { data, error } = await supabaseAdmin.rpc('check_user_permission', {
      p_user_id: user.id,
      p_module: module,
      p_action: action
    });

    if (error || !data) {
      return c.json({ 
        success: false, 
        error: `Permission refusée pour ${action} sur ${module}` 
      }, 403);
    }

    await next();
  };
};

// Helper pour logger les actions
export const logUserAction = async (
  user: AuthUser, 
  action: string, 
  details: string,
  level: string = 'info',
  ipAddress?: string
) => {
  try {
    await supabaseAdmin.rpc('log_action', {
      p_user_id: user.id,
      p_username: user.username,
      p_level: level,
      p_action: action,
      p_details: details,
      p_ip_address: ipAddress || 'unknown'
    });
  } catch (error) {
    console.error('❌ Error logging action:', error);
  }
};