/**
 * Payment Database Adapter
 * Gère les opérations de paiements pour Supabase et MySQL
 */

import { createClient } from '@supabase/supabase-js';

export type DatabaseType = 'supabase' | 'mysql' | 'postgresql';

export interface PaymentData {
  id?: number;
  tenant_id: string;
  document_type: string;
  document_id: number;
  payment_date: string;
  amount: number;
  payment_method?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentBalance {
  totalAmount: number;
  totalPaid: number;
  balance: number;
  status: 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
}

/**
 * Détecte le type de base de données active
 * Côté client: lit depuis localStorage
 * Côté serveur: doit être passé explicitement
 */
export function getActiveDatabaseType(explicitType?: DatabaseType): DatabaseType {
  // Si un type est explicitement fourni (côté serveur), l'utiliser
  if (explicitType) {
    // En production Vercel, vérifier si le proxy Tailscale est disponible
    if (process.env.VERCEL && (explicitType === 'mysql' || explicitType === 'postgresql')) {
      // Si le proxy est configuré, on peut utiliser MySQL/PostgreSQL
      if (process.env.MYSQL_PROXY_URL) {
        console.log(`✅ Production: Utilisation de ${explicitType} via Tailscale proxy`);
        return explicitType; // Retourner le type demandé, pas toujours 'mysql'
      }
      // Sinon, forcer Supabase
      console.warn(`⚠️ Production: ${explicitType} non disponible sans proxy, utilisation de Supabase`);
      return 'supabase';
    }
    return explicitType;
  }
  
  // Côté client, lire depuis localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('activeDbConfig');
    if (saved) {
      const config = JSON.parse(saved);
      return config.type || 'supabase';
    }
  }
  return 'supabase'; // Par défaut
}

// Connection pool pour MySQL (côté serveur uniquement)
let mysqlPool: any = null;

/**
 * Obtient ou crée le pool de connexions MySQL
 */
function getMySQLPool() {
  if (!mysqlPool && typeof window === 'undefined') {
    const mysql = require('mysql2/promise');
    mysqlPool = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'stock_management',
      waitForConnections: true,
      connectionLimit: 10, // Limite à 10 connexions simultanées
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return mysqlPool;
}

/**
 * Exécute une requête MySQL directement (côté serveur uniquement)
 */
async function executeMySQLQuery(sql: string, params: any[] = [], database?: string): Promise<any> {
  // Côté client : utiliser l'API
  if (typeof window !== 'undefined') {
    const config = JSON.parse(localStorage.getItem('activeDbConfig') || '{}');
    const response = await fetch('/api/database/mysql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          host: config.host || 'localhost',
          port: config.port || 3306,
          username: config.username || 'root',
          password: config.password || '',
          database: database || config.database || 'stock_management'
        },
        sql,
        params
      })
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'MySQL query failed');
    }
    return result.data;
  }
  
  // Côté serveur : vérifier si on utilise le proxy Tailscale (production)
  const proxyUrl = process.env.MYSQL_PROXY_URL;
  
  if (proxyUrl) {
    // Production avec Tailscale : utiliser le proxy
    console.log('🔗 Using Tailscale proxy:', proxyUrl);
    const response = await fetch(`${proxyUrl}/api/mysql/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql,
        params,
        database: database || 'stock_management'
      })
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'MySQL proxy query failed');
    }
    return result.data;
  }
  
  // Développement local : utiliser le pool de connexions
  const pool = getMySQLPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Récupère tous les paiements d'un document
 */
export async function getPaymentsByDocument(
  tenantId: string,
  documentType: string,
  documentId: number,
  dbType?: DatabaseType
): Promise<PaymentData[]> {
  const activeDbType = getActiveDatabaseType(dbType);

  if (activeDbType === 'mysql') {
    const sql = `
      SELECT * FROM payments 
      WHERE tenant_id = ? 
        AND document_type = ? 
        AND document_id = ?
      ORDER BY payment_date DESC
    `;
    const rows = await executeMySQLQuery(sql, [tenantId, documentType, documentId]);
    return rows;
  } else {
    // Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('document_type', documentType)
      .eq('document_id', documentId)
      .order('payment_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }
}

/**
 * Crée un nouveau paiement
 */
export async function createPayment(payment: PaymentData, dbType?: DatabaseType): Promise<PaymentData> {
  const activeDbType = getActiveDatabaseType(dbType);

  if (activeDbType === 'mysql') {
    const sql = `
      INSERT INTO payments 
        (tenant_id, document_type, document_id, payment_date, amount, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      payment.tenant_id,
      payment.document_type,
      payment.document_id,
      payment.payment_date,
      payment.amount,
      payment.payment_method || null,
      payment.notes || null
    ];
    
    await executeMySQLQuery(sql, params);
    
    // Récupérer le paiement créé
    const selectSql = `
      SELECT * FROM payments 
      WHERE tenant_id = ? 
        AND document_type = ? 
        AND document_id = ?
      ORDER BY id DESC LIMIT 1
    `;
    const rows = await executeMySQLQuery(selectSql, [
      payment.tenant_id,
      payment.document_type,
      payment.document_id
    ]);
    
    return rows[0];
  } else {
    // Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('payments')
      .insert({
        tenant_id: payment.tenant_id,
        document_type: payment.document_type,
        document_id: payment.document_id,
        payment_date: payment.payment_date,
        amount: payment.amount,
        payment_method: payment.payment_method || null,
        notes: payment.notes || null
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

/**
 * Met à jour un paiement
 */
export async function updatePayment(
  id: number,
  tenantId: string,
  updates: Partial<PaymentData>,
  dbType?: DatabaseType
): Promise<PaymentData> {
  const activeDbType = getActiveDatabaseType(dbType);

  if (activeDbType === 'mysql') {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.payment_date !== undefined) {
      fields.push('payment_date = ?');
      params.push(updates.payment_date);
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      params.push(updates.amount);
    }
    if (updates.payment_method !== undefined) {
      fields.push('payment_method = ?');
      params.push(updates.payment_method);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      params.push(updates.notes);
    }
    
    fields.push('updated_at = NOW()');
    params.push(id, tenantId);

    const sql = `
      UPDATE payments 
      SET ${fields.join(', ')}
      WHERE id = ? AND tenant_id = ?
    `;
    
    await executeMySQLQuery(sql, params);
    
    // Récupérer le paiement mis à jour
    const selectSql = 'SELECT * FROM payments WHERE id = ? AND tenant_id = ?';
    const rows = await executeMySQLQuery(selectSql, [id, tenantId]);
    
    return rows[0];
  } else {
    // Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.payment_date !== undefined) updateData.payment_date = updates.payment_date;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.payment_method !== undefined) updateData.payment_method = updates.payment_method;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

/**
 * Supprime un paiement
 */
export async function deletePayment(id: number, tenantId: string, dbType?: DatabaseType): Promise<void> {
  const activeDbType = getActiveDatabaseType(dbType);

  if (activeDbType === 'mysql') {
    const sql = 'DELETE FROM payments WHERE id = ? AND tenant_id = ?';
    await executeMySQLQuery(sql, [id, tenantId]);
  } else {
    // Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

/**
 * Calcule le solde d'un document
 */
export async function calculateBalance(
  tenantId: string,
  documentType: string,
  documentId: number,
  totalAmount: number,
  dbType?: DatabaseType
): Promise<PaymentBalance> {
  const activeDbType = getActiveDatabaseType(dbType);
  let totalPaid = 0;

  if (activeDbType === 'mysql') {
    const sql = `
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
      WHERE tenant_id = ? 
        AND document_type = ? 
        AND document_id = ?
    `;
    const rows = await executeMySQLQuery(sql, [tenantId, documentType, documentId]);
    totalPaid = parseFloat(rows[0]?.total_paid || '0');
  } else {
    // Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('document_type', documentType)
      .eq('document_id', documentId);

    if (error) throw new Error(error.message);
    totalPaid = data?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
  }

  const balance = totalAmount - totalPaid;
  
  let status: 'paid' | 'partially_paid' | 'unpaid' | 'overpaid';
  if (totalPaid === 0) {
    status = 'unpaid';
  } else if (totalPaid < totalAmount) {
    status = 'partially_paid';
  } else if (totalPaid === totalAmount) {
    status = 'paid';
  } else {
    status = 'overpaid';
  }

  return { totalAmount, totalPaid, balance, status };
}
