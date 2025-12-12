import { supabaseAdmin } from '../supabaseClient.js';

export interface TenantContext {
  businessUnit: string;
  year: number;
  schema: string;
}

export class TenantService {
  /**
   * Get schema name from business unit and year
   */
  static getSchemaName(businessUnit: string, year: number): string {
    return `${year}_${businessUnit}`;
  }

  /**
   * Validate tenant context from headers
   */
  static validateTenantContext(headers: any): TenantContext | null {
    const businessUnit = headers['x-business-unit'];
    const year = parseInt(headers['x-year']);
    const schema = headers['x-tenant-schema'];

    if (!businessUnit || !year || !schema) {
      return null;
    }

    // Validate schema format
    const expectedSchema = this.getSchemaName(businessUnit, year);
    if (schema !== expectedSchema) {
      return null;
    }

    return { businessUnit, year, schema };
  }

  /**
   * Check if schema exists
   */
  static async schemaExists(schema: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin.rpc('check_schema_exists', {
        schema_name: schema
      });

      if (error) {
        console.error('Error checking schema:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error checking schema existence:', error);
      return false;
    }
  }

  /**
   * Create schema if it doesn't exist
   */
  static async ensureSchema(schema: string): Promise<boolean> {
    try {
      // Check if schema exists
      const exists = await this.schemaExists(schema);
      if (exists) {
        return true;
      }

      // Create schema
      const { error: createError } = await supabaseAdmin.rpc('create_tenant_schema', {
        schema_name: schema
      });

      if (createError) {
        console.error('Error creating schema:', createError);
        return false;
      }

      console.log(`✅ Schema ${schema} created successfully`);
      return true;
    } catch (error) {
      console.error('Error ensuring schema:', error);
      return false;
    }
  }

  /**
   * Get available business units
   */
  static async getBusinessUnits(): Promise<Array<{id: string, name: string, description: string}>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('business_units')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching business units:', error);
        // Return default business units if table doesn't exist
        return [
          { id: 'bu01', name: 'Unité Principale', description: 'Activité principale de l\'entreprise' },
          { id: 'bu02', name: 'Succursale Nord', description: 'Succursale région Nord' },
          { id: 'bu03', name: 'Succursale Sud', description: 'Succursale région Sud' }
        ];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting business units:', error);
      return [];
    }
  }

  /**
   * Get available exercises/years
   */
  static async getExercises(): Promise<Array<{year: number, description: string, active: boolean}>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('exercises')
        .select('*')
        .order('year', { ascending: false });

      if (error) {
        console.error('Error fetching exercises:', error);
        // Return default exercises if table doesn't exist
        const currentYear = new Date().getFullYear();
        return [
          { year: currentYear, description: `Exercice ${currentYear}`, active: true },
          { year: currentYear - 1, description: `Exercice ${currentYear - 1}`, active: true },
          { year: currentYear - 2, description: `Exercice ${currentYear - 2}`, active: false }
        ];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting exercises:', error);
      return [];
    }
  }

  /**
   * Execute query with tenant context
   */
  static async executeWithTenant<T>(
    tenantContext: TenantContext,
    operation: () => Promise<T>
  ): Promise<T> {
    // Ensure schema exists
    const schemaExists = await this.ensureSchema(tenantContext.schema);
    if (!schemaExists) {
      throw new Error(`Schema ${tenantContext.schema} could not be created`);
    }

    // Execute operation
    return await operation();
  }

  /**
   * Get table name with schema prefix
   */
  static getTableName(schema: string, tableName: string): string {
    return `${schema}.${tableName}`;
  }
}

/**
 * Middleware function to extract and validate tenant context
 */
export function withTenantContext(handler: (context: TenantContext, ...args: any[]) => Promise<any>) {
  return async (c: any) => {
    try {
      // Extract tenant context from headers
      const tenantContext = TenantService.validateTenantContext(c.req.header());
      
      if (!tenantContext) {
        return c.json({ 
          success: false, 
          error: 'Invalid or missing tenant context. Please login again.' 
        }, 400);
      }

      // Ensure schema exists
      const schemaExists = await TenantService.ensureSchema(tenantContext.schema);
      if (!schemaExists) {
        return c.json({ 
          success: false, 
          error: `Schema ${tenantContext.schema} is not available` 
        }, 500);
      }

      // Call handler with tenant context
      return await handler(tenantContext, c);
    } catch (error) {
      console.error('Tenant context error:', error);
      return c.json({ 
        success: false, 
        error: 'Internal server error' 
      }, 500);
    }
  };
}