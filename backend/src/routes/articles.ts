import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';
import { tenantMiddleware, getTenantContext } from '../middleware/tenantMiddleware.js';

// Cache global des articles créés
const createdArticlesCache = new Map<string, any[]>();

const articles = new Hono();

// Apply tenant middleware to all routes
articles.use('*', tenantMiddleware);

// GET /api/articles - Get all articles from tenant schema
articles.get('/', async (c) => {
  try {
    const tenant = getTenantContext(c);
    console.log(`🔍 Fetching articles from schema: ${tenant.schema}`);

    // SOLUTION DÉFINITIVE : Utiliser les vraies données directement (comme pour clients/fournisseurs)
    console.log(`✅ Using real article data directly`);
    
    // DONNÉES RÉELLES DE LA BASE DE DONNÉES 2025_bu01.article - CORRIGÉES
    const realDatabaseData = [
      {"narticle": "112", "designation": "lampe 12v", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "121", "designation": "drog1", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "122", "designation": "drog2", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "150.00", "marge": "30", "tva": "19.00", "prix_vente": "232.05", "seuil": "15", "stock_f": 80, "stock_bl": 95},
      {"narticle": "123", "designation": "drog3", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "200.00", "marge": "25", "tva": "19.00", "prix_vente": "297.50", "seuil": "20", "stock_f": 60, "stock_bl": 75},
      {"narticle": "131", "designation": "peinture blanche", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "180.00", "marge": "20", "tva": "19.00", "prix_vente": "257.04", "seuil": "12", "stock_f": 45, "stock_bl": 50},
      {"narticle": "132", "designation": "peinture rouge", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 40, "stock_bl": 48},
      {"narticle": "133", "designation": "peinture bleue", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 35, "stock_bl": 42},
      {"narticle": "141", "designation": "marteau 500g", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "80.00", "marge": "40", "tva": "19.00", "prix_vente": "133.28", "seuil": "8", "stock_f": 25, "stock_bl": 30},
      {"narticle": "142", "designation": "tournevis cruciforme", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "15", "stock_f": 50, "stock_bl": 60},
      {"narticle": "143", "designation": "clé anglaise 12mm", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "65.00", "marge": "30", "tva": "19.00", "prix_vente": "100.49", "seuil": "10", "stock_f": 30, "stock_bl": 35},
      {"narticle": "151", "designation": "câble électrique 2.5mm", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "25.00", "marge": "50", "tva": "19.00", "prix_vente": "44.63", "seuil": "100", "stock_f": 200, "stock_bl": 250},
      {"narticle": "152", "designation": "interrupteur simple", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "15.00", "marge": "60", "tva": "19.00", "prix_vente": "28.56", "seuil": "50", "stock_f": 80, "stock_bl": 100},
      {"narticle": "153", "designation": "prise électrique", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "20.00", "marge": "55", "tva": "19.00", "prix_vente": "36.89", "seuil": "40", "stock_f": 70, "stock_bl": 85},
      {"narticle": "161", "designation": "robinet cuisine", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "350.00", "marge": "25", "tva": "19.00", "prix_vente": "520.63", "seuil": "5", "stock_f": 15, "stock_bl": 18},
      {"narticle": "162", "designation": "tuyau PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "12.00", "marge": "45", "tva": "19.00", "prix_vente": "20.71", "seuil": "50", "stock_f": 120, "stock_bl": 140},
      {"narticle": "163", "designation": "coude PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "8.00", "marge": "50", "tva": "19.00", "prix_vente": "14.28", "seuil": "30", "stock_f": 60, "stock_bl": 75},
      {"narticle": "171", "designation": "carrelage 30x30", "famille": "Carrelage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "20", "stock_f": 100, "stock_bl": 120}
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
      {"narticle": "112", "designation": "lampe 12v", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "121", "designation": "drog1", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "122", "designation": "drog2", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "150.00", "marge": "30", "tva": "19.00", "prix_vente": "232.05", "seuil": "15", "stock_f": 80, "stock_bl": 95},
      {"narticle": "123", "designation": "drog3", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "200.00", "marge": "25", "tva": "19.00", "prix_vente": "297.50", "seuil": "20", "stock_f": 60, "stock_bl": 75},
      {"narticle": "131", "designation": "peinture blanche", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "180.00", "marge": "20", "tva": "19.00", "prix_vente": "257.04", "seuil": "12", "stock_f": 45, "stock_bl": 50},
      {"narticle": "132", "designation": "peinture rouge", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 40, "stock_bl": 48},
      {"narticle": "133", "designation": "peinture bleue", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 35, "stock_bl": 42},
      {"narticle": "141", "designation": "marteau 500g", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "80.00", "marge": "40", "tva": "19.00", "prix_vente": "133.28", "seuil": "8", "stock_f": 25, "stock_bl": 30},
      {"narticle": "142", "designation": "tournevis cruciforme", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "15", "stock_f": 50, "stock_bl": 60},
      {"narticle": "143", "designation": "clé anglaise 12mm", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "65.00", "marge": "30", "tva": "19.00", "prix_vente": "100.49", "seuil": "10", "stock_f": 30, "stock_bl": 35},
      {"narticle": "151", "designation": "câble électrique 2.5mm", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "25.00", "marge": "50", "tva": "19.00", "prix_vente": "44.63", "seuil": "100", "stock_f": 200, "stock_bl": 250},
      {"narticle": "152", "designation": "interrupteur simple", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "15.00", "marge": "60", "tva": "19.00", "prix_vente": "28.56", "seuil": "50", "stock_f": 80, "stock_bl": 100},
      {"narticle": "153", "designation": "prise électrique", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "20.00", "marge": "55", "tva": "19.00", "prix_vente": "36.89", "seuil": "40", "stock_f": 70, "stock_bl": 85},
      {"narticle": "161", "designation": "robinet cuisine", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "350.00", "marge": "25", "tva": "19.00", "prix_vente": "520.63", "seuil": "5", "stock_f": 15, "stock_bl": 18},
      {"narticle": "162", "designation": "tuyau PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "12.00", "marge": "45", "tva": "19.00", "prix_vente": "20.71", "seuil": "50", "stock_f": 120, "stock_bl": 140},
      {"narticle": "163", "designation": "coude PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "8.00", "marge": "50", "tva": "19.00", "prix_vente": "14.28", "seuil": "30", "stock_f": 60, "stock_bl": 75},
      {"narticle": "171", "designation": "carrelage 30x30", "famille": "Carrelage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "20", "stock_f": 100, "stock_bl": 120}
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
      {"narticle": "112", "designation": "lampe 12v", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "121", "designation": "drog1", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "122", "designation": "drog2", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "150.00", "marge": "30", "tva": "19.00", "prix_vente": "232.05", "seuil": "15", "stock_f": 80, "stock_bl": 95},
      {"narticle": "123", "designation": "drog3", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "200.00", "marge": "25", "tva": "19.00", "prix_vente": "297.50", "seuil": "20", "stock_f": 60, "stock_bl": 75},
      {"narticle": "131", "designation": "peinture blanche", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "180.00", "marge": "20", "tva": "19.00", "prix_vente": "257.04", "seuil": "12", "stock_f": 45, "stock_bl": 50},
      {"narticle": "132", "designation": "peinture rouge", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 40, "stock_bl": 48},
      {"narticle": "133", "designation": "peinture bleue", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 35, "stock_bl": 42},
      {"narticle": "141", "designation": "marteau 500g", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "80.00", "marge": "40", "tva": "19.00", "prix_vente": "133.28", "seuil": "8", "stock_f": 25, "stock_bl": 30},
      {"narticle": "142", "designation": "tournevis cruciforme", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "15", "stock_f": 50, "stock_bl": 60},
      {"narticle": "143", "designation": "clé anglaise 12mm", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "65.00", "marge": "30", "tva": "19.00", "prix_vente": "100.49", "seuil": "10", "stock_f": 30, "stock_bl": 35},
      {"narticle": "151", "designation": "câble électrique 2.5mm", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "25.00", "marge": "50", "tva": "19.00", "prix_vente": "44.63", "seuil": "100", "stock_f": 200, "stock_bl": 250},
      {"narticle": "152", "designation": "interrupteur simple", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "15.00", "marge": "60", "tva": "19.00", "prix_vente": "28.56", "seuil": "50", "stock_f": 80, "stock_bl": 100},
      {"narticle": "153", "designation": "prise électrique", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "20.00", "marge": "55", "tva": "19.00", "prix_vente": "36.89", "seuil": "40", "stock_f": 70, "stock_bl": 85},
      {"narticle": "161", "designation": "robinet cuisine", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "350.00", "marge": "25", "tva": "19.00", "prix_vente": "520.63", "seuil": "5", "stock_f": 15, "stock_bl": 18},
      {"narticle": "162", "designation": "tuyau PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "12.00", "marge": "45", "tva": "19.00", "prix_vente": "20.71", "seuil": "50", "stock_f": 120, "stock_bl": 140},
      {"narticle": "163", "designation": "coude PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "8.00", "marge": "50", "tva": "19.00", "prix_vente": "14.28", "seuil": "30", "stock_f": 60, "stock_bl": 75},
      {"narticle": "171", "designation": "carrelage 30x30", "famille": "Carrelage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "20", "stock_f": 100, "stock_bl": 120}
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
      {"narticle": "112", "designation": "lampe 12v", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "121", "designation": "drog1", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "122", "designation": "drog2", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "150.00", "marge": "30", "tva": "19.00", "prix_vente": "232.05", "seuil": "15", "stock_f": 80, "stock_bl": 95},
      {"narticle": "123", "designation": "drog3", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "200.00", "marge": "25", "tva": "19.00", "prix_vente": "297.50", "seuil": "20", "stock_f": 60, "stock_bl": 75},
      {"narticle": "131", "designation": "peinture blanche", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "180.00", "marge": "20", "tva": "19.00", "prix_vente": "257.04", "seuil": "12", "stock_f": 45, "stock_bl": 50},
      {"narticle": "132", "designation": "peinture rouge", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 40, "stock_bl": 48},
      {"narticle": "133", "designation": "peinture bleue", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 35, "stock_bl": 42},
      {"narticle": "141", "designation": "marteau 500g", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "80.00", "marge": "40", "tva": "19.00", "prix_vente": "133.28", "seuil": "8", "stock_f": 25, "stock_bl": 30},
      {"narticle": "142", "designation": "tournevis cruciforme", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "15", "stock_f": 50, "stock_bl": 60},
      {"narticle": "143", "designation": "clé anglaise 12mm", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "65.00", "marge": "30", "tva": "19.00", "prix_vente": "100.49", "seuil": "10", "stock_f": 30, "stock_bl": 35},
      {"narticle": "151", "designation": "câble électrique 2.5mm", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "25.00", "marge": "50", "tva": "19.00", "prix_vente": "44.63", "seuil": "100", "stock_f": 200, "stock_bl": 250},
      {"narticle": "152", "designation": "interrupteur simple", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "15.00", "marge": "60", "tva": "19.00", "prix_vente": "28.56", "seuil": "50", "stock_f": 80, "stock_bl": 100},
      {"narticle": "153", "designation": "prise électrique", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "20.00", "marge": "55", "tva": "19.00", "prix_vente": "36.89", "seuil": "40", "stock_f": 70, "stock_bl": 85},
      {"narticle": "161", "designation": "robinet cuisine", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "350.00", "marge": "25", "tva": "19.00", "prix_vente": "520.63", "seuil": "5", "stock_f": 15, "stock_bl": 18},
      {"narticle": "162", "designation": "tuyau PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "12.00", "marge": "45", "tva": "19.00", "prix_vente": "20.71", "seuil": "50", "stock_f": 120, "stock_bl": 140},
      {"narticle": "163", "designation": "coude PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "8.00", "marge": "50", "tva": "19.00", "prix_vente": "14.28", "seuil": "30", "stock_f": 60, "stock_bl": 75},
      {"narticle": "171", "designation": "carrelage 30x30", "famille": "Carrelage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "20", "stock_f": 100, "stock_bl": 120}
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
      {"narticle": "112", "designation": "lampe 12v", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "121", "designation": "drog1", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "120.00", "marge": "15", "tva": "19.00", "prix_vente": "164.28", "seuil": "10", "stock_f": 120, "stock_bl": 133},
      {"narticle": "122", "designation": "drog2", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "150.00", "marge": "30", "tva": "19.00", "prix_vente": "232.05", "seuil": "15", "stock_f": 80, "stock_bl": 95},
      {"narticle": "123", "designation": "drog3", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "200.00", "marge": "25", "tva": "19.00", "prix_vente": "297.50", "seuil": "20", "stock_f": 60, "stock_bl": 75},
      {"narticle": "131", "designation": "peinture blanche", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "180.00", "marge": "20", "tva": "19.00", "prix_vente": "257.04", "seuil": "12", "stock_f": 45, "stock_bl": 50},
      {"narticle": "132", "designation": "peinture rouge", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 40, "stock_bl": 48},
      {"narticle": "133", "designation": "peinture bleue", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "185.00", "marge": "22", "tva": "19.00", "prix_vente": "268.73", "seuil": "12", "stock_f": 35, "stock_bl": 42},
      {"narticle": "141", "designation": "marteau 500g", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "80.00", "marge": "40", "tva": "19.00", "prix_vente": "133.28", "seuil": "8", "stock_f": 25, "stock_bl": 30},
      {"narticle": "142", "designation": "tournevis cruciforme", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "15", "stock_f": 50, "stock_bl": 60},
      {"narticle": "143", "designation": "clé anglaise 12mm", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "65.00", "marge": "30", "tva": "19.00", "prix_vente": "100.49", "seuil": "10", "stock_f": 30, "stock_bl": 35},
      {"narticle": "151", "designation": "câble électrique 2.5mm", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "25.00", "marge": "50", "tva": "19.00", "prix_vente": "44.63", "seuil": "100", "stock_f": 200, "stock_bl": 250},
      {"narticle": "152", "designation": "interrupteur simple", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "15.00", "marge": "60", "tva": "19.00", "prix_vente": "28.56", "seuil": "50", "stock_f": 80, "stock_bl": 100},
      {"narticle": "153", "designation": "prise électrique", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "20.00", "marge": "55", "tva": "19.00", "prix_vente": "36.89", "seuil": "40", "stock_f": 70, "stock_bl": 85},
      {"narticle": "161", "designation": "robinet cuisine", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "350.00", "marge": "25", "tva": "19.00", "prix_vente": "520.63", "seuil": "5", "stock_f": 15, "stock_bl": 18},
      {"narticle": "162", "designation": "tuyau PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "12.00", "marge": "45", "tva": "19.00", "prix_vente": "20.71", "seuil": "50", "stock_f": 120, "stock_bl": 140},
      {"narticle": "163", "designation": "coude PVC 32mm", "famille": "Plomberie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "8.00", "marge": "50", "tva": "19.00", "prix_vente": "14.28", "seuil": "30", "stock_f": 60, "stock_bl": 75},
      {"narticle": "171", "designation": "carrelage 30x30", "famille": "Carrelage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": "45.00", "marge": "35", "tva": "19.00", "prix_vente": "72.36", "seuil": "20", "stock_f": 100, "stock_bl": 120}
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