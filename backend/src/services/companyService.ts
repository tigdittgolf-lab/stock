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

      // Call RPC function to get company info with tenant parameter
      const { data, error } = await supabaseAdmin.rpc('get_company_info', {
        p_tenant: currentTenant
      });

      if (error) {
        console.error('Error fetching company info:', error);
        return this.getDefaultCompanyInfo();
      }

      if (!data || data.length === 0) {
        console.warn('No company info found in activite table, using defaults');
        return this.getDefaultCompanyInfo();
      }

      const companyData = data[0];
      
      // Map the data to our CompanyInfo interface
      const companyInfo: CompanyInfo = {
        name: companyData.raison_sociale || 'VOTRE ENTREPRISE',
        address: this.formatAddress(companyData),
        phone: companyData.tel_fixe || '+213 XX XX XX XX',
        email: companyData.e_mail || `contact@${(companyData.raison_sociale || 'entreprise').toLowerCase().replace(/\s+/g, '')}.dz`,
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
    
    return parts.length > 0 ? parts.join(', ') : 'Adresse de votre entreprise';
  }

  /**
   * Get default company info as fallback
   */
  private static getDefaultCompanyInfo(): CompanyInfo {
    return {
      name: 'VOTRE ENTREPRISE',
      address: 'Adresse de votre entreprise',
      phone: '+213 XX XX XX XX',
      email: 'contact@entreprise.dz',
      nif: '000000000000000',
      rc: '00/00-0000000'
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