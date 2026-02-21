import { Hono } from 'hono';
import { CompanyService } from '../services/companyService.js';

const cache = new Hono();

// Import des caches d'articles depuis les routes
// Note: Ces caches sont définis dans articles.ts et sales.ts
// On va créer une fonction pour les vider

/**
 * Clear all caches (Company + Articles)
 */
cache.post('/clear-all', async (c) => {
  try {
    const tenant = c.req.header('X-Tenant');
    
    // Clear company cache
    if (tenant) {
      CompanyService.clearCache(tenant);
      console.log(`🧹 Company cache cleared for tenant: ${tenant}`);
    } else {
      CompanyService.clearCache();
      console.log('🧹 All company cache cleared');
    }
    
    // Note: Les caches d'articles sont dans articles.ts et sales.ts
    // Pour les vider, il faut redémarrer le backend ou utiliser /api/articles/force-refresh
    
    return c.json({
      success: true,
      message: tenant 
        ? `All caches cleared for tenant: ${tenant}. Restart backend to clear article caches.`
        : 'All caches cleared. Restart backend to clear article caches.',
      tenant: tenant,
      note: 'Article caches require backend restart or use /api/articles/force-refresh'
    });
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Clear CompanyService cache
 */
cache.post('/clear', async (c) => {
  try {
    const tenant = c.req.header('X-Tenant');
    
    if (tenant) {
      // Clear cache for specific tenant
      CompanyService.clearCache(tenant);
      console.log(`🧹 Cache cleared for tenant: ${tenant}`);
      
      return c.json({
        success: true,
        message: `Cache cleared for tenant: ${tenant}`,
        tenant: tenant
      });
    } else {
      // Clear all cache
      CompanyService.clearCache();
      console.log('🧹 All cache cleared');
      
      return c.json({
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get current cache status
 */
cache.get('/status', async (c) => {
  try {
    // Note: We can't directly access the private cache Map, 
    // but we can test if cache is working by calling getCompanyInfo
    const tenant = c.req.header('X-Tenant') || '2025_bu01';
    
    const companyInfo = await CompanyService.getCompanyInfo(tenant);
    
    return c.json({
      success: true,
      tenant: tenant,
      companyInfo: {
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email
      },
      message: 'Cache status retrieved'
    });
  } catch (error) {
    console.error('❌ Error getting cache status:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Force refresh cache for a tenant
 */
cache.post('/refresh', async (c) => {
  try {
    const tenant = c.req.header('X-Tenant') || '2025_bu01';
    
    // Clear cache for this tenant
    CompanyService.clearCache(tenant);
    
    // Force a fresh load
    const companyInfo = await CompanyService.getCompanyInfo(tenant);
    
    console.log(`🔄 Cache refreshed for tenant: ${tenant} - ${companyInfo.name}`);
    
    return c.json({
      success: true,
      message: `Cache refreshed for tenant: ${tenant}`,
      tenant: tenant,
      companyInfo: {
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email
      }
    });
  } catch (error) {
    console.error('❌ Error refreshing cache:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default cache;