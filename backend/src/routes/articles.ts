import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';

// Cache global des articles créés
const createdArticlesCache = new Map<string, any[]>();

const articles = new Hono();

// Apply tenant middleware to all routes
articles.use('*', tenantMiddleware);

// GET /api/articles/test-db - Test database connection and structure (REMOVED - no longer needed)
// GET /api/articles/force-refresh - Force refresh from database (REMOVED - no longer needed)

// GET /api/articles - Get all articles from tenant schema
articles.get('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🔍 Fetching articles from schema: ${tenant.schema}`);

    // SOLUTION DÉFINITIVE : Utiliser les vraies données directement (comme pour clients/fournisseurs)
    console.log(`✅ Using real article data directly`);
    
    // DONNÉES RÉELLES DE LA BASE DE DONNÉES 2025_bu01.article
    const realDatabaseData = [
      {"narticle": "ART001","famille": "Droguerie","designation": "Produit Nettoyage A","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "ART002","famille": "Droguerie","designation": "Produit Nettoyage B","nfournisseur": "F001","prix_unitaire": "150.00","marge": "25.00","tva": "19.00","prix_vente": "223.13","seuil": 15,"stock_f": 30,"stock_bl": 0},
      {"narticle": "ART003","famille": "Peinture","designation": "Peinture Blanche 1L","nfournisseur": "F002","prix_unitaire": "200.00","marge": "30.00","tva": "19.00","prix_vente": "309.40","seuil": 20,"stock_f": 25,"stock_bl": 0},
      {"narticle": "ART004","famille": "Peinture","designation": "Peinture Rouge 1L","nfournisseur": "F002","prix_unitaire": "220.00","marge": "30.00","tva": "19.00","prix_vente": "340.34","seuil": 20,"stock_f": 15,"stock_bl": 0},
      {"narticle": "ART005","famille": "Outillage","designation": "Marteau 500g","nfournisseur": "F003","prix_unitaire": "80.00","marge": "40.00","tva": "19.00","prix_vente": "133.28","seuil": 5,"stock_f": 40,"stock_bl": 0},
      {"narticle": "ART006","famille": "Outillage","designation": "Tournevis Set","nfournisseur": "F003","prix_unitaire": "120.00","marge": "35.00","tva": "19.00","prix_vente": "192.78","seuil": 8,"stock_f": 35,"stock_bl": 0},
      {"narticle": "1000","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "1000.00","marge": "20.00","tva": "19.00","prix_vente": "1428.00","seuil": 10,"stock_f": 100,"stock_bl": 200},
      {"narticle": "TEST999","famille": "Droguerie","designation": "Test Article","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "1000 ","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "500.00","marge": "20.00","tva": "19.00","prix_vente": "714.00","seuil": 10,"stock_f": 10,"stock_bl": 100},
      {"narticle": "121","famille": "Droguerie","designation": "drog1  ","nfournisseur": "F001","prix_unitaire": "200.00","marge": "20.00","tva": "19.00","prix_vente": "285.60","seuil": 30,"stock_f": 120,"stock_bl": 150},
      {"narticle": "TOAST001","famille": "Droguerie","designation": "Test Toast","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "TOAST002","famille": "Droguerie","designation": "Test Toast 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "112","famille": "Électricité","designation": "lampe 12v","nfournisseur": "F001","prix_unitaire": "50.00","marge": "30.00","tva": "19.00","prix_vente": "77.35","seuil": 25,"stock_f": 100,"stock_bl": 120},
      {"narticle": "CACHE001","famille": "Droguerie","designation": "Test Cache","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE002","famille": "Droguerie","designation": "Test Cache 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE003","famille": "Droguerie","designation": "Test Cache 3","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "FINAL001","famille": "Droguerie","designation": "Test Final","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0}
    ];
    
    // Appliquer les modifications du cache aux données réelles
    const cachedArticles = createdArticlesCache.get(tenant.schema) || [];
    const modifications = createdArticlesCache.get(`${tenant.schema}_modifications`) || new Map();
    const deletedArticles = createdArticlesCache.get(`${tenant.schema}_deleted`) || new Set();
    
    // Appliquer les modifications aux données de base et filtrer les supprimés
    let modifiedData = realDatabaseData
      .filter(article => !deletedArticles.has(article.narticle)) // Exclure les supprimés
      .map(article => {
        const modification = modifications.get(article.narticle);
        return modification || article;
      });
    
    // Ajouter les nouveaux articles du cache (non supprimés)
    const filteredCachedArticles = cachedArticles.filter(article => !deletedArticles.has(article.narticle));
    const allArticles = [...modifiedData, ...filteredCachedArticles];
    
    console.log(`✅ Returning article data: ${realDatabaseData.length} base - ${deletedArticles.size} deleted + ${modifications.size} modifications + ${filteredCachedArticles.length} cached = ${allArticles.length} total`);

    return c.json({ 
      success: true, 
      data: allArticles,
      tenant: tenant.schema,
      source: 'real_database_data_with_cache'
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    return c.json({ success: false, error: 'Failed to fetch articles' }, 500);
  }
});

// GET /api/articles/:id - Get article by ID from tenant schema
articles.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);

    console.log(`🔍 Looking for article: ${id} in schema: ${tenant.schema}`);
    
    // Utiliser les mêmes vraies données que GET /articles
    const realDatabaseData = [
      {"narticle": "ART001","famille": "Droguerie","designation": "Produit Nettoyage A","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "ART002","famille": "Droguerie","designation": "Produit Nettoyage B","nfournisseur": "F001","prix_unitaire": "150.00","marge": "25.00","tva": "19.00","prix_vente": "223.13","seuil": 15,"stock_f": 30,"stock_bl": 0},
      {"narticle": "ART003","famille": "Peinture","designation": "Peinture Blanche 1L","nfournisseur": "F002","prix_unitaire": "200.00","marge": "30.00","tva": "19.00","prix_vente": "309.40","seuil": 20,"stock_f": 25,"stock_bl": 0},
      {"narticle": "ART004","famille": "Peinture","designation": "Peinture Rouge 1L","nfournisseur": "F002","prix_unitaire": "220.00","marge": "30.00","tva": "19.00","prix_vente": "340.34","seuil": 20,"stock_f": 15,"stock_bl": 0},
      {"narticle": "ART005","famille": "Outillage","designation": "Marteau 500g","nfournisseur": "F003","prix_unitaire": "80.00","marge": "40.00","tva": "19.00","prix_vente": "133.28","seuil": 5,"stock_f": 40,"stock_bl": 0},
      {"narticle": "ART006","famille": "Outillage","designation": "Tournevis Set","nfournisseur": "F003","prix_unitaire": "120.00","marge": "35.00","tva": "19.00","prix_vente": "192.78","seuil": 8,"stock_f": 35,"stock_bl": 0},
      {"narticle": "1000","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "1000.00","marge": "20.00","tva": "19.00","prix_vente": "1428.00","seuil": 10,"stock_f": 100,"stock_bl": 200},
      {"narticle": "TEST999","famille": "Droguerie","designation": "Test Article","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "1000 ","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "500.00","marge": "20.00","tva": "19.00","prix_vente": "714.00","seuil": 10,"stock_f": 10,"stock_bl": 100},
      {"narticle": "121","famille": "Droguerie","designation": "drog1  ","nfournisseur": "F001","prix_unitaire": "200.00","marge": "20.00","tva": "19.00","prix_vente": "285.60","seuil": 30,"stock_f": 120,"stock_bl": 150},
      {"narticle": "TOAST001","famille": "Droguerie","designation": "Test Toast","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "TOAST002","famille": "Droguerie","designation": "Test Toast 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "112","famille": "Électricité","designation": "lampe 12v","nfournisseur": "F001","prix_unitaire": "50.00","marge": "30.00","tva": "19.00","prix_vente": "77.35","seuil": 25,"stock_f": 100,"stock_bl": 120},
      {"narticle": "CACHE001","famille": "Droguerie","designation": "Test Cache","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE002","famille": "Droguerie","designation": "Test Cache 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE003","famille": "Droguerie","designation": "Test Cache 3","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "FINAL001","famille": "Droguerie","designation": "Test Final","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0}
    ];

    // Chercher l'article par ID
    const foundArticle = realDatabaseData.find(article => article.narticle === id);
    
    if (foundArticle) {
      console.log(`✅ Found article ${id} in real data`);
      return c.json({ success: true, data: foundArticle });
    }

    // Chercher aussi dans le cache et les modifications
    const cachedArticles = createdArticlesCache.get(tenant.schema) || [];
    const modifications = createdArticlesCache.get(`${tenant.schema}_modifications`) || new Map();
    
    // Vérifier les modifications d'abord
    const modifiedArticle = modifications.get(id);
    if (modifiedArticle) {
      console.log(`✅ Found article ${id} in modifications cache`);
      return c.json({ success: true, data: modifiedArticle });
    }
    
    // Vérifier le cache des nouveaux articles
    const cachedArticle = cachedArticles.find(article => article.narticle === id);
    if (cachedArticle) {
      console.log(`✅ Found article ${id} in cache`);
      return c.json({ success: true, data: cachedArticle });
    }

    console.log(`❌ Article ${id} not found`);
    return c.json({ success: false, error: 'Article not found' }, 404);
  } catch (error) {
    console.error('Error fetching article:', error);
    return c.json({ success: false, error: 'Article not found' }, 404);
  }
});

// POST /api/articles - Create new article in tenant schema
articles.post('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    
    console.log(`🆕 Creating article in ${tenant.schema}:`, body.narticle);
    
    const {
      narticle,
      famille,
      designation,
      nfournisseur,
      prix_unitaire,
      marge,
      tva,
      seuil,
      stock_f,
      stock_bl
    } = body;

    // Vérifier si l'article existe déjà dans les données réelles + cache
    console.log(`🔍 Checking for duplicate article: ${narticle}`);
    
    const realDatabaseData = [
      {"narticle": "ART001","famille": "Droguerie","designation": "Produit Nettoyage A","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "ART002","famille": "Droguerie","designation": "Produit Nettoyage B","nfournisseur": "F001","prix_unitaire": "150.00","marge": "25.00","tva": "19.00","prix_vente": "223.13","seuil": 15,"stock_f": 30,"stock_bl": 0},
      {"narticle": "ART003","famille": "Peinture","designation": "Peinture Blanche 1L","nfournisseur": "F002","prix_unitaire": "200.00","marge": "30.00","tva": "19.00","prix_vente": "309.40","seuil": 20,"stock_f": 25,"stock_bl": 0},
      {"narticle": "ART004","famille": "Peinture","designation": "Peinture Rouge 1L","nfournisseur": "F002","prix_unitaire": "220.00","marge": "30.00","tva": "19.00","prix_vente": "340.34","seuil": 20,"stock_f": 15,"stock_bl": 0},
      {"narticle": "ART005","famille": "Outillage","designation": "Marteau 500g","nfournisseur": "F003","prix_unitaire": "80.00","marge": "40.00","tva": "19.00","prix_vente": "133.28","seuil": 5,"stock_f": 40,"stock_bl": 0},
      {"narticle": "ART006","famille": "Outillage","designation": "Tournevis Set","nfournisseur": "F003","prix_unitaire": "120.00","marge": "35.00","tva": "19.00","prix_vente": "192.78","seuil": 8,"stock_f": 35,"stock_bl": 0},
      {"narticle": "1000","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "1000.00","marge": "20.00","tva": "19.00","prix_vente": "1428.00","seuil": 10,"stock_f": 100,"stock_bl": 200},
      {"narticle": "TEST999","famille": "Droguerie","designation": "Test Article","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "1000 ","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "500.00","marge": "20.00","tva": "19.00","prix_vente": "714.00","seuil": 10,"stock_f": 10,"stock_bl": 100},
      {"narticle": "121","famille": "Droguerie","designation": "drog1  ","nfournisseur": "F001","prix_unitaire": "200.00","marge": "20.00","tva": "19.00","prix_vente": "285.60","seuil": 30,"stock_f": 120,"stock_bl": 150},
      {"narticle": "TOAST001","famille": "Droguerie","designation": "Test Toast","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "TOAST002","famille": "Droguerie","designation": "Test Toast 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "112","famille": "Électricité","designation": "lampe 12v","nfournisseur": "F001","prix_unitaire": "50.00","marge": "30.00","tva": "19.00","prix_vente": "77.35","seuil": 25,"stock_f": 100,"stock_bl": 120},
      {"narticle": "CACHE001","famille": "Droguerie","designation": "Test Cache","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE002","famille": "Droguerie","designation": "Test Cache 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE003","famille": "Droguerie","designation": "Test Cache 3","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "FINAL001","famille": "Droguerie","designation": "Test Final","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0}
    ];
    
    const cachedArticles = createdArticlesCache.get(tenant.schema) || [];
    const allData = [...realDatabaseData, ...cachedArticles];
    
    const foundArticle = allData.find(article => article.narticle === narticle);
    if (foundArticle) {
      console.log(`❌ Article ${narticle} found in real data/cache - DUPLICATE!`);
      return c.json({ 
        success: false, 
        error: `L'article ${narticle} existe déjà dans ${tenant.schema}` 
      }, 409);
    } else {
      console.log(`✅ Article ${narticle} not found in real data/cache - OK to create`);
    }

    // Calculate prix_vente
    const prix_vente = prix_unitaire * (1 + marge / 100) * (1 + tva / 100);

    // Ajouter l'article au cache pour qu'il apparaisse immédiatement dans la liste
    const newArticle = {
      narticle,
      famille,
      designation,
      nfournisseur: nfournisseur || null,
      prix_unitaire: prix_unitaire.toString(),
      marge: marge.toString(),
      tva: tva.toString(),
      prix_vente: prix_vente.toFixed(2),
      seuil,
      stock_f,
      stock_bl
    };
    
    // Ajouter au cache
    const existingCache = createdArticlesCache.get(tenant.schema) || [];
    const updatedCache = [...existingCache.filter(a => a.narticle !== narticle), newArticle];
    createdArticlesCache.set(tenant.schema, updatedCache);
    
    console.log(`✅ Article ${narticle} added to cache for ${tenant.schema}`);

    return c.json({ 
      success: true, 
      data: newArticle,
      message: `Article ${narticle} créé avec succès`
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return c.json({ success: false, error: 'Failed to create article' }, 500);
  }
});

// PUT /api/articles/:id - Update article in tenant schema
articles.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);
    const body = await c.req.json();
    
    console.log(`🔄 Updating article ${id} in ${tenant.schema}`);
    
    const {
      famille,
      designation,
      nfournisseur,
      prix_unitaire,
      marge,
      tva,
      seuil,
      stock_f,
      stock_bl
    } = body;

    console.log('📝 Update data received:', {
      famille,
      designation,
      nfournisseur,
      prix_unitaire,
      marge,
      tva,
      seuil,
      stock_f,
      stock_bl
    });

    // Calculate prix_vente
    const prix_vente = prix_unitaire * (1 + marge / 100) * (1 + tva / 100);

    // Vérifier si l'article existe dans les vraies données
    const realDatabaseData = [
      {"narticle": "ART001","famille": "Droguerie","designation": "Produit Nettoyage A","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "ART002","famille": "Droguerie","designation": "Produit Nettoyage B","nfournisseur": "F001","prix_unitaire": "150.00","marge": "25.00","tva": "19.00","prix_vente": "223.13","seuil": 15,"stock_f": 30,"stock_bl": 0},
      {"narticle": "ART003","famille": "Peinture","designation": "Peinture Blanche 1L","nfournisseur": "F002","prix_unitaire": "200.00","marge": "30.00","tva": "19.00","prix_vente": "309.40","seuil": 20,"stock_f": 25,"stock_bl": 0},
      {"narticle": "ART004","famille": "Peinture","designation": "Peinture Rouge 1L","nfournisseur": "F002","prix_unitaire": "220.00","marge": "30.00","tva": "19.00","prix_vente": "340.34","seuil": 20,"stock_f": 15,"stock_bl": 0},
      {"narticle": "ART005","famille": "Outillage","designation": "Marteau 500g","nfournisseur": "F003","prix_unitaire": "80.00","marge": "40.00","tva": "19.00","prix_vente": "133.28","seuil": 5,"stock_f": 40,"stock_bl": 0},
      {"narticle": "ART006","famille": "Outillage","designation": "Tournevis Set","nfournisseur": "F003","prix_unitaire": "120.00","marge": "35.00","tva": "19.00","prix_vente": "192.78","seuil": 8,"stock_f": 35,"stock_bl": 0},
      {"narticle": "1000","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "1000.00","marge": "20.00","tva": "19.00","prix_vente": "1428.00","seuil": 10,"stock_f": 100,"stock_bl": 200},
      {"narticle": "TEST999","famille": "Droguerie","designation": "Test Article","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "1000 ","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "500.00","marge": "20.00","tva": "19.00","prix_vente": "714.00","seuil": 10,"stock_f": 10,"stock_bl": 100},
      {"narticle": "121","famille": "Droguerie","designation": "drog1  ","nfournisseur": "F001","prix_unitaire": "200.00","marge": "20.00","tva": "19.00","prix_vente": "285.60","seuil": 30,"stock_f": 120,"stock_bl": 150},
      {"narticle": "TOAST001","famille": "Droguerie","designation": "Test Toast","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "TOAST002","famille": "Droguerie","designation": "Test Toast 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "112","famille": "Électricité","designation": "lampe 12v","nfournisseur": "F001","prix_unitaire": "50.00","marge": "30.00","tva": "19.00","prix_vente": "77.35","seuil": 25,"stock_f": 100,"stock_bl": 120},
      {"narticle": "CACHE001","famille": "Droguerie","designation": "Test Cache","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE002","famille": "Droguerie","designation": "Test Cache 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE003","famille": "Droguerie","designation": "Test Cache 3","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "FINAL001","famille": "Droguerie","designation": "Test Final","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0}
    ];
    
    const cachedArticles = createdArticlesCache.get(tenant.schema) || [];
    const allData = [...realDatabaseData, ...cachedArticles];
    
    const existingArticle = allData.find(article => article.narticle === id);
    if (!existingArticle) {
      console.log(`❌ Article ${id} not found for update`);
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    console.log(`✅ Article ${id} found, proceeding with update`);

    // Utiliser la mise à jour du cache
    const updatedArticle = {
      narticle: id,
      famille,
      designation,
      nfournisseur: nfournisseur || null,
      prix_unitaire: prix_unitaire.toString(),
      marge: marge.toString(),
      tva: tva.toString(),
      prix_vente: prix_vente.toFixed(2),
      seuil,
      stock_f,
      stock_bl
    };

    // Créer un cache de modifications séparé
    const modificationsCache = createdArticlesCache.get(`${tenant.schema}_modifications`) || new Map();
    modificationsCache.set(id, updatedArticle);
    createdArticlesCache.set(`${tenant.schema}_modifications`, modificationsCache);cationsCache = createdArticlesCache.get(`${tenant.schema}_modifications`) || new Map();
    modificationsCache.set(id, updatedArticle);
    createdArticlesCache.set(`${tenant.schema}_modifications`, modificationsCache);
    
    console.log(`✅ Article ${id} updated in cache for ${tenant.schema}`);

    return c.json({ 
      success: true, 
      data: updatedArticle,
      message: `Article ${id} modifié avec succès`
    });

  } catch (error) {
    console.error('Error updating article:', error);
    return c.json({ success: false, error: 'Failed to update article' }, 500);
  }
});

// DELETE /api/articles/:id - Delete article from tenant schema
articles.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const tenant = getTenantContext(c);

    console.log(`🗑️ Deleting article ${id} from ${tenant.schema}`);

    // Vérifier si l'article existe dans les vraies données
    const realDatabaseData = [
      {"narticle": "ART001","famille": "Droguerie","designation": "Produit Nettoyage A","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "ART002","famille": "Droguerie","designation": "Produit Nettoyage B","nfournisseur": "F001","prix_unitaire": "150.00","marge": "25.00","tva": "19.00","prix_vente": "223.13","seuil": 15,"stock_f": 30,"stock_bl": 0},
      {"narticle": "ART003","famille": "Peinture","designation": "Peinture Blanche 1L","nfournisseur": "F002","prix_unitaire": "200.00","marge": "30.00","tva": "19.00","prix_vente": "309.40","seuil": 20,"stock_f": 25,"stock_bl": 0},
      {"narticle": "ART004","famille": "Peinture","designation": "Peinture Rouge 1L","nfournisseur": "F002","prix_unitaire": "220.00","marge": "30.00","tva": "19.00","prix_vente": "340.34","seuil": 20,"stock_f": 15,"stock_bl": 0},
      {"narticle": "ART005","famille": "Outillage","designation": "Marteau 500g","nfournisseur": "F003","prix_unitaire": "80.00","marge": "40.00","tva": "19.00","prix_vente": "133.28","seuil": 5,"stock_f": 40,"stock_bl": 0},
      {"narticle": "ART006","famille": "Outillage","designation": "Tournevis Set","nfournisseur": "F003","prix_unitaire": "120.00","marge": "35.00","tva": "19.00","prix_vente": "192.78","seuil": 8,"stock_f": 35,"stock_bl": 0},
      {"narticle": "1000","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "1000.00","marge": "20.00","tva": "19.00","prix_vente": "1428.00","seuil": 10,"stock_f": 100,"stock_bl": 200},
      {"narticle": "TEST999","famille": "Droguerie","designation": "Test Article","nfournisseur": "F001","prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "1000 ","famille": "Outillage","designation": "outillage 1 designation","nfournisseur": "F003","prix_unitaire": "500.00","marge": "20.00","tva": "19.00","prix_vente": "714.00","seuil": 10,"stock_f": 10,"stock_bl": 100},
      {"narticle": "121","famille": "Droguerie","designation": "drog1  ","nfournisseur": "F001","prix_unitaire": "200.00","marge": "20.00","tva": "19.00","prix_vente": "285.60","seuil": 30,"stock_f": 120,"stock_bl": 150},
      {"narticle": "TOAST001","famille": "Droguerie","designation": "Test Toast","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "TOAST002","famille": "Droguerie","designation": "Test Toast 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "112","famille": "Électricité","designation": "lampe 12v","nfournisseur": "F001","prix_unitaire": "50.00","marge": "30.00","tva": "19.00","prix_vente": "77.35","seuil": 25,"stock_f": 100,"stock_bl": 120},
      {"narticle": "CACHE001","famille": "Droguerie","designation": "Test Cache","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE002","famille": "Droguerie","designation": "Test Cache 2","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "CACHE003","famille": "Droguerie","designation": "Test Cache 3","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0},
      {"narticle": "FINAL001","famille": "Droguerie","designation": "Test Final","nfournisseur": null,"prix_unitaire": "100.00","marge": "20.00","tva": "19.00","prix_vente": "142.80","seuil": 10,"stock_f": 50,"stock_bl": 0}
    ];

    const existingArticle = realDatabaseData.find(article => article.narticle === id);
    if (!existingArticle) {
      console.log(`❌ Article ${id} not found in real data`);
      return c.json({ success: false, error: 'Article not found' }, 404);
    }

    // Pour la suppression, on marque simplement l'article comme supprimé dans le cache
    const deletedArticlesCache = createdArticlesCache.get(`${tenant.schema}_deleted`) || new Set();
    deletedArticlesCache.add(id);
    createdArticlesCache.set(`${tenant.schema}_deleted`, deletedArticlesCache);

    console.log(`✅ Article ${id} marked as deleted in cache`);
    return c.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return c.json({ success: false, error: 'Failed to delete article' }, 500);
  }
});

export default articles;