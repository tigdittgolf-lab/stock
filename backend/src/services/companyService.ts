import { supabaseAdmin } from '../supabaseClient.js';
import { backendDatabaseService } from './databaseService.js';

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  nif?: string;
  rc?: string;
  domaine_activite?: string;
  sous_domaine?: string;
  commune?: string;
  wilaya?: string;
  tel_port?: string;
  nis?: string;
  art?: string;
  ident_fiscal?: string;
  banq?: string;
}

export class CompanyService {
  private static cachedCompanyInfo: Map<string, CompanyInfo> = new Map();
  private static lastFetch: Map<string, number> = new Map();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get company information from the activite table in tenant schema
   */
  static async getCompanyInfo(tenant?: string): Promise<CompanyInfo> {
    // Use default tenant if not provided
    const currentTenant = tenant || '2025_bu01';
    
    // Check cache first (per tenant)
    const now = Date.now();
    const cachedInfo = this.cachedCompanyInfo.get(currentTenant);
    const lastFetchTime = this.lastFetch.get(currentTenant) || 0;
    
    if (cachedInfo && (now - lastFetchTime) < this.CACHE_DURATION) {
      return cachedInfo;
    }

    try {
      // Mode MySQL : lire directement depuis la table activite du tenant
      if (backendDatabaseService.getActiveDatabaseType() === 'mysql') {
        const result = await backendDatabaseService.executeQuery(
          `SELECT * FROM \`${currentTenant}\`.activite WHERE tenant_id = ? LIMIT 1`,
          [currentTenant]
        );
        if (result.success && result.data && result.data.length > 0) {
          const row = result.data[0];
          const companyInfo: CompanyInfo = this.mapRowToInfo(row);
          this.cachedCompanyInfo.set(currentTenant, companyInfo);
          this.lastFetch.set(currentTenant, now);
          console.log(`✅ Company info loaded from MySQL for ${currentTenant}:`, companyInfo.name || '(vide)');
          return companyInfo;
        }
        console.warn('Aucune ligne activite en MySQL, retour recupere du fallback');
      }

      console.log(`🏢 Fetching company info from activite table for tenant: ${currentTenant}...`);

      // Try RPC function first
      const { data, error } = await supabaseAdmin.rpc('get_company_info', {
        p_tenant: currentTenant
      });

      if (error || !data || data.length === 0) {
        console.warn('RPC function failed or no data, trying fallback method:', error?.message);
        
        // Fallback: Use the settings API approach
        try {
          const { data: activitiesData, error: activitiesError } = await supabaseAdmin
            .rpc('get_tenant_activite', { p_schema: currentTenant });
          
          if (activitiesError || !activitiesData || activitiesData.length === 0) {
            console.warn('Fallback method also failed, using default data');
            // Retourner des informations neutres (aucune donnée réel codée en dur)
            const companyInfo: CompanyInfo = {
              name: '',
              address: '',
              phone: '',
              email: '',
              nif: '',
              rc: ''
            };
            
            // Cache the result per tenant
            this.cachedCompanyInfo.set(currentTenant, companyInfo);
            this.lastFetch.set(currentTenant, now);
            
            console.log(`✅ Using default company info for ${currentTenant}`);
            return companyInfo;
          }
          
          const companyData = activitiesData[0];
          const companyInfo: CompanyInfo = {
            name: companyData.nom_entreprise || '',
            address: companyData.adresse || '',
            phone: this.cleanPhoneNumber(companyData.telephone),
            email: companyData.email || '',
            nif: companyData.nif || '',
            rc: companyData.rc || ''
          };
          
          // Cache the result per tenant
          this.cachedCompanyInfo.set(currentTenant, companyInfo);
          this.lastFetch.set(currentTenant, now);
          
          console.log(`✅ Company info loaded via fallback for ${currentTenant}:`, companyInfo.name);
          return companyInfo;
          
        } catch (fallbackError) {
          console.error('Fallback method failed:', fallbackError);
          return this.getDefaultCompanyInfo();
        }
      }

      const companyData = data[0];
      
      // Map the data to our CompanyInfo interface
      const companyInfo: CompanyInfo = {
        name: companyData.raison_sociale || companyData.nom_entreprise || '',
        address: this.formatAddress(companyData),
        phone: this.cleanPhoneNumber(companyData.tel_fixe),
        email: companyData.e_mail || '',
        nif: companyData.nif || companyData.ident_fiscal || companyData.nis || '',
        rc: companyData.rc || companyData.nrc || '',
        domaine_activite: companyData.domaine_activite || '',
        sous_domaine: companyData.sous_domaine || '',
        commune: companyData.commune || '',
        wilaya: companyData.wilaya || '',
        tel_port: companyData.tel_port || '',
        nis: companyData.nis || '',
        art: companyData.nart || '',
        ident_fiscal: companyData.ident_fiscal || '',
        banq: companyData.banq || ''
      };

      // Cache the result per tenant
      this.cachedCompanyInfo.set(currentTenant, companyInfo);
      this.lastFetch.set(currentTenant, now);

      console.log(`✅ Company info loaded successfully for ${currentTenant}:`, companyInfo.name);
      return companyInfo;

    } catch (error) {
      console.error('Error in getCompanyInfo:', error);
      return this.getDefaultCompanyInfo();
    }
  }

  /**
   * Format address from company data
   */
  private static formatAddress(data: any): string {
    const parts = [];
    
    if (data.adresse) parts.push(data.adresse);
    if (data.commune) parts.push(data.commune);
    if (data.wilaya) parts.push(data.wilaya);
    
    return parts.length > 0 ? parts.join(', ') : '';
  }

  private static mapRowToInfo(row: any): CompanyInfo {
    return {
      name: row.raison_sociale || row.nom_entreprise || '',
      address: this.formatAddress(row),
      phone: this.cleanPhoneNumber(row.tel_fixe || row.telephone),
      email: row.email || row.e_mail || '',
      nif: row.nif || row.ident_fiscal || row.nis || '',
      rc: row.rc || row.nrc || '',
      domaine_activite: row.domaine_activite || '',
      sous_domaine: row.sous_domaine || '',
      commune: row.commune || '',
      wilaya: row.wilaya || '',
      tel_port: row.tel_port || '',
      nis: row.nis || '',
      art: row.nart || '',
      ident_fiscal: row.ident_fiscal || '',
      banq: row.banq || ''
    };
  }

  /**
   * Get default company info as fallback (neutre, aucune donnée réelle)
   */
  private static getDefaultCompanyInfo(): CompanyInfo {
    return {
      name: '',
      address: '',
      phone: '',
      email: '',
      nif: '',
      rc: ''
    };
  }

  /**
   * Clear cache (useful for testing or when company info is updated)
   */
  static clearCache(tenant?: string): void {
    if (tenant) {
      this.cachedCompanyInfo.delete(tenant);
      this.lastFetch.delete(tenant);
    } else {
      this.cachedCompanyInfo.clear();
      this.lastFetch.clear();
    }
  }

  /**
   * Get formatted company header for documents
   */
  static async getFormattedHeader(tenant?: string): Promise<string> {
    const info = await this.getCompanyInfo(tenant);
    
    let header = info.name;
    if (info.domaine_activite) {
      header += `\n${info.domaine_activite}`;
    }
    if (info.sous_domaine) {
      header += ` - ${info.sous_domaine}`;
    }
    
    return header;
  }

  /**
   * Clean phone number by removing prefixes like "Tèl :" or "Tél :"
   */
  private static cleanPhoneNumber(phone: string | null): string | null {
    if (!phone) return null;
    
    // Remove common prefixes
    return phone
      .replace(/^Tèl\s*:\s*/i, '')  // Remove "Tèl :" or "Tèl:"
      .replace(/^Tél\s*:\s*/i, '')  // Remove "Tél :" or "Tél:"
      .replace(/^Tel\s*:\s*/i, '')  // Remove "Tel :" or "Tel:"
      .replace(/^Téléphone\s*:\s*/i, '') // Remove "Téléphone :"
      .trim();
  }

  /**
   * Get complete company details for documents
   */
  static async getCompanyDetails(tenant?: string): Promise<{
    header: string;
    address: string;
    contact: string;
    legal: string;
  }> {
    const info = await this.getCompanyInfo(tenant);
    
    return {
      header: await this.getFormattedHeader(tenant),
      address: info.address,
      contact: `Tél: ${info.phone}${info.tel_port ? ` / ${info.tel_port}` : ''}${info.email ? ` - Email: ${info.email}` : ''}`,
      legal: `${info.rc ? `RC: ${info.rc}` : ''}${info.nif ? ` - NIF: ${info.nif}` : ''}${info.art ? ` - Art: ${info.art}` : ''}`
    };
  }
}