import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setupDatabase } from './src/setupDatabase.js';
import articles from './src/routes/articles-clean.js';
import clients from './src/routes/clients-clean.js';
import suppliers from './src/routes/suppliers-clean.js';
import families from './src/routes/families.js';
import activite from './src/routes/activite.js';
import sales from './src/routes/sales.js';
import purchases from './src/routes/purchases.js';
import stock from './src/routes/stock.js';
import reports from './src/routes/reports.js';
import auth from './src/routes/auth.js';
import authReal from './src/routes/auth-real.js';
import pdf from './src/routes/pdf.js';
import cache from './src/routes/cache.js';
import settings from './src/routes/settings.js';
import admin from './src/routes/admin.js';
import missingEndpoints from './src/routes/missing-endpoints.js';
import databaseConfig from './src/routes/database-config.js';
import database from './src/routes/database.js';

const app = new Hono();

// Enable CORS
app.use('/*', cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:3002',
    /^http:\/\/localhost:\d+$/,  // Allow any localhost port
    'https://frontend-iota-six-72.vercel.app',
    'https://desktop-bhhs068.tail1d9c54.ts.net',
    'https://frontend-pn8z8dd7o-tigdittgolf-9191s-projects.vercel.app',
    'https://st-article-1-b5pn7fp0k-tigdittgolf-9191s-projects.vercel.app',
    'https://vercel-test-edfqv1w3m-tigdittgolf-9191s-projects.vercel.app',
    'https://frontend-9rz1jzr4n-tigdittgolf-9191s-projects.vercel.app',
    'https://frontend-ctz9rb2z5-tigdittgolf-9191s-projects.vercel.app',
    'https://frontend-jv1h2b1wf-tigdittgolf-9191s-projects.vercel.app',
    'https://frontend-80xymdp0o-tigdittgolf-9191s-projects.vercel.app',
    'https://frontend-8e5ekyvfr-tigdittgolf-9191s-projects.vercel.app',
    'https://frontend-3xv2gh1l9-tigdittgolf-9191s-projects.vercel.app',
    'https://frontend-5lm8ks73w-tigdittgolf-9191s-projects.vercel.app',
    'https://frontend-o0yduwmki-tigdittgolf-9191s-projects.vercel.app',
    // Permettre toutes les URLs Vercel pour ce projet
    /^https:\/\/frontend-.*-tigdittgolf-9191s-projects\.vercel\.app$/,
    /^https:\/\/st-article-1-.*-tigdittgolf-9191s-projects\.vercel\.app$/,
    /^https:\/\/vercel-test-.*-tigdittgolf-9191s-projects\.vercel\.app$/,
    // Permettre les fichiers locaux et tous les tunnels pour les tests
    null, // Permet file:// et autres origines nulles
    /^https:\/\/.*\.trycloudflare\.com$/,
    /^https:\/\/.*\.ngrok\.io$/,
    /^https:\/\/.*\.loca\.lt$/,
    /^https:\/\/.*\.tail.*\.ts\.net$/
  ],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant', 'Cache-Control', 'Pragma'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false // Important pour les requêtes cross-origin
}));

// Add special headers to bypass local address space restrictions
app.use('/*', async (c, next) => {
  // Add headers to bypass CORS private network restrictions
  c.header('Access-Control-Allow-Private-Network', 'true');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  c.header('Cross-Origin-Opener-Policy', 'unsafe-none');
  
  await next();
});

// API Routes
app.route('/api/articles', articles);
app.route('/api/clients', clients);
app.route('/api/suppliers', suppliers);
app.route('/api/families', families);
app.route('/api/activite', activite);
app.route('/api/stock', stock);
app.route('/api/reports', reports);
app.route('/api/auth', auth);
app.route('/api/auth-real', authReal);
app.route('/api/pdf', pdf);
app.route('/api/cache', cache);
app.route('/api/settings', settings);
app.route('/api/admin', admin);
app.route('/api/database-config', databaseConfig);
app.route('/api/database', database);
app.route('/api', missingEndpoints);

try {
  app.route('/api/sales', sales);
  console.log('✅ Sales routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register sales routes:', error);
}

try {
  app.route('/api/purchases', purchases);
  console.log('✅ Purchases routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register purchases routes:', error);
}

// Health check
app.get('/health', (c) => c.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Root endpoint
app.get('/', (c) => c.json({
  message: 'Stock Management API',
  version: '1.0.0',
  endpoints: {
    articles: '/api/articles',
    clients: '/api/clients',
    suppliers: '/api/suppliers',
    families: '/api/families',
    activite: '/api/activite',
    sales: '/api/sales',
    stock: '/api/stock',
    reports: '/api/reports',
    auth: '/api/auth',
    authReal: '/api/auth-real',
    pdf: '/api/pdf',
    cache: '/api/cache',
    settings: '/api/settings',
    admin: '/api/admin',
    health: '/health'
  }
}));

// Export the app for Vercel/Next.js integration
export default app;

// Only start server if running directly (not imported)
if (import.meta.main) {
  async function main() {
    try {
      console.log("Starting Stock Management Application Backend...");

      // Setup database (DISABLED - using multi-tenant architecture)
      // Les tables sont créées dans les schémas tenants (2025_bu01, etc.) via deploy-complete-system.ts
      console.log("Database setup skipped - using multi-tenant architecture");

      const port = process.env.PORT || 3005;
      console.log(`Server starting on port ${port}...`);

      // Start server
      Bun.serve({
        port,
        fetch: app.fetch,
      });

      console.log(`🚀 Stock Management API is running on http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`📋 API documentation: http://localhost:${port}/`);

    } catch (error) {
      console.error("Failed to start backend:", error);
      process.exit(1);
    }
  }

  main();
}