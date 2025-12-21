import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseAdapter, DatabaseConfig, QueryResult } from '../types';

export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      if (!this.config.supabaseUrl || !this.config.supabaseKey) {
        throw new Error('Configuration Supabase incomplète');
      }

      this.client = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      
      // Test de connexion simple
      const { error } = await this.client.from('business_units').select('count').limit(1);
      
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw error;
      }

      console.log('✅ Connexion Supabase établie');
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion Supabase:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Supabase ne nécessite pas de déconnexion explicite
    this.client = null;
    console.log('🔌 Déconnexion Supabase');
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.client) {
      return { success: false, error: 'Pas de connexion Supabase' };
    }

    try {
      // Pour Supabase, on utilise les méthodes spécifiques plutôt que SQL brut
      // Cette méthode sera principalement utilisée pour les requêtes de test
      console.log('🔍 Requête Supabase (simulation):', sql);
      
      return {
        success: true,
        data: [],
        rowCount: 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        await this.connect();
      }

      const { error } = await this.client!.from('business_units').select('count').limit(1);
      return !error || error.message.includes('relation') || error.message.includes('does not exist');
    } catch (error) {
      console.error('❌ Test connexion Supabase échoué:', error);
      return false;
    }
  }

  async getSchemas(): Promise<string[]> {
    if (!this.client) {
      const connected = await this.connect();
      if (!connected) {
        return [];
      }
    }

    try {
      const { data, error } = await this.client!.from('business_units').select('schema_name');
      
      if (error) {
        console.error('Erreur récupération schémas:', error);
        return [];
      }

      return data?.map(bu => bu.schema_name) || [];
    } catch (error) {
      console.error('Exception récupération schémas:', error);
      return [];
    }
  }

  async createSchema(schemaName: string): Promise<boolean> {
    // Pour Supabase, la création de schéma se fait via les fonctions RPC
    console.log('🏗️ Création schéma Supabase:', schemaName);
    return true;
  }

  async executeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    if (!this.client) {
      // Tenter de se connecter automatiquement
      const connected = await this.connect();
      if (!connected) {
        return { success: false, error: 'Impossible de se connecter à Supabase' };
      }
    }

    try {
      const { data, error } = await this.client!.rpc(functionName, params);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
        rowCount: Array.isArray(data) ? data.length : 1
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur RPC'
      };
    }
  }

  // Méthodes spécifiques Supabase pour compatibilité
  getClient(): SupabaseClient | null {
    return this.client;
  }
}