import { Hono } from 'hono';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';
import { CompanyService } from '../services/companyService.js';

const company = new Hono();

// Apply tenant middleware
company.use('*', tenantMiddleware);

// GET /api/company/info - Get company information for current tenant
company.get('/info', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🏢 Getting company info for tenant: ${tenant.schema}`);
    
    const companyInfo = await CompanyService.getCompanyInfo(tenant.schema);
    
    return c.json({
      success: true,
      data: companyInfo
    });
  } catch (error) {
    console.error('❌ Error getting company info:', error);
    return c.json({
      success: false,
      error: 'Failed to get company information'
    }, 500);
  }
});

export default company;
