import { Context, Next } from 'hono';

export interface TenantContext {
  tenant_id: string;
  year: number;
  schema: string;
}

// Middleware to extract tenant information from request
export const tenantMiddleware = async (c: Context, next: Next) => {
  try {
    // Get tenant info from headers or query params
    const tenantHeader = c.req.header('X-Tenant-Schema') || c.req.header('X-Tenant');
    const businessUnit = c.req.header('X-Business-Unit') || c.req.query('business_unit');
    const year = c.req.header('X-Year') || c.req.query('year');

    let tenantContext: TenantContext;

    if (tenantHeader) {
      // Direct schema provided
      const [yearPart, buPart] = tenantHeader.split('_');
      tenantContext = {
        tenant_id: buPart || 'bu01',
        year: parseInt(yearPart) || new Date().getFullYear(),
        schema: tenantHeader
      };
    } else if (businessUnit && year) {
      // Business unit and year provided separately
      tenantContext = {
        tenant_id: businessUnit,
        year: parseInt(year as string),
        schema: `${year}_${businessUnit}`
      };
    } else {
      // Default tenant for development/testing
      const currentYear = new Date().getFullYear();
      tenantContext = {
        tenant_id: 'bu01',
        year: currentYear,
        schema: `${currentYear}_bu01`
      };
    }

    // Add tenant context to the request context
    c.set('tenant', tenantContext);
    
    await next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return c.json({ success: false, error: 'Invalid tenant configuration' }, 400);
  }
};

// Helper function to get tenant context from request
export const getTenantContext = (c: Context): TenantContext => {
  return c.get('tenant') as TenantContext;
};

// Helper function to build table name with schema
export const getTableName = (c: Context, tableName: string): string => {
  const tenant = getTenantContext(c);
  return `${tenant.schema}.${tableName}`;
};