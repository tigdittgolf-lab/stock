import { supabaseAdmin } from '../supabaseClient.js';

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
            console.warn('Fallback method also failed, using hardcoded data');
            // Use the real company data we know exists
            const companyInfo: CompanyInfo = {
              name: 'ETS BENAMAR BOUZID MENOUAR',
              address: '10, Rue Belhandouz A.E.K, Mostaganem',
              phone: '(213)045.42.35.20',
              email: 'outillagesaada@gmail.com',
              nif: '10227010185816600000',
              rc: '21A3965999-27/00'
            };
            
            // Cache the result per tenant
            this.cachedCompanyInfo.set(currentTenant, companyInfo);
            this.lastFetch.set(currentTenant, now);
            
            console.log(`✅ Using hardcoded company info for ${currentTenant}:`, companyInfo.name);
            return companyInfo;
          }
          
          const companyData = activitiesData[0];
          const companyInfo: CompanyInfo = {
            name: companyData.nom_entreprise || 'ETS BENAMAR BOUZID MENOUAR',
            address: companyData.adresse || '10, Rue Belhandouz A.E.K, Mostaganem',
            phone: this.cleanPhoneNumber(companyData.telephone) || '(213)045.42.35.20',
            email: companyData.email || 'outillagesaada@gmail.com',
            nif: companyData.nif || '10227010185816600000',
            rc: companyData.rc || '21A3965999-27/00'
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
        name: companyData.raison_sociale || 'ETS BENAMAR BOUZID MENOUAR',
        address: this.formatAddress(companyData),
        phone: this.cleanPhoneNumber(companyData.tel_fixe) || '(213)045.42.35.20',
        email: companyData.e_mail || 'outillagesaada@gmail.com',
        nif: companyData.nif || companyData.ident_fiscal || companyData.nis || '10227010185816600000',
        rc: companyData.rc || companyData.nrc || '21A3965999-27/00',
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
    
    return parts.length > 0 ? parts.join(', ') : 'Adresse de votre entreprise';
  }

  /**
   * Get default company info as fallback
   */
  private static getDefaultCompanyInfo(): CompanyInfo {
    return {
      name: 'ETS BENAMAR BOUZID MENOUAR',
      address: '10, Rue Belhandouz A.E.K, Mostaganem',
      phone: '(213)045.42.35.20',
      email: 'outillagesaada@gmail.com',
      nif: '10227010185816600000',
      rc: '21A3965999-27/00'
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