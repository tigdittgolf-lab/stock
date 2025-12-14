import { Hono } from 'hono';
import { CompanyService } from '../services/companyService.js';

const cache = new Hono();

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