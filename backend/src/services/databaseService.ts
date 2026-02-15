import { supabaseAdmin } from '../supabaseClient.js';
import mysql from 'mysql2/promise';
import { Client } from 'pg';

export type DatabaseType = 'supabase' | 'postgresql' | 'mysql';

export interface DatabaseConfig {
  type: DatabaseType;
  name: string;
  // Supabase config
  supabaseUrl?: string;
  supabaseKey?: string;
  // Local database config
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

/**
 * Get a database connection for WhatsApp operations
 */
export async function getDatabaseConnection(): Promise<any> {
  const service = BackendDatabaseService.getInstance();
  const dbType = service.getActiveDatabaseType();
  
  switch (dbType) {
    case 'supabase':
      return {
        query: async (sql: string, params: any[] = []) => {
          // Convert PostgreSQL-style parameters ($1, $2) to Supabase format
          let supabaseSql = sql;
          params.forEach((param, index) => {
            supabaseSql = supabaseSql.replace(`$${index + 1}`, `$${index + 1}`);
          });
          
          const { data, error } = await supabaseAdmin.rpc('execute_sql', {
            sql_query: supabaseSql,
            params: params
          });
          
          if (error) throw error;
          return { rows: data || [], rowCount: data?.length || 0 };
        }
      };
    
    case 'postgresql':
      const pgClient = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE || 'stock_management',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres'
      });
      await pgClient.connect();
      return pgClient;
    
    case 'mysql':
      const mysqlConnection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3307'),
        database: process.env.MYSQL_DATABASE || 'stock_management',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || ''
      });
      
      return {
        query: async (sql: string, params: any[] = []) => {
          // Convert PostgreSQL-style parameters to MySQL format
          let mysqlSql = sql;
          params.forEach((param, index) => {
            mysqlSql = mysqlSql.replace(`$${index + 1}`, '?');
          });
          
          const [rows] = await mysqlConnection.execute(mysqlSql, params);
          return { rows: Array.isArray(rows) ? rows : [rows], rowCount: Array.isArray(rows) ? rows.length : 1 };
        }
      };
    
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

export class BackendDatabaseService {
  private static instance: BackendDatabaseService;
  private activeConfig: DatabaseConfig | null = null;
  private mysqlPool: any = null;
  private pgClient: Client | null = null;

  private constructor() {
    this.loadActiveConfig();
  }

  public static getInstance(): BackendDatabaseService {
    if (!BackendDatabaseService.instance) {
      BackendDatabaseService.instance = new BackendDatabaseService();
    }
    return BackendDatabaseService.instance;
  }

  private loadActiveConfig(): void {
    try {
      // Essayer de charger depuis un fichier de configuration
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'database-config.json');
      
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        const savedConfig = JSON.parse(configData);
        this.activeConfig = savedConfig;
        console.log(`🔄 Configuration chargée depuis le fichier: ${savedConfig.type}`);
        return;
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement de la configuration:', error);
    }
    
    // Configuration par défaut si aucun fichier trouvé
    this.activeConfig = {
      type: 'mysql',
      name: 'MySQL Local',
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      database: process.env.MYSQL_DATABASE || 'stock_management',
      username: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
    };
    console.log('📊 Configuration par défaut: MySQL Local');
  }

  private saveActiveConfig(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'database-config.json');
      
      fs.writeFileSync(configPath, JSON.stringify(this.activeConfig, null, 2));
      console.log(`💾 Configuration sauvegardée: ${this.activeConfig?.type}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  public getActiveDatabaseType(): DatabaseType {
    return this.activeConfig?.type || 'supabase';
  }

  public async switchDatabase(config: DatabaseConfig): Promise<boolean> {
    try {
      console.log(`🔄 Backend switching to database: ${config.type} (${config.name})`);
      console.log(`📊 Config details: host=${config.host}, port=${config.port}, database=${config.database}`);
      
      // Fermer les connexions existantes
      await this.closeConnections();
      
      // CORRECTION: Pour Supabase, utiliser les variables d'environnement si pas fournies
      if (config.type === 'supabase') {
        config.supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
        config.supabaseKey = config.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log(`🌐 Supabase: Using URL ${config.supabaseUrl ? 'provided' : 'missing'}`);
      }
      
      // CORRECTION: Utiliser la configuration correcte pour PostgreSQL
      if (config.type === 'postgresql') {
        // Pour PostgreSQL, utiliser 'postgres' comme base avec des schémas
        config.database = 'postgres';
        console.log(`🐘 PostgreSQL: Using database 'postgres' with schemas`);
      }
      
      // Tester la nouvelle configuration
      const testResult = await this.testConnection(config);
      if (!testResult) {
        throw new Error('Connection test failed');
      }
      
      // Sauvegarder la nouvelle configuration EN MÉMOIRE UNIQUEMENT
      this.activeConfig = config;
      // NE PAS sauvegarder dans un fichier - la config doit venir du header X-Database-Type à chaque requête
      // this.saveActiveConfig(); // ❌ DÉSACTIVÉ - cause des problèmes de synchronisation
      
      console.log(`✅ Backend database switched to: ${config.type}`);
      console.log(`📊 Active config: host=${this.activeConfig.host}, port=${this.activeConfig.port}`);
      return true;
    } catch (error) {
      console.error('❌ Backend database switch failed:', error);
      return false;
    }
  }

  private async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      switch (config.type) {
        case 'supabase':
          // Test Supabase connection avec une requête simple
          try {
            const { data, error } = await supabaseAdmin.rpc('get_suppliers_by_tenant', { p_tenant: '2025_bu01' });
            console.log('🔍 Supabase test result:', { success: !error, dataLength: data?.length || 0 });
            return !error;
          } catch (supabaseError) {
            console.error('❌ Supabase connection test failed:', supabaseError);
            return false;
          }
          
        case 'mysql':
          // Test MySQL connection using pool
          try {
            const pool = this.getMySQLPool();
            await pool.query('SELECT 1');
            return true;
          } catch (error) {
            console.error('❌ MySQL connection test failed:', error);
            return false;
          }
          
        case 'postgresql':
          // Test PostgreSQL connection
          const pgClient = new Client({
            host: config.host || 'localhost',
            port: config.port || 5432,
            user: config.username || 'postgres',
            password: config.password || 'postgres',
            database: config.database || 'postgres'  // CORRECTION: utiliser 'postgres' par défaut
          });
          await pgClient.connect();
          await pgClient.query('SELECT 1');
          await pgClient.end();
          return true;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Connection test failed for ${config.type}:`, error);
      return false;
    }
  }

  private async closeConnections(): Promise<void> {
    try {
      // Ne pas fermer le pool MySQL car il est réutilisé
      // Le pool gère lui-même ses connexions
      if (this.mysqlPool) {
        // On ne ferme pas le pool, on le garde actif
        console.log('🔗 MySQL Pool kept alive for reuse');
      }
      if (this.pgClient) {
        await this.pgClient.end();
        this.pgClient = null;
      }
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  }

  // Méthodes pour exécuter des requêtes selon le type de base de données
  public async executeQuery(sql: string, params: any[] = []): Promise<any> {
    const dbType = this.getActiveDatabaseType();
    
    switch (dbType) {
      case 'supabase':
        return this.executeSupabaseQuery(sql, params);
      case 'mysql':
        return this.executeMySQLQuery(sql, params);
      case 'postgresql':
        return this.executePostgreSQLQuery(sql, params);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  public async executeRPC(functionName: string, params: Record<string, any>): Promise<any> {
    const dbType = this.getActiveDatabaseType();
    
    switch (dbType) {
      case 'supabase':
        return this.executeSupabaseRPC(functionName, params);
      case 'mysql':
        return this.executeMySQLRPC(functionName, params);
      case 'postgresql':
        return this.executePostgreSQLRPC(functionName, params);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  private async executeSupabaseQuery(sql: string, params: any[]): Promise<any> {
    // Pour Supabase, utiliser les RPC functions
    throw new Error('Direct SQL queries not supported for Supabase. Use RPC functions instead.');
  }

  private async executeSupabaseRPC(functionName: string, params: Record<string, any>): Promise<any> {
    try {
      // Essayer d'abord la fonction RPC
      const { data, error } = await supabaseAdmin.rpc(functionName, params);
      if (error) {
        // Si la fonction n'existe pas, utiliser une approche adaptative
        if (error.message.includes('Could not find the function') || error.message.includes('schema cache')) {
          console.log(`🔄 Supabase RPC ${functionName} not found, using adaptive fallback...`);
          return this.executeSupabaseAdaptiveFallback(functionName, params);
        }
        throw new Error(`Supabase RPC error: ${error.message}`);
      }
      return { success: true, data };
    } catch (error) {
      console.error(`Supabase RPC ${functionName} failed:`, error);
      // Essayer le fallback adaptatif
      if (error instanceof Error && error.message.includes('Could not find the function')) {
        console.log(`🔄 Using adaptive fallback for ${functionName}...`);
        return this.executeSupabaseAdaptiveFallback(functionName, params);
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executeSupabaseAdaptiveFallback(functionName: string, params: Record<string, any>): Promise<any> {
    try {
      const tenant = params.p_tenant || '2025_bu01';
      
      switch (functionName) {
        case 'get_proforma_list':
        case 'get_proforma_list_by_tenant':
          return this.getSupabaseProformaList(tenant);
          
        case 'get_proforma_by_id':
        case 'get_proforma_by_id_from_tenant':
        case 'get_proforma_by_id_adaptive':
          return this.getSupabaseProformaById(tenant, params.p_nfact);
          
        case 'get_bl_list':
        case 'get_bl_list_by_tenant':
          // Utiliser la vraie fonction RPC qui existe dans Supabase
          return this.executeSupabaseRPC('get_delivery_notes', params);
          
        case 'get_bl_by_id':
        case 'get_bl_by_id_from_tenant':
          return this.getSupabaseBLById(tenant, params.p_nfact);
          
        case 'discover_bl_tables':
          return this.discoverBLTables(tenant);
          
        case 'get_fact_list':
        case 'get_fact_list_by_tenant':
          return this.getSupabaseFactList(tenant);
          
        case 'get_fact_by_id':
        case 'get_fact_by_id_from_tenant':
        case 'get_fact_by_id_adaptive':
          return this.getSupabaseFactById(tenant, params.p_nfact);
          
        case 'get_articles_by_tenant':
          return this.getSupabaseArticles(tenant);
          
        case 'get_clients_by_tenant':
          return this.getSupabaseClients(tenant);
          
        case 'get_suppliers_by_tenant':
        case 'get_fournisseurs_by_tenant':
          return this.getSupabaseSuppliers(tenant);
          
        default:
          console.log(`⚠️ No adaptive fallback available for ${functionName}, using mock data`);
          return this.getMockDataForFunction(functionName, params);
      }
    } catch (error) {
      console.error(`❌ Adaptive fallback failed for ${functionName}:`, error);
      return this.getMockDataForFunction(functionName, params);
    }
  }

  private async getSupabaseProformaList(tenant: string): Promise<any> {
    try {
      // Essayer d'abord avec la table fprof du schéma tenant
      const { data, error } = await supabaseAdmin
        .from(`${tenant}.fprof`)
        .select(`
          *,
          client:${tenant}.client(nom)
        `)
        .order('nfact', { ascending: false });

      if (!error && data) {
        const formattedData = data.map(item => ({
          ...item,
          client_name: item.client?.nom || null
        }));
        return { success: true, data: formattedData };
      }

      // Si ça échoue, essayer sans le schéma
      const { data: data2, error: error2 } = await supabaseAdmin
        .from('fprof')
        .select(`
          *,
          client:client(nom)
        `)
        .order('nfact', { ascending: false });

      if (!error2 && data2) {
        const formattedData = data2.map(item => ({
          ...item,
          client_name: item.client?.nom || null
        }));
        return { success: true, data: formattedData };
      }

      // Si tout échoue, utiliser des données mock
      throw new Error('No proforma table found');
    } catch (error) {
      console.log(`📋 Using mock proforma data for tenant: ${tenant}`);
      return this.getMockProformaData();
    }
  }

  private async getSupabaseBLList(tenant: string): Promise<any> {
    try {
      // Essayer d'abord avec la table bl du schéma tenant (même approche que proformas)
      const { data, error } = await supabaseAdmin
        .from(`${tenant}.bl`)
        .select(`
          *,
          client:${tenant}.client(nom, raison_sociale)
        `)
        .order('nfact', { ascending: false });

      if (!error && data) {
        const formattedData = data.map(item => ({
          ...item,
          client_name: item.client?.raison_sociale || item.client?.nom || null
        }));
        console.log(`✅ Found ${formattedData.length} BL records in table: ${tenant}.bl`);
        return { success: true, data: formattedData };
      }

      // Si ça échoue, essayer sans le schéma
      const { data: data2, error: error2 } = await supabaseAdmin
        .from('bl')
        .select(`
          *,
          client:client(nom, raison_sociale)
        `)
        .order('nfact', { ascending: false });

      if (!error2 && data2) {
        const formattedData = data2.map(item => ({
          ...item,
          client_name: item.client?.raison_sociale || item.client?.nom || null
        }));
        console.log(`✅ Found ${formattedData.length} BL records in table: bl`);
        return { success: true, data: formattedData };
      }

      // Si tout échoue, retourner vide
      throw new Error('No BL table found');
    } catch (error) {
      console.log(`📋 No BL table found for tenant: ${tenant}, returning empty data`);
      return { success: true, data: [] };
    }
  }

  private async getSupabaseFactList(tenant: string): Promise<any> {
    try {
      const tableVariants = [`${tenant}.facture`, `${tenant}.fact`, 'facture', 'fact'];
      
      for (const table of tableVariants) {
        try {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select(`
              *,
              client:client(nom)
            `)
            .order('nfact', { ascending: false });

          if (!error && data) {
            const formattedData = data.map(item => ({
              ...item,
              client_name: item.client?.nom || null
            }));
            return { success: true, data: formattedData };
          }
        } catch (e) {
          continue;
        }
      }
      
      throw new Error('No facture table found');
    } catch (error) {
      console.log(`📋 Using mock facture data for tenant: ${tenant}`);
      return { success: true, data: [] };
    }
  }

  private async discoverBLTables(tenant: string): Promise<any> {
    try {
      console.log(`🔍 Discovering BL tables for tenant: ${tenant}`);
      
      // Essayer de lister toutes les tables qui pourraient contenir des BL
      const possibleTables = [
        'bl', 'bon_livraison', 'delivery_notes', 'bons_livraison',
        'facture', 'fact', 'invoice', 'invoices',
        'vente', 'ventes', 'sale', 'sales'
      ];
      
      const foundTables = [];
      
      for (const tableName of possibleTables) {
        try {
          // Essayer avec le schéma tenant
          const { data, error } = await supabaseAdmin
            .from(`${tenant}.${tableName}`)
            .select('*')
            .limit(1);
            
          if (!error) {
            foundTables.push(`${tenant}.${tableName}`);
            console.log(`✅ Found table: ${tenant}.${tableName}`);
          }
        } catch (e) {
          // Essayer sans schéma
          try {
            const { data, error } = await supabaseAdmin
              .from(tableName)
              .select('*')
              .limit(1);
              
            if (!error) {
              foundTables.push(tableName);
              console.log(`✅ Found table: ${tableName}`);
            }
          } catch (e2) {
            // Table n'existe pas
          }
        }
      }
      
      return { success: true, data: foundTables };
    } catch (error) {
      console.error(`❌ Error discovering tables:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async getSupabaseBLById(tenant: string, nfact: string): Promise<any> {
    try {
      console.log(`🔍 Looking for BL with ID ${nfact} in tenant ${tenant}`);
      
      // Utiliser la fonction RPC get_delivery_notes et filtrer par ID
      const { data: blList, error: listError } = await supabaseAdmin.rpc('get_delivery_notes', {
        p_tenant: tenant
      });
      
      if (!listError && blList && Array.isArray(blList)) {
        console.log(`📋 Found ${blList.length} BL records, searching for ID ${nfact}`);
        
        // Chercher le BL par nbl (c'est le vrai ID dans get_delivery_notes)
        const foundBL = blList.find(bl => 
          String(bl.nbl) === String(nfact) ||
          String(bl.nfact) === String(nfact) ||
          String(bl.id) === String(nfact)
        );
        
        if (foundBL) {
          console.log(`✅ Found BL ${nfact}:`, foundBL);
          
          // CORRECTION: Récupérer les VRAIES données depuis 2025_bu01.detail_bl via exec_sql
          let blDetails = [];
          try {
            console.log(`🔍 Fetching REAL BL details for NFact: ${foundBL.nbl} from ${tenant}.detail_bl`);
            
            // Utiliser exec_sql pour accéder aux vraies données de detail_bl
            const { data: detailsData, error: detailsError } = await supabaseAdmin.rpc('exec_sql', {
              sql: `SELECT d.*, a.designation FROM "${tenant}".detail_bl d LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle WHERE d.nfact = ${foundBL.nbl} ORDER BY d.id;`
            });

            if (!detailsError && detailsData && detailsData.length > 0) {
              blDetails = detailsData.map(detail => ({
                narticle: detail.narticle || detail.Narticle || '',
                designation: detail.designation || `Article ${detail.narticle}`,
                qte: detail.qte || 0,
                prix: detail.prix || 0,
                tva: detail.tva || 0,
                total_ligne: detail.total_ligne || 0
              }));
              console.log(`✅ Found ${blDetails.length} REAL article details for BL ${nfact}`);
              console.log(`📦 Real articles:`, blDetails);
            } else {
              console.log(`⚠️ No real details found in ${tenant}.detail_bl for NFact ${foundBL.nbl}:`, detailsError?.message);
              
              // Si pas de détails trouvés, laisser vide plutôt que d'utiliser des données mock
              blDetails = [];
            }
          } catch (detailError) {
            console.error(`❌ Error fetching REAL BL details:`, detailError);
            blDetails = [];
          }
          
          // Créer la structure complète avec les VRAIES détails
          const formattedBL = {
            ...foundBL,
            // Normaliser les champs pour compatibilité
            nfact: foundBL.nbl,
            date_fact: foundBL.date_bl,
            client_name: foundBL.nclient, // Pour l'instant, utiliser nclient
            details: blDetails, // CORRECTION: Maintenant avec les VRAIES données
            // Garder les champs originaux aussi
            nbl: foundBL.nbl,
            montant_ttc: foundBL.montant_ttc
          };
          
          return { 
            success: true, 
            data: formattedBL
          };
        } else {
          console.log(`❌ BL ${nfact} not found in list of ${blList.length} BL records`);
          console.log(`📋 Available IDs:`, blList.map(bl => ({ nbl: bl.nbl, nclient: bl.nclient })));
        }
      } else {
        console.log(`❌ Error getting BL list:`, listError?.message);
      }

      throw new Error('BL not found');
    } catch (error) {
      console.log(`📋 BL ${nfact} not found in tenant ${tenant}:`, error instanceof Error ? error.message : error);
      return { success: false, error: 'BL not found' };
    }
  }

  private async getSupabaseProformaById(tenant: string, nfact: string): Promise<any> {
    try {
      console.log(`🔍 Looking for Proforma with ID ${nfact} in tenant ${tenant}`);
      
      // First, try to get the proforma from the fprof table using exec_sql
      const { data: proformaData, error: proformaError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `SELECT f.*, c.raison_sociale FROM "${tenant}".fprof f LEFT JOIN "${tenant}".client c ON f.nclient = c.nclient WHERE f.nfact = ${nfact};`
      });

      if (proformaError || !proformaData || proformaData.length === 0) {
        console.log(`❌ Proforma ${nfact} not found in ${tenant}.fprof table:`, proformaError?.message);
        throw new Error('Proforma not found');
      }

      const proforma = proformaData[0];
      console.log(`✅ Found proforma ${nfact}:`, proforma);
      
      // Now get the REAL proforma details from detail_fprof table using exec_sql
      let proformaDetails = [];
      try {
        console.log(`🔍 Fetching REAL Proforma details for NFact: ${nfact} from ${tenant}.detail_fprof`);
        
        const { data: detailsData, error: detailsError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT d.*, a.designation FROM "${tenant}".detail_fprof d LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle WHERE d.nfact = ${nfact} ORDER BY d.id;`
        });

        if (!detailsError && detailsData && detailsData.length > 0) {
          proformaDetails = detailsData.map(detail => ({
            narticle: detail.narticle || detail.Narticle || '',
            designation: detail.designation || `Article ${detail.narticle}`,
            qte: detail.qte || 0,
            prix: detail.prix || 0,
            tva: detail.tva || 0,
            total_ligne: detail.total_ligne || 0,
            pr_achat: detail.pr_achat || 0
          }));
          console.log(`✅ Found ${proformaDetails.length} REAL article details for Proforma ${nfact}`);
          console.log(`📦 Real articles:`, proformaDetails);
        } else {
          console.log(`⚠️ No real details found in ${tenant}.detail_fprof for NFact ${nfact}:`, detailsError?.message);
          
          // Try with uppercase field names as backup
          console.log(`🔄 Trying with uppercase field names...`);
          const { data: detailsDataUpper, error: detailsErrorUpper } = await supabaseAdmin.rpc('exec_sql', {
            sql: `SELECT d.*, a.designation FROM "${tenant}".detail_fprof d LEFT JOIN "${tenant}".article a ON d.Narticle = a.Narticle WHERE d.NFact = ${nfact} ORDER BY d.id;`
          });
          
          if (!detailsErrorUpper && detailsDataUpper && detailsDataUpper.length > 0) {
            proformaDetails = detailsDataUpper.map(detail => ({
              narticle: detail.narticle || detail.Narticle,
              designation: detail.designation || `Article ${detail.narticle || detail.Narticle}`,
              qte: detail.qte || detail.Qte || 0,
              prix: detail.prix || detail.prix || 0,
              tva: detail.tva || detail.tva || 0,
              total_ligne: detail.total_ligne || detail.total_ligne || 0,
              pr_achat: detail.pr_achat || 0
            }));
            console.log(`✅ Found ${proformaDetails.length} REAL article details with uppercase fields for Proforma ${nfact}`);
          } else {
            console.log(`⚠️ No details found with either case for Proforma ${nfact}`);
            proformaDetails = [];
          }
        }
      } catch (detailError) {
        console.error(`❌ Error fetching REAL Proforma details:`, detailError);
        proformaDetails = [];
      }
      
      // Create the complete structure with REAL details
      const formattedProforma = {
        ...proforma,
        client_name: proforma.raison_sociale || proforma.nclient,
        details: proformaDetails, // REAL data from detail_fprof table
        // Ensure compatibility with frontend expectations
        montant_ttc: proforma.montant_ttc || (proforma.montant_ht + proforma.tva)
      };
      
      return { 
        success: true, 
        data: formattedProforma
      };

    } catch (error) {
      console.log(`📋 Proforma ${nfact} not found in tenant ${tenant}:`, error instanceof Error ? error.message : error);
      return { success: false, error: 'Proforma not found' };
    }
  }

  private async getSupabaseFactById(tenant: string, nfact: string): Promise<any> {
    try {
      console.log(`🔍 Looking for Invoice with ID ${nfact} in tenant ${tenant}`);
      
      // First, try to get the invoice from the fact table using exec_sql
      const { data: factData, error: factError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `SELECT f.*, c.raison_sociale FROM "${tenant}".fact f LEFT JOIN "${tenant}".client c ON f.nclient = c.nclient WHERE f.nfact = ${nfact};`
      });

      if (factError || !factData || factData.length === 0) {
        console.log(`❌ Invoice ${nfact} not found in ${tenant}.fact table:`, factError?.message);
        throw new Error('Invoice not found');
      }

      const invoice = factData[0];
      console.log(`✅ Found invoice ${nfact}:`, invoice);
      
      // Now get the REAL invoice details from detail_fact table using exec_sql
      // CORRECTION: Use uppercase field names NFact, Narticle as per database schema
      let invoiceDetails = [];
      try {
        console.log(`🔍 Fetching REAL Invoice details for NFact: ${nfact} from ${tenant}.detail_fact`);
        
        const { data: detailsData, error: detailsError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT d.*, a.designation FROM "${tenant}".detail_fact d LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle WHERE d.nfact = ${nfact} ORDER BY d.id;`
        });

        if (!detailsError && detailsData && detailsData.length > 0) {
          invoiceDetails = detailsData.map(detail => ({
            narticle: detail.narticle || detail.Narticle || '',
            designation: detail.designation || `Article ${detail.narticle}`,
            qte: detail.qte || 0,
            prix: detail.prix || 0,
            tva: detail.tva || 0,
            total_ligne: detail.total_ligne || 0,
            pr_achat: detail.pr_achat || 0
          }));
          console.log(`✅ Found ${invoiceDetails.length} REAL article details for Invoice ${nfact}`);
          console.log(`📦 Real articles:`, invoiceDetails);
        } else {
          console.log(`⚠️ No real details found in ${tenant}.detail_fact for NFact ${nfact}:`, detailsError?.message);
          
          // Try with uppercase field names as backup
          console.log(`🔄 Trying with uppercase field names...`);
          const { data: detailsDataUpper, error: detailsErrorUpper } = await supabaseAdmin.rpc('exec_sql', {
            sql: `SELECT d.*, a.designation FROM "${tenant}".detail_fact d LEFT JOIN "${tenant}".article a ON d.Narticle = a.Narticle WHERE d.NFact = ${nfact} ORDER BY d.id;`
          });
          
          if (!detailsErrorUpper && detailsDataUpper && detailsDataUpper.length > 0) {
            invoiceDetails = detailsDataUpper.map(detail => ({
              narticle: detail.narticle || detail.Narticle,
              designation: detail.designation || `Article ${detail.narticle || detail.Narticle}`,
              qte: detail.qte || detail.Qte || 0,
              prix: detail.prix || detail.prix || 0,
              tva: detail.tva || detail.tva || 0,
              total_ligne: detail.total_ligne || detail.total_ligne || 0,
              pr_achat: detail.pr_achat || 0
            }));
            console.log(`✅ Found ${invoiceDetails.length} REAL article details with uppercase fields for Invoice ${nfact}`);
          } else {
            console.log(`⚠️ No details found with either case for Invoice ${nfact}`);
            invoiceDetails = [];
          }
        }
      } catch (detailError) {
        console.error(`❌ Error fetching REAL Invoice details:`, detailError);
        invoiceDetails = [];
      }
      
      // Create the complete structure with REAL details
      const formattedInvoice = {
        ...invoice,
        client_name: invoice.raison_sociale || invoice.nclient,
        details: invoiceDetails, // REAL data from detail_fact table
        // Ensure compatibility with frontend expectations
        montant_ttc: invoice.montant_ttc || (invoice.montant_ht + invoice.tva)
      };
      
      return { 
        success: true, 
        data: formattedInvoice
      };

    } catch (error) {
      console.log(`📋 Invoice ${nfact} not found in tenant ${tenant}:`, error instanceof Error ? error.message : error);
      return { success: false, error: 'Invoice not found' };
    }
  }

  private async getSupabaseArticles(tenant: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from(`${tenant}.article`)
        .select('*')
        .order('narticle', { ascending: true });

      if (!error && data) {
        return { success: true, data };
      }

      // Fallback sans schéma
      const { data: data2, error: error2 } = await supabaseAdmin
        .from('article')
        .select('*')
        .order('narticle', { ascending: true });

      if (!error2 && data2) {
        return { success: true, data: data2 };
      }

      throw new Error('No article table found');
    } catch (error) {
      return { success: true, data: [] };
    }
  }

  private async getSupabaseClients(tenant: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from(`${tenant}.client`)
        .select('*')
        .order('nclient', { ascending: true });

      if (!error && data) {
        return { success: true, data };
      }

      // Fallback sans schéma
      const { data: data2, error: error2 } = await supabaseAdmin
        .from('client')
        .select('*')
        .order('nclient', { ascending: true });

      if (!error2 && data2) {
        return { success: true, data: data2 };
      }

      throw new Error('No client table found');
    } catch (error) {
      return { success: true, data: [] };
    }
  }

  private async getSupabaseSuppliers(tenant: string): Promise<any> {
    try {
      const tableVariants = [`${tenant}.fournisseur`, `${tenant}.supplier`, 'fournisseur', 'supplier'];
      
      for (const table of tableVariants) {
        try {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .order('nfournisseur', { ascending: true });

          if (!error && data) {
            return { success: true, data };
          }
        } catch (e) {
          continue;
        }
      }
      
      throw new Error('No supplier table found');
    } catch (error) {
      return { success: true, data: [] };
    }
  }

  private getMockProformaData(): any {
    return {
      success: true,
      data: [
        {
          nfact: 1,
          nclient: "C001",
          client_name: "SECTEUR SANITAIRE AINT TEDELES",
          date_fact: "2025-01-06",
          montant_ht: 15000.00,
          tva: 2850.00,
          montant_ttc: 17850.00,
          created_at: "2025-01-06T10:00:00.000Z"
        },
        {
          nfact: 2,
          nclient: "C002", 
          client_name: "A P C MOSTAGANEM",
          date_fact: "2025-01-05",
          montant_ht: 25000.00,
          tva: 4750.00,
          montant_ttc: 29750.00,
          created_at: "2025-01-05T14:30:00.000Z"
        },
        {
          nfact: 3,
          nclient: "C003",
          client_name: "ALGERIE TELECOM", 
          date_fact: "2025-01-04",
          montant_ht: 35000.00,
          tva: 6650.00,
          montant_ttc: 41650.00,
          created_at: "2025-01-04T09:15:00.000Z"
        }
      ]
    };
  }

  private getMockDataForFunction(functionName: string, params: Record<string, any>): any {
    switch (functionName) {
      case 'get_proforma_list':
      case 'get_proforma_list_by_tenant':
        return this.getMockProformaData();
      case 'get_bl_list':
      case 'get_bl_list_by_tenant':
        // Pour les BL, retourner des données vides si pas de vraies données
        return { success: true, data: [] };
      default:
        return { success: true, data: [] };
    }
  }

  private mysqlPool: any = null;
  private currentMySQLDatabase: string = '';

  private getMySQLPool() {
    const targetDatabase = this.activeConfig?.database || 'stock_management';
    
    // Si le pool existe ET que la base de données a changé, fermer l'ancien pool
    if (this.mysqlPool && this.currentMySQLDatabase !== targetDatabase) {
      console.log(`🔄 Database changed from ${this.currentMySQLDatabase} to ${targetDatabase}, recreating pool...`);
      try {
        this.mysqlPool.end();
      } catch (e) {
        console.warn('⚠️ Error closing old pool:', e);
      }
      this.mysqlPool = null;
    }
    
    if (!this.mysqlPool) {
      const config = {
        host: this.activeConfig?.host || 'localhost',
        port: this.activeConfig?.port || 3306,
        database: targetDatabase,
        user: this.activeConfig?.username || 'root',
        password: this.activeConfig?.password || '',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      };
      console.log(`🔗 Creating MySQL Pool:`, { host: config.host, port: config.port, database: config.database, user: config.user });
      console.log(`📍 Stack trace:`, new Error().stack?.split('\n').slice(1, 4).join('\n'));
      this.mysqlPool = mysql.createPool(config);
      this.currentMySQLDatabase = targetDatabase;
      console.log(`✅ MySQL Pool created with 10 connections max for database: ${targetDatabase}`);
    }
    return this.mysqlPool;
  }

  private async executeMySQLQuery(sql: string, params: any[]): Promise<any> {
    try {
      const pool = this.getMySQLPool();
      
      console.log(`🐬 MySQL: Executing query: ${sql.substring(0, 100)}...`);
      
      const [rows] = await pool.execute(sql, params);
      console.log(`✅ MySQL: Query successful, ${Array.isArray(rows) ? rows.length : 0} rows returned`);
      return { success: true, data: rows };
    } catch (error) {
      console.error('❌ MySQL query failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executeMySQLRPC(functionName: string, params: Record<string, any>): Promise<any> {
    // Pour MySQL, essayer d'abord les vraies procédures stockées, puis fallback vers SQL
    console.log(`🐬 MySQL: Trying real stored procedure ${functionName}...`);
    
    try {
      const pool = this.getMySQLPool();
      
      // Essayer d'abord d'appeler la vraie procédure stockée
      let procedureName = '';
      let procedureParams: any[] = [];
      
      switch (functionName) {
        case 'get_articles_by_tenant':
        case 'get_suppliers_by_tenant':
        case 'get_fournisseurs_by_tenant':
        case 'get_clients_by_tenant':
        case 'get_bl_list_by_tenant':
        case 'get_bl_list':
        case 'get_fact_list_by_tenant':
        case 'get_fact_list':
        case 'get_proforma_list_by_tenant':
        case 'get_next_bl_number_by_tenant':
        case 'get_next_bl_number':
        case 'get_next_bl_number_simple':
        case 'get_next_fact_number_by_tenant':
        case 'get_next_fact_number':
        case 'get_next_proforma_number_by_tenant':
          procedureName = functionName;
          procedureParams = [params.p_tenant];
          break;
        
        // NOUVELLES PROCÉDURES DE MODIFICATION BL
        case 'update_bl':
          return this.executeMySQLUpdateBL(params);
          
        case 'delete_bl_details':
          return this.executeMySQLDeleteBLDetails(params);
          
        case 'insert_bl_detail':
          return this.executeMySQLInsertBLDetail(params);
        
        default:
          // Si la procédure stockée n'est pas supportée, utiliser la conversion SQL
          console.log(`🐬 MySQL: No stored procedure for ${functionName}, using SQL conversion`);
          return this.convertRPCToSQL('mysql', functionName, params);
      }
      
      // Essayer d'exécuter la vraie procédure stockée
      const [rows] = await pool.execute(`CALL ${procedureName}(?)`, procedureParams);
      console.log(`✅ MySQL: Real stored procedure ${functionName} succeeded with ${Array.isArray(rows) ? rows.length : 0} results`);
      
      return { 
        success: true, 
        data: rows,
        source: 'real_procedure' // Indiquer que c'est une vraie procédure stockée
      };
      
    } catch (procedureError) {
      console.warn(`⚠️ MySQL: Real stored procedure ${functionName} failed, falling back to SQL conversion`);
      console.warn(`   Procedure Error: ${procedureError instanceof Error ? procedureError.message : procedureError}`);
      
      // Fallback vers la conversion SQL si la procédure stockée n'existe pas
      return this.convertRPCToSQL('mysql', functionName, params);
    }
  }

  private async executePostgreSQLQuery(sql: string, params: any[]): Promise<any> {
    try {
      if (!this.pgClient) {
        this.pgClient = new Client({
          host: this.activeConfig?.host || 'localhost',
          port: this.activeConfig?.port || 5432,
          user: this.activeConfig?.username || 'postgres',
          password: this.activeConfig?.password || 'postgres',
          database: this.activeConfig?.database || 'postgres'  // CORRECTION: utiliser 'postgres' par défaut
        });
        await this.pgClient.connect();
      }
      
      const result = await this.pgClient.query(sql, params);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('PostgreSQL query failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executePostgreSQLRPC(functionName: string, params: Record<string, any>): Promise<any> {
    // Pour PostgreSQL local, essayer d'abord les vraies fonctions RPC, puis fallback vers SQL
    console.log(`🐘 PostgreSQL: Trying real RPC function ${functionName}...`);
    
    try {
      if (!this.pgClient) {
        this.pgClient = new Client({
          host: this.activeConfig?.host || 'localhost',
          port: this.activeConfig?.port || 5432,
          user: this.activeConfig?.username || 'postgres',
          password: this.activeConfig?.password || 'postgres',
          database: this.activeConfig?.database || 'postgres'
        });
        await this.pgClient.connect();
      }
      
      // Essayer d'abord d'appeler la vraie fonction RPC
      let rpcSQL = '';
      let rpcParams: any[] = [];
      
      switch (functionName) {
        case 'get_articles_by_tenant':
        case 'get_suppliers_by_tenant':
        case 'get_fournisseurs_by_tenant':
        case 'get_clients_by_tenant':
        case 'get_bl_list_by_tenant':
        case 'get_bl_list':
        case 'get_fact_list_by_tenant':
        case 'get_fact_list':
        case 'get_proforma_list_by_tenant':
        case 'get_next_bl_number_by_tenant':
        case 'get_next_bl_number':
        case 'get_next_bl_number_simple':
        case 'get_next_fact_number_by_tenant':
        case 'get_next_fact_number':
        case 'get_next_proforma_number_by_tenant':
          rpcSQL = `SELECT * FROM ${functionName}($1)`;
          rpcParams = [params.p_tenant];
          break;
        
        default:
          // Si la fonction RPC n'est pas supportée, utiliser la conversion SQL
          console.log(`🐘 PostgreSQL: No RPC function for ${functionName}, using SQL conversion`);
          return this.convertRPCToSQL('postgresql', functionName, params);
      }
      
      // Essayer d'exécuter la vraie fonction RPC
      const result = await this.pgClient.query(rpcSQL, rpcParams);
      console.log(`✅ PostgreSQL: Real RPC function ${functionName} succeeded with ${result.rows.length} results`);
      
      return { 
        success: true, 
        data: result.rows,
        source: 'real_rpc' // Indiquer que c'est une vraie fonction RPC
      };
      
    } catch (rpcError) {
      console.warn(`⚠️ PostgreSQL: Real RPC function ${functionName} failed, falling back to SQL conversion`);
      console.warn(`   RPC Error: ${rpcError instanceof Error ? rpcError.message : rpcError}`);
      
      // Fallback vers la conversion SQL si la fonction RPC n'existe pas
      return this.convertRPCToSQL('postgresql', functionName, params);
    }
  }

  private async convertRPCToSQL(dbType: 'mysql' | 'postgresql', functionName: string, params: Record<string, any>): Promise<any> {
    // Convertir les appels RPC Supabase en requêtes SQL pour les bases locales
    try {
      switch (functionName) {
        case 'get_articles_by_tenant':
          return this.getArticlesByTenant(dbType, params.p_tenant);
        case 'insert_article_to_tenant':
          return this.insertArticleToTenant(dbType, params);
        case 'get_article_by_id_from_tenant':
          return this.getArticleByIdFromTenant(dbType, params.p_tenant, params.p_narticle);
        case 'update_article_in_tenant':
          return this.updateArticleInTenant(dbType, params);
        case 'delete_article_from_tenant':
          return this.deleteArticleFromTenant(dbType, params.p_tenant, params.p_narticle);
        case 'get_suppliers_by_tenant':
        case 'get_fournisseurs_by_tenant':
          return this.getSuppliersByTenant(dbType, params.p_tenant);
        case 'insert_supplier_to_tenant':
          return this.insertSupplierToTenant(dbType, params);
        case 'update_supplier_in_tenant':
          return this.updateSupplierInTenant(dbType, params);
        case 'delete_supplier_from_tenant':
          return this.deleteSupplierFromTenant(dbType, params.p_tenant, params.p_nfournisseur);
        case 'get_clients_by_tenant':
          return this.getClientsByTenant(dbType, params.p_tenant);
        case 'insert_client_to_tenant':
          return this.insertClientToTenant(dbType, params);
        case 'update_client_in_tenant':
          return this.updateClientInTenant(dbType, params);
        case 'delete_client_from_tenant':
          return this.deleteClientFromTenant(dbType, params.p_tenant, params.p_nclient);
        // Fonctions pour les ventes (BL, factures, proformas)
        case 'get_bl_list':
        case 'get_bl_list_by_tenant':
          return this.getBLList(dbType, params.p_tenant);
        case 'get_bl_by_id':
        case 'get_bl_by_id_from_tenant':
          return this.getBLById(dbType, params.p_tenant, params.p_nfact);
        case 'get_fact_list':
        case 'get_fact_list_by_tenant':
          return this.getFactList(dbType, params.p_tenant);
        case 'get_fact_by_id':
        case 'get_fact_by_id_from_tenant':
          return this.getFactById(dbType, params.p_tenant, params.p_nfact);
        case 'get_proforma_list':
        case 'get_proforma_list_by_tenant':
          return this.getProformaList(dbType, params.p_tenant);
        case 'get_proforma_by_id':
        case 'get_proforma_by_id_from_tenant':
        case 'get_fprof_by_id':
          return this.getProformaById(dbType, params.p_tenant, params.p_nfact);
        case 'insert_bl_simple':
        case 'insert_bl':
        case 'insert_bl_to_tenant':
          return this.insertBL(dbType, params);
        case 'insert_fact':
        case 'insert_fact_to_tenant':
          return this.insertFact(dbType, params);
        case 'insert_proforma':
        case 'insert_proforma_to_tenant':
          return this.insertProforma(dbType, params);
        case 'insert_detail_bl_simple':
        case 'insert_detail_bl':
        case 'insert_detail_bl_to_tenant':
          return this.insertDetailBL(dbType, params);
        case 'insert_detail_fact':
        case 'insert_detail_fact_to_tenant':
          return this.insertDetailFact(dbType, params);
        case 'insert_detail_proforma':
        case 'insert_detail_proforma_to_tenant':
          return this.insertDetailProforma(dbType, params);
        case 'get_next_bl_number_simple':
        case 'get_next_bl_number':
        case 'get_next_bl_number_by_tenant':
          return this.getNextBLNumber(dbType, params.p_tenant);
        case 'get_next_fact_number':
        case 'get_next_fact_number_by_tenant':
          return this.getNextFactNumber(dbType, params.p_tenant);
        case 'get_next_proforma_number':
        case 'get_next_proforma_number_by_tenant':
          return this.getNextProformaNumber(dbType, params.p_tenant);
        // Fonctions pour le stock
        case 'get_article_stock':
        case 'get_article_stock_simple':
          return this.getArticleStock(dbType, params.p_tenant, params.p_narticle);
        case 'update_stock_bl':
          return this.updateStockBL(dbType, params);
        case 'update_stock_f':
          return this.updateStockF(dbType, params);
        // Fonctions pour les familles et settings
        case 'get_families_by_tenant':
          return this.getFamiliesByTenant(dbType, params.p_tenant);
        case 'insert_family_to_tenant':
          return this.insertFamilyToTenant(dbType, params);
        case 'update_family_in_tenant':
          return this.updateFamilyInTenant(dbType, params);
        case 'delete_family_from_tenant':
          return this.deleteFamilyFromTenant(dbType, params);
        case 'get_company_info':
          return this.getCompanyInfo(dbType, params.p_tenant);
        case 'update_company_info':
          return this.updateCompanyInfo(dbType, params);
        case 'get_units_by_tenant':
          return this.getUnitsByTenant(dbType, params.p_tenant);
        // Fonctions pour l'activité
        case 'update_tenant_activite':
          return this.updateTenantActivite(dbType, params);
        case 'delete_activity_from_tenant':
          return this.deleteActivityFromTenant(dbType, params);
        // Fonction exec_sql générique
        case 'exec_sql':
          return this.executeDirectSQL(dbType, params.sql);
        // Fonction d'authentification
        case 'authenticate_user':
          return this.authenticateUser(dbType, params.p_username, params.p_password);
        // Fonctions pour l'administration
        case 'get_all_users':
          return this.getAllUsers(dbType);
        case 'get_all_business_units':
          return this.getAllBusinessUnits(dbType);
        case 'list_available_tenants':
          return this.listAvailableTenants(dbType);
        case 'create_user':
          return this.createUser(dbType, params);
        case 'update_user':
          return this.updateUser(dbType, params);
        case 'delete_user':
          return this.deleteUser(dbType, params);
        // Fonctions pour les achats (BL et factures d'achat)
        case 'get_purchase_bl_list':
        case 'get_purchase_bl_list_by_tenant':
          return this.getPurchaseBLList(dbType, params.p_tenant);
        case 'get_purchase_bl_with_details':
        case 'get_purchase_bl_by_id':
          return this.getPurchaseBLById(dbType, params.p_tenant, params.p_nbl_achat);
        case 'insert_purchase_bl_with_supplier_number':
        case 'insert_purchase_bl':
          return this.insertPurchaseBL(dbType, params);
        case 'insert_detail_purchase_bl':
          return this.insertDetailPurchaseBL(dbType, params);
        case 'get_purchase_invoices_list':
        case 'get_purchase_invoices_by_tenant':
          return this.getPurchaseInvoicesList(dbType, params.p_tenant);
        case 'get_purchase_invoice_with_details':
        case 'get_purchase_invoice_by_id':
          return this.getPurchaseInvoiceById(dbType, params.p_tenant, params.p_nfact_achat);
        case 'insert_purchase_invoice':
          return this.insertPurchaseInvoice(dbType, params);
        case 'insert_detail_purchase_invoice':
          return this.insertDetailPurchaseInvoice(dbType, params);
        default:
          throw new Error(`RPC function ${functionName} not implemented for ${dbType}`);
      }
    } catch (error) {
      console.error(`RPC to SQL conversion failed for ${functionName}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async authenticateUser(dbType: 'mysql' | 'postgresql', username: string, password: string): Promise<any> {
    try {
      console.log(`🔐 Authenticating user ${username} on ${dbType}`);
      
      let sql;
      if (dbType === 'mysql') {
        // Pour MySQL, chercher dans la table users de stock_management_auth
        // ET hasher le mot de passe avec SHA2 pour la comparaison
        sql = `
          SELECT id, username, email, full_name, role, business_units, password_hash,
                 SHA2(?, 256) as input_hash
          FROM stock_management_auth.users 
          WHERE (username = ? OR email = ?) AND active = 1
        `;
      } else {
        // Pour PostgreSQL, chercher dans public.users
        sql = `
          SELECT id, username, email, full_name, role, business_units, password_hash,
                 encode(digest($1, 'sha256'), 'hex') as input_hash
          FROM public.users 
          WHERE (username = $2 OR email = $3) AND is_active = true
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [password, username, username])
        : await this.executePostgreSQLQuery(sql, [password, username, username]);
      
      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: false,
          error: 'Utilisateur non trouvé'
        };
      }
      
      const user = result.data[0];
      
      // Vérifier le mot de passe hashé
      if (user.password_hash !== user.input_hash) {
        console.log(`❌ Password mismatch for user ${username}`);
        console.log(`   Expected: ${user.password_hash}`);
        console.log(`   Got: ${user.input_hash}`);
        return {
          success: false,
          error: 'Mot de passe incorrect'
        };
      }
      
      console.log(`✅ Password verified for user ${username}`);
      
      // Parser business_units si c'est une chaîne JSON
      let businessUnits = user.business_units;
      if (typeof businessUnits === 'string') {
        try {
          businessUnits = JSON.parse(businessUnits);
        } catch (e) {
          businessUnits = [];
        }
      }
      
      // Retourner les infos utilisateur (sans le password_hash et input_hash)
      const { password_hash, input_hash, ...userInfo } = user;
      
      return {
        success: true,
        data: {
          success: true,
          user: {
            ...userInfo,
            business_units: businessUnits
          }
        }
      };
      
    } catch (error) {
      console.error(`❌ Authentication error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur d\'authentification'
      };
    }
  }

  private async getAllUsers(dbType: 'mysql' | 'postgresql'): Promise<any> {
    try {
      console.log(`👥 Getting all users from ${dbType}`);
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          SELECT id, username, email, full_name, role, business_units, 
                 created_at, last_login, active
          FROM stock_management_auth.users 
          ORDER BY created_at DESC
        `;
      } else {
        sql = `
          SELECT id, username, email, full_name, role, business_units, 
                 created_at, last_login, is_active as active
          FROM public.users 
          ORDER BY created_at DESC
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [])
        : await this.executePostgreSQLQuery(sql, []);
      
      if (!result.success) {
        return result;
      }
      
      // Parser business_units pour chaque utilisateur
      const users = result.data.map((user: any) => {
        let businessUnits = user.business_units;
        if (typeof businessUnits === 'string') {
          try {
            businessUnits = JSON.parse(businessUnits);
          } catch (e) {
            businessUnits = [];
          }
        }
        return {
          ...user,
          business_units: businessUnits
        };
      });
      
      return {
        success: true,
        data: users
      };
      
    } catch (error) {
      console.error(`❌ Error getting all users:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des utilisateurs'
      };
    }
  }

  private async getAllBusinessUnits(dbType: 'mysql' | 'postgresql'): Promise<any> {
    try {
      console.log(`🏢 Getting all business units from ${dbType}`);
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          SELECT DISTINCT 
            SUBSTRING_INDEX(SCHEMA_NAME, '_', -1) as business_unit,
            CAST(SUBSTRING_INDEX(SCHEMA_NAME, '_', 1) AS UNSIGNED) as year,
            SCHEMA_NAME as schema_name
          FROM information_schema.SCHEMATA 
          WHERE SCHEMA_NAME REGEXP '^[0-9]{4}_bu[0-9]{2}$'
          ORDER BY year DESC, business_unit
        `;
      } else {
        sql = `
          SELECT DISTINCT 
            split_part(schema_name, '_', 2) as business_unit,
            CAST(split_part(schema_name, '_', 1) AS INTEGER) as year,
            schema_name
          FROM information_schema.schemata 
          WHERE schema_name ~ '^[0-9]{4}_bu[0-9]{2}$'
          ORDER BY year DESC, business_unit
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [])
        : await this.executePostgreSQLQuery(sql, []);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error getting business units:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des business units'
      };
    }
  }

  private async listAvailableTenants(dbType: 'mysql' | 'postgresql'): Promise<any> {
    try {
      console.log(`📋 Listing available tenants from ${dbType}`);
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          SELECT 
            SUBSTRING_INDEX(SCHEMA_NAME, '_', -1) as business_unit,
            CAST(SUBSTRING_INDEX(SCHEMA_NAME, '_', 1) AS UNSIGNED) as year,
            SCHEMA_NAME as schema
          FROM information_schema.SCHEMATA 
          WHERE SCHEMA_NAME REGEXP '^[0-9]{4}_bu[0-9]{2}$'
          ORDER BY year DESC, business_unit
        `;
      } else {
        sql = `
          SELECT 
            split_part(schema_name, '_', 2) as business_unit,
            CAST(split_part(schema_name, '_', 1) AS INTEGER) as year,
            schema_name as schema
          FROM information_schema.schemata 
          WHERE schema_name ~ '^[0-9]{4}_bu[0-9]{2}$'
          ORDER BY year DESC, business_unit
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [])
        : await this.executePostgreSQLQuery(sql, []);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error listing tenants:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la liste des tenants'
      };
    }
  }

  private async createUser(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    try {
      console.log(`👤 Creating user in ${dbType}:`, params.p_username);
      
      const {
        p_username,
        p_email,
        p_password,
        p_full_name,
        p_role,
        p_business_units
      } = params;

      // Hasher le mot de passe avec SHA256
      let sql;
      let queryParams;
      
      if (dbType === 'mysql') {
        sql = `
          INSERT INTO stock_management_auth.users 
            (username, email, password_hash, full_name, role, business_units, active, created_at)
          VALUES 
            (?, ?, SHA2(?, 256), ?, ?, ?, 1, NOW())
        `;
        queryParams = [
          p_username,
          p_email,
          p_password,
          p_full_name || '',
          p_role || 'user',
          JSON.stringify(p_business_units || [])
        ];
      } else {
        sql = `
          INSERT INTO public.users 
            (username, email, password_hash, full_name, role, business_units, is_active, created_at)
          VALUES 
            ($1, $2, encode(digest($3, 'sha256'), 'hex'), $4, $5, $6, true, NOW())
          RETURNING id, username, email, full_name, role, business_units
        `;
        queryParams = [
          p_username,
          p_email,
          p_password,
          p_full_name || '',
          p_role || 'user',
          JSON.stringify(p_business_units || [])
        ];
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, queryParams)
        : await this.executePostgreSQLQuery(sql, queryParams);
      
      if (!result.success) {
        return result;
      }

      console.log(`✅ User created: ${p_username}`);
      
      return {
        success: true,
        data: {
          message: 'Utilisateur créé avec succès',
          username: p_username
        }
      };
      
    } catch (error) {
      console.error(`❌ Error creating user:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'utilisateur'
      };
    }
  }

  private async updateUser(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    try {
      console.log(`🔄 Updating user in ${dbType}:`, params.p_user_id);
      
      const {
        p_user_id,
        p_username,
        p_email,
        p_full_name,
        p_role,
        p_business_units,
        p_active
      } = params;

      let sql;
      let queryParams;
      
      if (dbType === 'mysql') {
        sql = `
          UPDATE stock_management_auth.users 
          SET 
            username = ?,
            email = ?,
            full_name = ?,
            role = ?,
            business_units = ?,
            active = ?
          WHERE id = ?
        `;
        queryParams = [
          p_username,
          p_email,
          p_full_name,
          p_role,
          JSON.stringify(p_business_units || []),
          p_active ? 1 : 0,
          p_user_id
        ];
      } else {
        sql = `
          UPDATE public.users 
          SET 
            username = $1,
            email = $2,
            full_name = $3,
            role = $4,
            business_units = $5,
            is_active = $6
          WHERE id = $7
          RETURNING id, username, email, full_name, role, business_units
        `;
        queryParams = [
          p_username,
          p_email,
          p_full_name,
          p_role,
          JSON.stringify(p_business_units || []),
          p_active,
          p_user_id
        ];
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, queryParams)
        : await this.executePostgreSQLQuery(sql, queryParams);
      
      if (!result.success) {
        return result;
      }

      console.log(`✅ User updated: ${p_user_id}`);
      
      return {
        success: true,
        data: {
          message: 'Utilisateur mis à jour avec succès'
        }
      };
      
    } catch (error) {
      console.error(`❌ Error updating user:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'utilisateur'
      };
    }
  }

  private async deleteUser(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    try {
      console.log(`🗑️ Deleting user in ${dbType}:`, params.p_user_id);
      
      const { p_user_id } = params;

      let sql;
      
      if (dbType === 'mysql') {
        sql = `DELETE FROM stock_management_auth.users WHERE id = ?`;
      } else {
        sql = `DELETE FROM public.users WHERE id = $1`;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [p_user_id])
        : await this.executePostgreSQLQuery(sql, [p_user_id]);
      
      if (!result.success) {
        return result;
      }

      console.log(`✅ User deleted: ${p_user_id}`);
      
      return {
        success: true,
        data: {
          message: 'Utilisateur supprimé avec succès'
        }
      };
      
    } catch (error) {
      console.error(`❌ Error deleting user:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'utilisateur'
      };
    }
  }

  // ==================== FONCTIONS POUR LES ACHATS ====================
  
  private async getPurchaseBLList(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    try {
      console.log(`📋 Getting purchase BL list for tenant: ${tenant}`);
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          SELECT 
            b.Nbl as nbl_achat,
            b.Nfournisseur as nfournisseur,
            b.numero_bl_fournisseur,
            f.Nom_fournisseur as supplier_name,
            b.Date_bl as date_bl,
            b.Montant_ht as montant_ht,
            b.Tva as tva,
            b.Montant_ttc as montant_ttc,
            b.created_at
          FROM ${tenant}.bachat b
          LEFT JOIN ${tenant}.fournisseur f ON b.Nfournisseur = f.Nfournisseur
          ORDER BY b.Nbl DESC
        `;
      } else {
        sql = `
          SELECT 
            b.nbl as nbl_achat,
            b.nfournisseur,
            b.numero_bl_fournisseur,
            f.nom_fournisseur as supplier_name,
            b.date_bl,
            b.montant_ht,
            b.tva,
            b.montant_ttc,
            b.created_at
          FROM "${tenant}".bachat b
          LEFT JOIN "${tenant}".fournisseur f ON b.nfournisseur = f.nfournisseur
          ORDER BY b.nbl DESC
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [])
        : await this.executePostgreSQLQuery(sql, []);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: result.data || []
      };
      
    } catch (error) {
      console.error(`❌ Error getting purchase BL list:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des BL d\'achat'
      };
    }
  }

  private async getPurchaseBLById(dbType: 'mysql' | 'postgresql', tenant: string, nblAchat: number): Promise<any> {
    try {
      console.log(`📋 Getting purchase BL ${nblAchat} for tenant: ${tenant}`);
      
      let headerSql, detailsSql;
      
      if (dbType === 'mysql') {
        headerSql = `
          SELECT 
            b.Nbl as nbl_achat,
            b.Nfournisseur as nfournisseur,
            b.numero_bl_fournisseur,
            f.Nom_fournisseur as supplier_name,
            f.Adresse_fourni as supplier_address,
            b.Date_bl as date_bl,
            b.Montant_ht as montant_ht,
            b.Tva as tva,
            b.Montant_ttc as montant_ttc,
            b.created_at
          FROM ${tenant}.bachat b
          LEFT JOIN ${tenant}.fournisseur f ON b.Nfournisseur = f.Nfournisseur
          WHERE b.Nbl = ?
        `;
        
        detailsSql = `
          SELECT 
            d.Narticle as narticle,
            a.designation,
            d.Qte as qte,
            d.prix,
            d.tva,
            d.total_ligne
          FROM ${tenant}.bachat_detail d
          LEFT JOIN ${tenant}.article a ON d.Narticle = a.Narticle
          WHERE d.Nbl = ?
        `;
      } else {
        headerSql = `
          SELECT 
            b.nbl as nbl_achat,
            b.nfournisseur,
            b.numero_bl_fournisseur,
            f.nom_fournisseur as supplier_name,
            f.adresse_fourni as supplier_address,
            b.date_bl,
            b.montant_ht,
            b.tva,
            b.montant_ttc,
            b.created_at
          FROM "${tenant}".bachat b
          LEFT JOIN "${tenant}".fournisseur f ON b.nfournisseur = f.nfournisseur
          WHERE b.nbl = $1
        `;
        
        detailsSql = `
          SELECT 
            d.narticle,
            a.designation,
            d.qte,
            d.prix,
            d.tva,
            d.total_ligne
          FROM "${tenant}".bachat_detail d
          LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle
          WHERE d.nbl = $1
        `;
      }
      
      const headerResult = dbType === 'mysql' 
        ? await this.executeMySQLQuery(headerSql, [nblAchat])
        : await this.executePostgreSQLQuery(headerSql, [nblAchat]);
      
      if (!headerResult.success || !headerResult.data || headerResult.data.length === 0) {
        return {
          success: false,
          error: 'BL d\'achat non trouvé'
        };
      }

      const detailsResult = dbType === 'mysql' 
        ? await this.executeMySQLQuery(detailsSql, [nblAchat])
        : await this.executePostgreSQLQuery(detailsSql, [nblAchat]);
      
      const bl = headerResult.data[0];
      bl.details = detailsResult.success ? detailsResult.data : [];

      return {
        success: true,
        data: bl
      };
      
    } catch (error) {
      console.error(`❌ Error getting purchase BL:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération du BL d\'achat'
      };
    }
  }

  private async insertPurchaseBL(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    try {
      console.log(`📝 Inserting purchase BL:`, params);
      
      const { p_tenant, p_nbl_achat, p_nfournisseur, p_numero_bl_fournisseur, p_date_bl, p_montant_ht, p_tva, p_montant_ttc } = params;
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          INSERT INTO ${p_tenant}.bachat 
          (Nbl, Nfournisseur, numero_bl_fournisseur, Date_bl, Montant_ht, Tva, Montant_ttc, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
      } else {
        sql = `
          INSERT INTO "${p_tenant}".bachat 
          (nbl, nfournisseur, numero_bl_fournisseur, date_bl, montant_ht, tva, montant_ttc, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [p_nbl_achat, p_nfournisseur, p_numero_bl_fournisseur, p_date_bl, p_montant_ht, p_tva, p_montant_ttc])
        : await this.executePostgreSQLQuery(sql, [p_nbl_achat, p_nfournisseur, p_numero_bl_fournisseur, p_date_bl, p_montant_ht, p_tva, p_montant_ttc]);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error inserting purchase BL:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création du BL d\'achat'
      };
    }
  }

  private async insertDetailPurchaseBL(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    try {
      const { p_tenant, p_nbl_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne } = params;
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          INSERT INTO ${p_tenant}.bachat_detail 
          (Nbl, Narticle, Qte, prix, tva, total_ligne)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
      } else {
        sql = `
          INSERT INTO "${p_tenant}".bachat_detail 
          (nbl, narticle, qte, prix, tva, total_ligne)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [p_nbl_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne])
        : await this.executePostgreSQLQuery(sql, [p_nbl_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne]);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error inserting purchase BL detail:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du détail'
      };
    }
  }

  private async getPurchaseInvoicesList(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    try {
      console.log(`📋 Getting purchase invoices list for tenant: ${tenant}`);
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          SELECT 
            f.Nfact as nfact_achat,
            f.Nfournisseur as nfournisseur,
            f.numero_facture_fournisseur,
            fo.Nom_fournisseur as supplier_name,
            f.Date_fact as date_fact,
            f.Montant_ht as montant_ht,
            f.Tva as tva,
            f.Total_ttc as total_ttc,
            f.created_at
          FROM ${tenant}.fachat f
          LEFT JOIN ${tenant}.fournisseur fo ON f.Nfournisseur = fo.Nfournisseur
          ORDER BY f.Nfact DESC
        `;
      } else {
        sql = `
          SELECT 
            f.nfact as nfact_achat,
            f.nfournisseur,
            f.numero_facture_fournisseur,
            fo.nom_fournisseur as supplier_name,
            f.date_fact,
            f.montant_ht,
            f.tva,
            f.total_ttc,
            f.created_at
          FROM "${tenant}".fachat f
          LEFT JOIN "${tenant}".fournisseur fo ON f.nfournisseur = fo.nfournisseur
          ORDER BY f.nfact DESC
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [])
        : await this.executePostgreSQLQuery(sql, []);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: result.data || []
      };
      
    } catch (error) {
      console.error(`❌ Error getting purchase invoices list:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des factures d\'achat'
      };
    }
  }

  private async getPurchaseInvoiceById(dbType: 'mysql' | 'postgresql', tenant: string, nfactAchat: number): Promise<any> {
    try {
      console.log(`📋 Getting purchase invoice ${nfactAchat} for tenant: ${tenant}`);
      
      let headerSql, detailsSql;
      
      if (dbType === 'mysql') {
        headerSql = `
          SELECT 
            f.Nfact as nfact_achat,
            f.Nfournisseur as nfournisseur,
            f.numero_facture_fournisseur,
            fo.Nom_fournisseur as supplier_name,
            fo.Adresse_fourni as supplier_address,
            f.Date_fact as date_fact,
            f.Montant_ht as montant_ht,
            f.Tva as tva,
            f.Total_ttc as total_ttc,
            f.created_at
          FROM ${tenant}.fachat f
          LEFT JOIN ${tenant}.fournisseur fo ON f.Nfournisseur = fo.Nfournisseur
          WHERE f.Nfact = ?
        `;
        
        detailsSql = `
          SELECT 
            d.Narticle as narticle,
            a.designation,
            d.Qte as qte,
            d.prix,
            d.tva,
            d.total_ligne
          FROM ${tenant}.fachat_detail d
          LEFT JOIN ${tenant}.article a ON d.Narticle = a.Narticle
          WHERE d.Nfact = ?
        `;
      } else {
        headerSql = `
          SELECT 
            f.nfact as nfact_achat,
            f.nfournisseur,
            f.numero_facture_fournisseur,
            fo.nom_fournisseur as supplier_name,
            fo.adresse_fourni as supplier_address,
            f.date_fact,
            f.montant_ht,
            f.tva,
            f.total_ttc,
            f.created_at
          FROM "${tenant}".fachat f
          LEFT JOIN "${tenant}".fournisseur fo ON f.nfournisseur = fo.nfournisseur
          WHERE f.nfact = $1
        `;
        
        detailsSql = `
          SELECT 
            d.narticle,
            a.designation,
            d.qte,
            d.prix,
            d.tva,
            d.total_ligne
          FROM "${tenant}".fachat_detail d
          LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle
          WHERE d.nfact = $1
        `;
      }
      
      const headerResult = dbType === 'mysql' 
        ? await this.executeMySQLQuery(headerSql, [nfactAchat])
        : await this.executePostgreSQLQuery(headerSql, [nfactAchat]);
      
      if (!headerResult.success || !headerResult.data || headerResult.data.length === 0) {
        return {
          success: false,
          error: 'Facture d\'achat non trouvée'
        };
      }

      const detailsResult = dbType === 'mysql' 
        ? await this.executeMySQLQuery(detailsSql, [nfactAchat])
        : await this.executePostgreSQLQuery(detailsSql, [nfactAchat]);
      
      const invoice = headerResult.data[0];
      invoice.details = detailsResult.success ? detailsResult.data : [];

      return {
        success: true,
        data: invoice
      };
      
    } catch (error) {
      console.error(`❌ Error getting purchase invoice:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération de la facture d\'achat'
      };
    }
  }

  private async insertPurchaseInvoice(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    try {
      console.log(`📝 Inserting purchase invoice:`, params);
      
      const { p_tenant, p_nfact_achat, p_nfournisseur, p_numero_facture_fournisseur, p_date_fact, p_montant_ht, p_tva, p_total_ttc } = params;
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          INSERT INTO ${p_tenant}.fachat 
          (Nfact, Nfournisseur, numero_facture_fournisseur, Date_fact, Montant_ht, Tva, Total_ttc, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
      } else {
        sql = `
          INSERT INTO "${p_tenant}".fachat 
          (nfact, nfournisseur, numero_facture_fournisseur, date_fact, montant_ht, tva, total_ttc, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [p_nfact_achat, p_nfournisseur, p_numero_facture_fournisseur, p_date_fact, p_montant_ht, p_tva, p_total_ttc])
        : await this.executePostgreSQLQuery(sql, [p_nfact_achat, p_nfournisseur, p_numero_facture_fournisseur, p_date_fact, p_montant_ht, p_tva, p_total_ttc]);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error inserting purchase invoice:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création de la facture d\'achat'
      };
    }
  }

  private async insertDetailPurchaseInvoice(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    try {
      const { p_tenant, p_nfact_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne } = params;
      
      let sql;
      if (dbType === 'mysql') {
        sql = `
          INSERT INTO ${p_tenant}.fachat_detail 
          (Nfact, Narticle, Qte, prix, tva, total_ligne)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
      } else {
        sql = `
          INSERT INTO "${p_tenant}".fachat_detail 
          (nfact, narticle, qte, prix, tva, total_ligne)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
      }
      
      const result = dbType === 'mysql' 
        ? await this.executeMySQLQuery(sql, [p_nfact_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne])
        : await this.executePostgreSQLQuery(sql, [p_nfact_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne]);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error inserting purchase invoice detail:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du détail'
      };
    }
  }

  private async getArticlesByTenant(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      // CORRECTION: MySQL utilise Narticle (majuscule), Nfournisseur, etc.
      sql = `
        SELECT 
          Narticle as narticle,
          famille,
          designation,
          Nfournisseur as nfournisseur,
          prix_unitaire,
          marge,
          tva,
          prix_vente,
          seuil,
          stock_f,
          stock_bl
        FROM \`${tenant}\`.article 
        ORDER BY Narticle
      `;
    } else {
      // PostgreSQL: utiliser des guillemets pour les schémas
      sql = `SELECT * FROM "${tenant}".article ORDER BY narticle`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async insertArticleToTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const {
      p_tenant,
      p_narticle,
      p_famille,
      p_designation,
      p_nfournisseur,
      p_prix_unitaire,
      p_marge,
      p_tva,
      p_prix_vente,
      p_seuil,
      p_stock_f,
      p_stock_bl
    } = params;

    let sql;
    if (dbType === 'mysql') {
      sql = `
        INSERT INTO \`${p_tenant}\`.article 
        (narticle, famille, designation, nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
    } else {
      // PostgreSQL: utiliser des guillemets et $1, $2, etc.
      sql = `
        INSERT INTO "${p_tenant}".article 
        (narticle, famille, designation, nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
    }
    
    const values = [
      p_narticle, p_famille, p_designation, p_nfournisseur,
      p_prix_unitaire, p_marge, p_tva, p_prix_vente,
      p_seuil, p_stock_f, p_stock_bl
    ];

    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async getArticleByIdFromTenant(dbType: 'mysql' | 'postgresql', tenant: string, narticle: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `SELECT * FROM \`${tenant}\`.article WHERE narticle = ?`;
    } else {
      sql = `SELECT * FROM "${tenant}".article WHERE narticle = $1`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, [narticle]) : this.executePostgreSQLQuery(sql, [narticle]);
  }

  private async updateArticleInTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const {
      p_tenant,
      p_narticle,
      p_famille,
      p_designation,
      p_nfournisseur,
      p_prix_unitaire,
      p_marge,
      p_tva,
      p_prix_vente,
      p_seuil,
      p_stock_f,
      p_stock_bl
    } = params;

    let sql;
    if (dbType === 'mysql') {
      sql = `
        UPDATE \`${p_tenant}\`.article 
        SET famille = ?, designation = ?, nfournisseur = ?, prix_unitaire = ?, 
            marge = ?, tva = ?, prix_vente = ?, seuil = ?, stock_f = ?, stock_bl = ?
        WHERE narticle = ?
      `;
    } else {
      sql = `
        UPDATE "${p_tenant}".article 
        SET famille = $1, designation = $2, nfournisseur = $3, prix_unitaire = $4, 
            marge = $5, tva = $6, prix_vente = $7, seuil = $8, stock_f = $9, stock_bl = $10
        WHERE narticle = $11
      `;
    }
    
    const values = [
      p_famille, p_designation, p_nfournisseur, p_prix_unitaire,
      p_marge, p_tva, p_prix_vente, p_seuil, p_stock_f, p_stock_bl,
      p_narticle
    ];

    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async deleteArticleFromTenant(dbType: 'mysql' | 'postgresql', tenant: string, narticle: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `DELETE FROM \`${tenant}\`.article WHERE narticle = ?`;
    } else {
      sql = `DELETE FROM "${tenant}".article WHERE narticle = $1`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, [narticle]) : this.executePostgreSQLQuery(sql, [narticle]);
  }

  // Méthodes pour les fournisseurs
  private async getSuppliersByTenant(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      // Mapper les colonnes MySQL vers les noms attendus par le frontend
      sql = `
        SELECT 
          Nfournisseur as nfournisseur,
          Nom_fournisseur as nom_fournisseur,
          Resp_fournisseur as resp_fournisseur,
          Adresse_fourni as adresse_fourni,
          Tel as tel,
          tel1,
          tel2,
          CAF as caf,
          CABL as cabl,
          EMAIL as email,
          commentaire
        FROM \`${tenant}\`.fournisseur 
        ORDER BY Nfournisseur
      `;
    } else {
      sql = `SELECT * FROM "${tenant}".fournisseur ORDER BY nfournisseur`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async insertSupplierToTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const {
      p_tenant,
      p_nfournisseur,
      p_nom_fournisseur,
      p_resp_fournisseur,
      p_adresse_fourni,
      p_tel,
      p_tel1,
      p_tel2,
      p_caf,
      p_cabl,
      p_email,
      p_commentaire
    } = params;

    let sql;
    if (dbType === 'mysql') {
      sql = `
        INSERT INTO \`${p_tenant}\`.fournisseur 
        (nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni, tel, tel1, tel2, caf, cabl, email, commentaire)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
    } else {
      sql = `
        INSERT INTO "${p_tenant}".fournisseur 
        (nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni, tel, tel1, tel2, caf, cabl, email, commentaire)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
    }
    
    const values = [
      p_nfournisseur, p_nom_fournisseur, p_resp_fournisseur, p_adresse_fourni,
      p_tel, p_tel1, p_tel2, p_caf, p_cabl, p_email, p_commentaire
    ];

    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async updateSupplierInTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const {
      p_tenant,
      p_nfournisseur,
      p_nom_fournisseur,
      p_resp_fournisseur,
      p_adresse_fourni,
      p_tel,
      p_email,
      p_commentaire
    } = params;

    let sql;
    if (dbType === 'mysql') {
      sql = `
        UPDATE \`${p_tenant}\`.fournisseur 
        SET nom_fournisseur = ?, resp_fournisseur = ?, adresse_fourni = ?, 
            tel = ?, email = ?, commentaire = ?
        WHERE nfournisseur = ?
      `;
    } else {
      sql = `
        UPDATE "${p_tenant}".fournisseur 
        SET nom_fournisseur = $1, resp_fournisseur = $2, adresse_fourni = $3, 
            tel = $4, email = $5, commentaire = $6
        WHERE nfournisseur = $7
      `;
    }
    
    const values = [
      p_nom_fournisseur, p_resp_fournisseur, p_adresse_fourni,
      p_tel, p_email, p_commentaire, p_nfournisseur
    ];

    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async deleteSupplierFromTenant(dbType: 'mysql' | 'postgresql', tenant: string, nfournisseur: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `DELETE FROM \`${tenant}\`.fournisseur WHERE nfournisseur = ?`;
    } else {
      sql = `DELETE FROM "${tenant}".fournisseur WHERE nfournisseur = $1`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, [nfournisseur]) : this.executePostgreSQLQuery(sql, [nfournisseur]);
  }

  // Méthodes pour les clients
  private async getClientsByTenant(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      // Mapper les colonnes MySQL vers les noms attendus par le frontend
      sql = `
        SELECT 
          Nclient as nclient,
          Raison_sociale as raison_sociale,
          adresse,
          contact_person,
          C_affaire_fact as c_affaire_fact,
          C_affaire_bl as c_affaire_bl,
          NRC as nrc,
          Date_RC as date_rc,
          Lieu_RC as lieu_rc,
          I_Fiscal as i_fiscal,
          N_article as n_article,
          Tel as tel,
          email,
          Commentaire as commentaire
        FROM \`${tenant}\`.client 
        ORDER BY Nclient
      `;
    } else {
      sql = `SELECT * FROM "${tenant}".client ORDER BY nclient`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async insertClientToTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const {
      p_tenant,
      p_nclient,
      p_nom_client,
      p_resp_client,
      p_adresse_client,
      p_tel,
      p_tel1,
      p_tel2,
      p_caf,
      p_cabl,
      p_email,
      p_commentaire
    } = params;

    let sql;
    if (dbType === 'mysql') {
      sql = `
        INSERT INTO \`${p_tenant}\`.client 
        (nclient, nom_client, resp_client, adresse_client, tel, tel1, tel2, caf, cabl, email, commentaire)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
    } else {
      sql = `
        INSERT INTO "${p_tenant}".client 
        (nclient, nom_client, resp_client, adresse_client, tel, tel1, tel2, caf, cabl, email, commentaire)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
    }
    
    const values = [
      p_nclient, p_nom_client, p_resp_client, p_adresse_client,
      p_tel, p_tel1, p_tel2, p_caf, p_cabl, p_email, p_commentaire
    ];

    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async updateClientInTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const {
      p_tenant,
      p_nclient,
      p_nom_client,
      p_resp_client,
      p_adresse_client,
      p_tel,
      p_email,
      p_commentaire
    } = params;

    let sql;
    if (dbType === 'mysql') {
      sql = `
        UPDATE \`${p_tenant}\`.client 
        SET nom_client = ?, resp_client = ?, adresse_client = ?, 
            tel = ?, email = ?, commentaire = ?
        WHERE nclient = ?
      `;
    } else {
      sql = `
        UPDATE "${p_tenant}".client 
        SET nom_client = $1, resp_client = $2, adresse_client = $3, 
            tel = $4, email = $5, commentaire = $6
        WHERE nclient = $7
      `;
    }
    
    const values = [
      p_nom_client, p_resp_client, p_adresse_client,
      p_tel, p_email, p_commentaire, p_nclient
    ];

    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async deleteClientFromTenant(dbType: 'mysql' | 'postgresql', tenant: string, nclient: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `DELETE FROM \`${tenant}\`.client WHERE nclient = ?`;
    } else {
      sql = `DELETE FROM "${tenant}".client WHERE nclient = $1`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, [nclient]) : this.executePostgreSQLQuery(sql, [nclient]);
  }

  // Méthodes pour les ventes (BL, factures, proformas)
  private async getBLList(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `
        SELECT 
          bl.*,
          bl.nfact as nbl,
          bl.nfact as id,
          c.raison_sociale as client_name
        FROM \`${tenant}\`.bl bl
        LEFT JOIN \`${tenant}\`.client c ON bl.nclient = c.nclient
        ORDER BY bl.nfact DESC
      `;
    } else {
      sql = `
        SELECT 
          bl.*,
          bl.nfact as nbl,
          bl.nfact as id,
          c.raison_sociale as client_name
        FROM "${tenant}".bl bl
        LEFT JOIN "${tenant}".client c ON bl.nclient = c.nclient
        ORDER BY bl.nfact DESC
      `;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async getBLById(dbType: 'mysql' | 'postgresql', tenant: string, nfact: string): Promise<any> {
    try {
      // Récupérer d'abord le BL principal
      let blSql;
      if (dbType === 'mysql') {
        blSql = `
          SELECT bl.*, c.raison_sociale as client_name, c.adresse as client_address, c.tel as client_phone,
                 CAST(bl.montant_ht AS DECIMAL(15,2)) as montant_ht_numeric,
                 CAST(bl.tva AS DECIMAL(15,2)) as tva_numeric,
                 CAST(bl.timbre AS DECIMAL(15,2)) as timbre_numeric,
                 CAST(bl.autre_taxe AS DECIMAL(15,2)) as autre_taxe_numeric,
                 CAST(bl.montant_ht AS DECIMAL(15,2)) + CAST(bl.tva AS DECIMAL(15,2)) + CAST(bl.timbre AS DECIMAL(15,2)) + CAST(bl.autre_taxe AS DECIMAL(15,2)) as montant_ttc_calculated
          FROM \`${tenant}\`.bl bl
          LEFT JOIN \`${tenant}\`.client c ON bl.nclient = c.nclient
          WHERE bl.nfact = ?
        `;
      } else {
        blSql = `
          SELECT bl.*, c.raison_sociale as client_name, c.adresse as client_address, c.tel as client_phone,
                 CAST(bl.montant_ht AS NUMERIC(15,2)) as montant_ht_numeric,
                 CAST(bl.tva AS NUMERIC(15,2)) as tva_numeric,
                 CAST(bl.timbre AS NUMERIC(15,2)) as timbre_numeric,
                 CAST(bl.autre_taxe AS NUMERIC(15,2)) as autre_taxe_numeric,
                 CAST(bl.montant_ht AS NUMERIC(15,2)) + CAST(bl.tva AS NUMERIC(15,2)) + CAST(bl.timbre AS NUMERIC(15,2)) + CAST(bl.autre_taxe AS NUMERIC(15,2)) as montant_ttc_calculated
          FROM "${tenant}".bl bl
          LEFT JOIN "${tenant}".client c ON bl.nclient = c.nclient
          WHERE bl.nfact = $1
        `;
      }
      
      const blResult = dbType === 'mysql' ? 
        await this.executeMySQLQuery(blSql, [nfact]) : 
        await this.executePostgreSQLQuery(blSql, [nfact]);
      
      if (!blResult.success || !blResult.data || blResult.data.length === 0) {
        return { success: false, error: 'BL not found' };
      }
      
      const blData = blResult.data[0];
      
      // Récupérer les détails du BL avec conversion numérique
      let detailsSql;
      if (dbType === 'mysql') {
        detailsSql = `
          SELECT d.*, a.designation,
                 CAST(d.qte AS DECIMAL(10,2)) as qte_numeric,
                 CAST(d.prix AS DECIMAL(15,2)) as prix_numeric,
                 CAST(d.tva AS DECIMAL(5,2)) as tva_numeric,
                 CAST(d.total_ligne AS DECIMAL(15,2)) as total_ligne_numeric
          FROM \`${tenant}\`.detail_bl d
          LEFT JOIN \`${tenant}\`.article a ON d.narticle = a.narticle
          WHERE d.nfact = ?
          ORDER BY d.narticle
        `;
      } else {
        detailsSql = `
          SELECT d.*, a.designation,
                 CAST(d.qte AS NUMERIC(10,2)) as qte_numeric,
                 CAST(d.prix AS NUMERIC(15,2)) as prix_numeric,
                 CAST(d.tva AS NUMERIC(5,2)) as tva_numeric,
                 CAST(d.total_ligne AS NUMERIC(15,2)) as total_ligne_numeric
          FROM "${tenant}".detail_bl d
          LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle
          WHERE d.nfact = $1
          ORDER BY d.narticle
        `;
      }
      
      const detailsResult = dbType === 'mysql' ? 
        await this.executeMySQLQuery(detailsSql, [nfact]) : 
        await this.executePostgreSQLQuery(detailsSql, [nfact]);
      
      // Formater les détails avec les valeurs numériques converties
      const details = detailsResult.success && detailsResult.data ? 
        detailsResult.data.map((detail: any) => ({
          narticle: detail.narticle || detail.Narticle || '',
          designation: detail.designation || `Article ${detail.narticle}`,
          qte: parseFloat(detail.qte_numeric?.toString() || detail.qte?.toString() || '0') || 0,
          prix: parseFloat(detail.prix_numeric?.toString() || detail.prix?.toString() || '0') || 0,
          tva: parseFloat(detail.tva_numeric?.toString() || detail.tva?.toString() || '0') || 0,
          total_ligne: parseFloat(detail.total_ligne_numeric?.toString() || detail.total_ligne?.toString() || '0') || 0
        })) : [];
      
      // Utiliser les valeurs numériques converties depuis la base de données
      const montant_ht = parseFloat(blData.montant_ht_numeric?.toString() || blData.montant_ht?.toString() || '0') || 0;
      const tva = parseFloat(blData.tva_numeric?.toString() || blData.tva?.toString() || '0') || 0;
      const timbre = parseFloat(blData.timbre_numeric?.toString() || blData.timbre?.toString() || '0') || 0;
      const autre_taxe = parseFloat(blData.autre_taxe_numeric?.toString() || blData.autre_taxe?.toString() || '0') || 0;
      
      // Utiliser le calcul fait par la base de données en priorité
      let montant_ttc = parseFloat(blData.montant_ttc_calculated?.toString() || '0');
      if (isNaN(montant_ttc) || montant_ttc === 0) {
        // Fallback au calcul manuel si le calcul DB a échoué
        montant_ttc = montant_ht + tva + timbre + autre_taxe;
      }
      
      // Debug logs pour tracer les conversions - VERSION 3.0
      console.log(`🔍 ${dbType} BL ${nfact} - Database Numeric Conversion (v3.0):`, {
        raw_montant_ht: blData.montant_ht,
        raw_tva: blData.tva,
        raw_montant_ttc: blData.montant_ttc,
        db_montant_ht_numeric: blData.montant_ht_numeric,
        db_tva_numeric: blData.tva_numeric,
        db_montant_ttc_calculated: blData.montant_ttc_calculated,
        final_montant_ht: montant_ht,
        final_tva: tva,
        final_montant_ttc: montant_ttc,
        calculation_check: montant_ht + tva + timbre + autre_taxe,
        deployment_version: '3.0_DATABASE_CAST_FIX'
      });
      
      const result = {
        ...blData,
        // Normaliser les champs pour compatibilité avec conversion numérique
        // MySQL retourne NFact, Nclient (majuscule), on normalise APRÈS le spread
        details: details,
        nbl: blData.NFact || blData.nfact,
        nclient: blData.Nclient || blData.nclient,
        client_name: blData.client_name, // Garder tel quel
        date_bl: blData.date_fact,
        montant_ht: montant_ht,
        tva: tva,
        timbre: timbre,
        autre_taxe: autre_taxe,
        montant_ttc: montant_ttc
      };
      
      console.log(`✅ ${dbType}: Found BL ${nfact} with ${details.length} article details, TTC: ${montant_ttc}`);
      
      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ ${dbType}: Error fetching BL ${nfact}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async getFactList(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `
        SELECT 
          f.*,
          c.raison_sociale as client_name
        FROM \`${tenant}\`.fact f
        LEFT JOIN \`${tenant}\`.client c ON f.nclient = c.nclient
        ORDER BY f.nfact DESC
      `;
    } else {
      sql = `
        SELECT 
          f.*,
          c.raison_sociale as client_name
        FROM "${tenant}".fact f
        LEFT JOIN "${tenant}".client c ON f.nclient = c.nclient
        ORDER BY f.nfact DESC
      `;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async getFactById(dbType: 'mysql' | 'postgresql', tenant: string, nfact: string): Promise<any> {
    try {
      // Récupérer d'abord la facture principale
      let factSql;
      if (dbType === 'mysql') {
        factSql = `
          SELECT fact.*, c.raison_sociale as client_name, c.adresse as client_address, c.tel as client_phone,
                 CAST(fact.montant_ht AS DECIMAL(15,2)) as montant_ht_numeric,
                 CAST(fact.tva AS DECIMAL(15,2)) as tva_numeric,
                 CAST(fact.timbre AS DECIMAL(15,2)) as timbre_numeric,
                 CAST(fact.autre_taxe AS DECIMAL(15,2)) as autre_taxe_numeric,
                 CAST(fact.montant_ht AS DECIMAL(15,2)) + CAST(fact.tva AS DECIMAL(15,2)) + CAST(fact.timbre AS DECIMAL(15,2)) + CAST(fact.autre_taxe AS DECIMAL(15,2)) as montant_ttc_calculated
          FROM \`${tenant}\`.fact fact
          LEFT JOIN \`${tenant}\`.client c ON fact.nclient = c.nclient
          WHERE fact.nfact = ?
        `;
      } else {
        factSql = `
          SELECT fact.*, c.raison_sociale as client_name, c.adresse as client_address, c.tel as client_phone,
                 CAST(fact.montant_ht AS NUMERIC(15,2)) as montant_ht_numeric,
                 CAST(fact.tva AS NUMERIC(15,2)) as tva_numeric,
                 CAST(fact.timbre AS NUMERIC(15,2)) as timbre_numeric,
                 CAST(fact.autre_taxe AS NUMERIC(15,2)) as autre_taxe_numeric,
                 CAST(fact.montant_ht AS NUMERIC(15,2)) + CAST(fact.tva AS NUMERIC(15,2)) + CAST(fact.timbre AS NUMERIC(15,2)) + CAST(fact.autre_taxe AS NUMERIC(15,2)) as montant_ttc_calculated
          FROM "${tenant}".fact fact
          LEFT JOIN "${tenant}".client c ON fact.nclient = c.nclient
          WHERE fact.nfact = $1
        `;
      }
      
      const factResult = dbType === 'mysql' ? 
        await this.executeMySQLQuery(factSql, [nfact]) : 
        await this.executePostgreSQLQuery(factSql, [nfact]);
      
      if (!factResult.success || !factResult.data || factResult.data.length === 0) {
        return { success: false, error: 'Invoice not found' };
      }
      
      const factData = factResult.data[0];
      
      // Récupérer les détails de la facture avec conversion numérique
      let detailsSql;
      if (dbType === 'mysql') {
        detailsSql = `
          SELECT d.*, a.designation,
                 CAST(d.qte AS DECIMAL(10,2)) as qte_numeric,
                 CAST(d.prix AS DECIMAL(15,2)) as prix_numeric,
                 CAST(d.tva AS DECIMAL(5,2)) as tva_numeric,
                 CAST(d.total_ligne AS DECIMAL(15,2)) as total_ligne_numeric
          FROM \`${tenant}\`.detail_fact d
          LEFT JOIN \`${tenant}\`.article a ON d.narticle = a.narticle
          WHERE d.nfact = ?
          ORDER BY d.narticle
        `;
      } else {
        detailsSql = `
          SELECT d.*, a.designation,
                 CAST(d.qte AS NUMERIC(10,2)) as qte_numeric,
                 CAST(d.prix AS NUMERIC(15,2)) as prix_numeric,
                 CAST(d.tva AS NUMERIC(5,2)) as tva_numeric,
                 CAST(d.total_ligne AS NUMERIC(15,2)) as total_ligne_numeric
          FROM "${tenant}".detail_fact d
          LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle
          WHERE d.nfact = $1
          ORDER BY d.narticle
        `;
      }
      
      const detailsResult = dbType === 'mysql' ? 
        await this.executeMySQLQuery(detailsSql, [nfact]) : 
        await this.executePostgreSQLQuery(detailsSql, [nfact]);
      
      // Formater les détails avec les valeurs numériques converties
      const details = detailsResult.success && detailsResult.data ? 
        detailsResult.data.map((detail: any) => ({
          narticle: detail.narticle || detail.Narticle || '',
          designation: detail.designation || `Article ${detail.narticle}`,
          qte: parseFloat(detail.qte_numeric?.toString() || detail.qte?.toString() || '0') || 0,
          prix: parseFloat(detail.prix_numeric?.toString() || detail.prix?.toString() || '0') || 0,
          tva: parseFloat(detail.tva_numeric?.toString() || detail.tva?.toString() || '0') || 0,
          total_ligne: parseFloat(detail.total_ligne_numeric?.toString() || detail.total_ligne?.toString() || '0') || 0
        })) : [];
      
      // Utiliser les valeurs numériques converties depuis la base de données
      const montant_ht = parseFloat(factData.montant_ht_numeric?.toString() || factData.montant_ht?.toString() || '0') || 0;
      const tva = parseFloat(factData.tva_numeric?.toString() || factData.tva?.toString() || '0') || 0;
      const timbre = parseFloat(factData.timbre_numeric?.toString() || factData.timbre?.toString() || '0') || 0;
      const autre_taxe = parseFloat(factData.autre_taxe_numeric?.toString() || factData.autre_taxe?.toString() || '0') || 0;
      
      // Utiliser le calcul fait par la base de données en priorité
      let montant_ttc = parseFloat(factData.montant_ttc_calculated?.toString() || '0');
      if (isNaN(montant_ttc) || montant_ttc === 0) {
        // Fallback au calcul manuel si le calcul DB a échoué
        montant_ttc = montant_ht + tva + timbre + autre_taxe;
      }
      
      const result = {
        ...factData,
        details: details,
        // Normaliser les champs pour compatibilité
        date_fact: factData.date_fact,
        montant_ht: montant_ht,
        tva: tva,
        timbre: timbre,
        autre_taxe: autre_taxe,
        montant_ttc: montant_ttc
      };
      
      console.log(`✅ ${dbType}: Found Invoice ${nfact} with ${details.length} article details, TTC: ${montant_ttc}`);
      
      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ ${dbType}: Error fetching Invoice ${nfact}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async insertBL(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_nfact, p_nclient, p_date_fact, p_total_ht, p_total_ttc } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `INSERT INTO \`${p_tenant}\`.bl (nfact, nclient, date_fact, total_ht, total_ttc) VALUES (?, ?, ?, ?, ?)`;
    } else {
      sql = `INSERT INTO "${p_tenant}".bl (nfact, nclient, date_fact, total_ht, total_ttc) VALUES ($1, $2, $3, $4, $5)`;
    }
    const values = [p_nfact, p_nclient, p_date_fact, p_total_ht, p_total_ttc];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async insertFact(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_nfact, p_nclient, p_date_fact, p_total_ht, p_total_ttc } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `INSERT INTO \`${p_tenant}\`.fact (nfact, nclient, date_fact, total_ht, total_ttc) VALUES (?, ?, ?, ?, ?)`;
    } else {
      sql = `INSERT INTO "${p_tenant}".fact (nfact, nclient, date_fact, total_ht, total_ttc) VALUES ($1, $2, $3, $4, $5)`;
    }
    const values = [p_nfact, p_nclient, p_date_fact, p_total_ht, p_total_ttc];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async insertDetailBL(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_nfact, p_narticle, p_qte, p_prix, p_total_ligne } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `INSERT INTO \`${p_tenant}\`.detail_bl (nfact, narticle, qte, prix, total_ligne) VALUES (?, ?, ?, ?, ?)`;
    } else {
      sql = `INSERT INTO "${p_tenant}".detail_bl (nfact, narticle, qte, prix, total_ligne) VALUES ($1, $2, $3, $4, $5)`;
    }
    const values = [p_nfact, p_narticle, p_qte, p_prix, p_total_ligne];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async insertDetailFact(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_nfact, p_narticle, p_qte, p_prix, p_total_ligne } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `INSERT INTO \`${p_tenant}\`.detail_fact (nfact, narticle, qte, prix, total_ligne) VALUES (?, ?, ?, ?, ?)`;
    } else {
      sql = `INSERT INTO "${p_tenant}".detail_fact (nfact, narticle, qte, prix, total_ligne) VALUES ($1, $2, $3, $4, $5)`;
    }
    const values = [p_nfact, p_narticle, p_qte, p_prix, p_total_ligne];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async getNextBLNumber(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM \`${tenant}\`.bl`;
    } else {
      sql = `SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "${tenant}".bl`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async getNextFactNumber(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM \`${tenant}\`.fact`;
    } else {
      sql = `SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "${tenant}".fact`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  // Méthodes pour le stock
  private async getArticleStock(dbType: 'mysql' | 'postgresql', tenant: string, narticle: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `SELECT stock_f, stock_bl FROM \`${tenant}\`.article WHERE narticle = ?`;
    } else {
      sql = `SELECT stock_f, stock_bl FROM "${tenant}".article WHERE narticle = $1`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, [narticle]) : this.executePostgreSQLQuery(sql, [narticle]);
  }

  private async updateStockBL(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_narticle, p_qte } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `UPDATE \`${p_tenant}\`.article SET stock_bl = stock_bl - ? WHERE narticle = ?`;
    } else {
      sql = `UPDATE "${p_tenant}".article SET stock_bl = stock_bl - $1 WHERE narticle = $2`;
    }
    const values = [p_qte, p_narticle];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async updateStockF(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_narticle, p_qte } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `UPDATE \`${p_tenant}\`.article SET stock_f = stock_f - ? WHERE narticle = ?`;
    } else {
      sql = `UPDATE "${p_tenant}".article SET stock_f = stock_f - $1 WHERE narticle = $2`;
    }
    const values = [p_qte, p_narticle];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  // Méthodes pour les familles et settings
  private async getFamiliesByTenant(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `SELECT DISTINCT famille FROM \`${tenant}\`.article WHERE famille IS NOT NULL ORDER BY famille`;
    } else {
      sql = `SELECT DISTINCT famille FROM "${tenant}".article WHERE famille IS NOT NULL ORDER BY famille`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async insertFamilyToTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    // Les familles sont généralement gérées via les articles, pas une table séparée
    return { success: true, data: 'Family management via articles' };
  }

  private async updateFamilyInTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_old_famille, p_new_famille } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `UPDATE \`${p_tenant}\`.article SET famille = ? WHERE famille = ?`;
    } else {
      sql = `UPDATE "${p_tenant}".article SET famille = $1 WHERE famille = $2`;
    }
    const values = [p_new_famille, p_old_famille];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async deleteFamilyFromTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_famille } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `UPDATE \`${p_tenant}\`.article SET famille = NULL WHERE famille = ?`;
    } else {
      sql = `UPDATE "${p_tenant}".article SET famille = NULL WHERE famille = $1`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, [p_famille]) : this.executePostgreSQLQuery(sql, [p_famille]);
  }

  private async getCompanyInfo(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    // Retourner des informations par défaut si pas de table company_info
    return {
      success: true,
      data: [{
        nom_entreprise: 'ETS BENAMAR BOUZID MENOUAR',
        adresse: '10, Rue Belhandouz A.E.K, Mostaganem',
        telephone: '(213)045.42.35.20',
        email: 'outillagesaada@gmail.com'
      }]
    };
  }

  private async updateCompanyInfo(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    // Simuler la mise à jour des informations de l'entreprise
    return { success: true, data: 'Company info updated' };
  }

  private async getUnitsByTenant(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    // Retourner des unités par défaut
    return {
      success: true,
      data: [
        { unite: 'Pièce' },
        { unite: 'Kg' },
        { unite: 'Litre' },
        { unite: 'Mètre' }
      ]
    };
  }

  // Méthodes pour les proformas
  private async getProformaList(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      // Table fprof avec JOIN sur client pour récupérer raison_sociale
      sql = `
        SELECT 
          f.*, 
          c.raison_sociale as client_name
        FROM \`${tenant}\`.fprof f
        LEFT JOIN \`${tenant}\`.client c ON f.nclient = c.nclient
        ORDER BY f.nfact DESC
      `;
    } else {
      sql = `
        SELECT 
          f.*, 
          c.raison_sociale as client_name
        FROM "${tenant}".fprof f
        LEFT JOIN "${tenant}".client c ON f.nclient = c.nclient
        ORDER BY f.nfact DESC
      `;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async getProformaById(dbType: 'mysql' | 'postgresql', tenant: string, nfact: string): Promise<any> {
    try {
      // Récupérer d'abord la proforma principale
      let proformaSql;
      if (dbType === 'mysql') {
        proformaSql = `
          SELECT fprof.*, c.raison_sociale as client_name, c.adresse as client_address, c.tel as client_phone,
                 CAST(fprof.montant_ht AS DECIMAL(15,2)) as montant_ht_numeric,
                 CAST(fprof.tva AS DECIMAL(15,2)) as tva_numeric,
                 CAST(fprof.timbre AS DECIMAL(15,2)) as timbre_numeric,
                 CAST(fprof.autre_taxe AS DECIMAL(15,2)) as autre_taxe_numeric,
                 CAST(fprof.montant_ht AS DECIMAL(15,2)) + CAST(fprof.tva AS DECIMAL(15,2)) + CAST(fprof.timbre AS DECIMAL(15,2)) + CAST(fprof.autre_taxe AS DECIMAL(15,2)) as montant_ttc_calculated
          FROM \`${tenant}\`.fprof fprof
          LEFT JOIN \`${tenant}\`.client c ON fprof.nclient = c.nclient
          WHERE fprof.nfact = ?
        `;
      } else {
        proformaSql = `
          SELECT fprof.*, c.raison_sociale as client_name, c.adresse as client_address, c.tel as client_phone,
                 CAST(fprof.montant_ht AS NUMERIC(15,2)) as montant_ht_numeric,
                 CAST(fprof.tva AS NUMERIC(15,2)) as tva_numeric,
                 CAST(fprof.timbre AS NUMERIC(15,2)) as timbre_numeric,
                 CAST(fprof.autre_taxe AS NUMERIC(15,2)) as autre_taxe_numeric,
                 CAST(fprof.montant_ht AS NUMERIC(15,2)) + CAST(fprof.tva AS NUMERIC(15,2)) + CAST(fprof.timbre AS NUMERIC(15,2)) + CAST(fprof.autre_taxe AS NUMERIC(15,2)) as montant_ttc_calculated
          FROM "${tenant}".fprof fprof
          LEFT JOIN "${tenant}".client c ON fprof.nclient = c.nclient
          WHERE fprof.nfact = $1
        `;
      }
      
      const proformaResult = dbType === 'mysql' ? 
        await this.executeMySQLQuery(proformaSql, [nfact]) : 
        await this.executePostgreSQLQuery(proformaSql, [nfact]);
      
      if (!proformaResult.success || !proformaResult.data || proformaResult.data.length === 0) {
        return { success: false, error: 'Proforma not found' };
      }
      
      const proformaData = proformaResult.data[0];
      
      // Récupérer les détails de la proforma avec conversion numérique
      let detailsSql;
      if (dbType === 'mysql') {
        detailsSql = `
          SELECT d.*, a.designation,
                 CAST(d.qte AS DECIMAL(10,2)) as qte_numeric,
                 CAST(d.prix AS DECIMAL(15,2)) as prix_numeric,
                 CAST(d.tva AS DECIMAL(5,2)) as tva_numeric,
                 CAST(d.total_ligne AS DECIMAL(15,2)) as total_ligne_numeric
          FROM \`${tenant}\`.detail_fprof d
          LEFT JOIN \`${tenant}\`.article a ON d.narticle = a.narticle
          WHERE d.nfact = ?
          ORDER BY d.narticle
        `;
      } else {
        detailsSql = `
          SELECT d.*, a.designation,
                 CAST(d.qte AS NUMERIC(10,2)) as qte_numeric,
                 CAST(d.prix AS NUMERIC(15,2)) as prix_numeric,
                 CAST(d.tva AS NUMERIC(5,2)) as tva_numeric,
                 CAST(d.total_ligne AS NUMERIC(15,2)) as total_ligne_numeric
          FROM "${tenant}".detail_fprof d
          LEFT JOIN "${tenant}".article a ON d.narticle = a.narticle
          WHERE d.nfact = $1
          ORDER BY d.narticle
        `;
      }
      
      const detailsResult = dbType === 'mysql' ? 
        await this.executeMySQLQuery(detailsSql, [nfact]) : 
        await this.executePostgreSQLQuery(detailsSql, [nfact]);
      
      // Formater les détails avec les valeurs numériques converties
      const details = detailsResult.success && detailsResult.data ? 
        detailsResult.data.map((detail: any) => ({
          narticle: detail.narticle || detail.Narticle || '',
          designation: detail.designation || `Article ${detail.narticle}`,
          qte: parseFloat(detail.qte_numeric?.toString() || detail.qte?.toString() || '0') || 0,
          prix: parseFloat(detail.prix_numeric?.toString() || detail.prix?.toString() || '0') || 0,
          tva: parseFloat(detail.tva_numeric?.toString() || detail.tva?.toString() || '0') || 0,
          total_ligne: parseFloat(detail.total_ligne_numeric?.toString() || detail.total_ligne?.toString() || '0') || 0
        })) : [];
      
      // Utiliser les valeurs numériques converties depuis la base de données
      const montant_ht = parseFloat(proformaData.montant_ht_numeric?.toString() || proformaData.montant_ht?.toString() || '0') || 0;
      const tva = parseFloat(proformaData.tva_numeric?.toString() || proformaData.tva?.toString() || '0') || 0;
      const timbre = parseFloat(proformaData.timbre_numeric?.toString() || proformaData.timbre?.toString() || '0') || 0;
      const autre_taxe = parseFloat(proformaData.autre_taxe_numeric?.toString() || proformaData.autre_taxe?.toString() || '0') || 0;
      
      // Utiliser le calcul fait par la base de données en priorité
      let montant_ttc = parseFloat(proformaData.montant_ttc_calculated?.toString() || '0');
      if (isNaN(montant_ttc) || montant_ttc === 0) {
        // Fallback au calcul manuel si le calcul DB a échoué
        montant_ttc = montant_ht + tva + timbre + autre_taxe;
      }
      
      const result = {
        ...proformaData,
        details: details,
        // Normaliser les champs pour compatibilité
        date_fact: proformaData.date_fact,
        montant_ht: montant_ht,
        tva: tva,
        timbre: timbre,
        autre_taxe: autre_taxe,
        montant_ttc: montant_ttc
      };
      
      console.log(`✅ ${dbType}: Found Proforma ${nfact} with ${details.length} article details, TTC: ${montant_ttc}`);
      
      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ ${dbType}: Error fetching Proforma ${nfact}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async insertProforma(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_nfact, p_nclient, p_date_fact, p_total_ht, p_total_ttc } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `INSERT INTO \`${p_tenant}\`.fprof (nfprof, nclient, date_fact, montant_ht, montant_ttc) VALUES (?, ?, ?, ?, ?)`;
    } else {
      sql = `INSERT INTO "${p_tenant}".fprof (nfprof, nclient, date_fact, montant_ht, montant_ttc) VALUES ($1, $2, $3, $4, $5)`;
    }
    const values = [p_nfact, p_nclient, p_date_fact, p_total_ht, p_total_ttc];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async insertDetailProforma(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const { p_tenant, p_nfact, p_narticle, p_qte, p_prix, p_total_ligne } = params;
    let sql;
    if (dbType === 'mysql') {
      sql = `INSERT INTO \`${p_tenant}\`.detail_fprof (nfprof, narticle, qte, prix, total_ligne) VALUES (?, ?, ?, ?, ?)`;
    } else {
      sql = `INSERT INTO "${p_tenant}".detail_fprof (nfprof, narticle, qte, prix, total_ligne) VALUES ($1, $2, $3, $4, $5)`;
    }
    const values = [p_nfact, p_narticle, p_qte, p_prix, p_total_ligne];
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async getNextProformaNumber(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    let sql;
    if (dbType === 'mysql') {
      sql = `SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM \`${tenant}\`.fprof`;
    } else {
      sql = `SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "${tenant}".fprof`;
    }
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  // Méthodes pour l'activité
  private async updateTenantActivite(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    // Simuler la mise à jour de l'activité
    return { success: true, data: 'Activity updated' };
  }

  private async deleteActivityFromTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    // Simuler la suppression de l'activité
    return { success: true, data: 'Activity deleted' };
  }

  // Fonction exec_sql générique
  private async executeDirectSQL(dbType: 'mysql' | 'postgresql', sql: string): Promise<any> {
    console.log(`🔧 Direct SQL execution on ${dbType}:`, sql.substring(0, 100) + '...');
    
    if (dbType === 'mysql') {
      return this.executeMySQLQuery(sql, []);
    } else {
      return this.executePostgreSQLQuery(sql, []);
    }
  }

  // =====================================================
  // MÉTHODES SPÉCIFIQUES MYSQL POUR MODIFICATION BL
  // =====================================================

  private async executeMySQLUpdateBL(params: Record<string, any>): Promise<any> {
    try {
      const pool = this.getMySQLPool();
      if (!pool) {
        throw new Error('MySQL connection not established');
      }

      console.log(`🐬 MySQL: Executing update_bl procedure with params:`, params);

      // Appeler la procédure stockée update_bl avec paramètres OUT
      const [rows] = await pool.execute(
        'CALL update_bl(?, ?, ?, ?, ?, ?, ?, @success, @message, @error)',
        [
          params.p_tenant,
          params.p_nfact,
          params.p_nclient,
          params.p_date_fact,
          params.p_montant_ht,
          params.p_tva,
          params.p_montant_ttc
        ]
      );

      // Récupérer les variables de sortie
      const [resultRows] = await pool.execute(
        'SELECT @success as success, @message as message, @error as error'
      );

      const result = Array.isArray(resultRows) ? resultRows[0] : resultRows;
      
      console.log(`✅ MySQL update_bl result:`, result);

      return {
        success: Boolean(result.success),
        message: result.message,
        error: result.error,
        data: result.success ? { nfact: params.p_nfact } : null
      };

    } catch (error) {
      console.error('❌ MySQL update_bl failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeMySQLDeleteBLDetails(params: Record<string, any>): Promise<any> {
    try {
      const pool = this.getMySQLPool();
      if (!pool) {
        throw new Error('MySQL connection not established');
      }

      console.log(`🐬 MySQL: Executing delete_bl_details procedure with params:`, params);

      // Appeler la procédure stockée delete_bl_details avec paramètres OUT
      const [rows] = await pool.execute(
        'CALL delete_bl_details(?, ?, @success, @message, @error, @deleted_count)',
        [params.p_tenant, params.p_nfact]
      );

      // Récupérer les variables de sortie
      const [resultRows] = await pool.execute(
        'SELECT @success as success, @message as message, @error as error, @deleted_count as deleted_count'
      );

      const result = Array.isArray(resultRows) ? resultRows[0] : resultRows;
      
      console.log(`✅ MySQL delete_bl_details result:`, result);

      return {
        success: Boolean(result.success),
        message: result.message,
        error: result.error,
        data: result.success ? { deleted_count: result.deleted_count } : null
      };

    } catch (error) {
      console.error('❌ MySQL delete_bl_details failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeMySQLInsertBLDetail(params: Record<string, any>): Promise<any> {
    try {
      const pool = this.getMySQLPool();
      if (!pool) {
        throw new Error('MySQL connection not established');
      }

      console.log(`🐬 MySQL: Executing insert_bl_detail procedure with params:`, params);

      // Appeler la procédure stockée insert_bl_detail avec paramètres OUT
      const [rows] = await pool.execute(
        'CALL insert_bl_detail(?, ?, ?, ?, ?, ?, ?, @success, @message, @error)',
        [
          params.p_tenant,
          params.p_nfact,
          params.p_narticle,
          params.p_qte,
          params.p_prix,
          params.p_tva,
          params.p_total_ligne
        ]
      );

      // Récupérer les variables de sortie
      const [resultRows] = await pool.execute(
        'SELECT @success as success, @message as message, @error as error'
      );

      const result = Array.isArray(resultRows) ? resultRows[0] : resultRows;
      
      console.log(`✅ MySQL insert_bl_detail result:`, result);

      return {
        success: Boolean(result.success),
        message: result.message,
        error: result.error,
        data: result.success ? { inserted: true } : null
      };

    } catch (error) {
      console.error('❌ MySQL insert_bl_detail failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

}

// Export singleton instance
export const backendDatabaseService = BackendDatabaseService.getInstance();
