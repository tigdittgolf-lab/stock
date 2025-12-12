import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';

const stock = new Hono();

// Get stock summary
stock.get('/summary', async (c) => {
  try {
    const { data: articles, error } = await supabaseAdmin
      .from('article')
      .select('stock_f, stock_bl, prix_vente, seuil');

    if (error) throw error;

    const totalArticles = articles.length;
    const totalStockValue = articles.reduce((sum, art) => sum + (art.stock_f * art.prix_vente), 0);
    const totalReservedStock = articles.reduce((sum, art) => sum + art.stock_bl, 0);
    const lowStockCount = articles.filter(art => art.stock_f <= art.seuil).length;
    const outOfStockCount = articles.filter(art => art.stock_f === 0).length;

    return c.json({
      success: true,
      data: {
        total_articles: totalArticles,
        total_stock_value: totalStockValue,
        total_reserved_stock: totalReservedStock,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount
      }
    });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    return c.json({ success: false, error: 'Failed to fetch stock summary' }, 500);
  }
});

// Get low stock alerts
stock.get('/low-stock', async (c) => {
  try {
    // First get all articles
    const { data: articles, error } = await supabaseAdmin
      .from('article')
      .select(`
        narticle,
        designation,
        stock_f,
        stock_bl,
        seuil,
        prix_vente,
        nfournisseur,
        fournisseur:fournisseur(nfournisseur, nom_fournisseur)
      `)
      .order('stock_f', { ascending: true });

    if (error) throw error;

    // Filter articles where stock_f <= seuil
    const lowStockArticles = articles?.filter(article => article.stock_f <= article.seuil) || [];

    return c.json({ success: true, data: lowStockArticles });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return c.json({ success: false, error: 'Failed to fetch low stock alerts' }, 500);
  }
});

// Get stock movements
stock.get('/movements', async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('mouvement_stock')
      .select(`
        *,
        article:article(narticle, designation)
      `)
      .order('date_mouvement', { ascending: false })
      .limit(100);

    if (error) throw error;

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return c.json({ success: false, error: 'Failed to fetch stock movements' }, 500);
  }
});

// Get stock movements by article
stock.get('/movements/:articleId', async (c) => {
  try {
    const articleId = c.req.param('articleId');
    const { data, error } = await supabaseAdmin
      .from('mouvement_stock')
      .select('*')
      .eq('narticle', articleId)
      .order('date_mouvement', { ascending: false });

    if (error) throw error;

    return c.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching article stock movements:', error);
    return c.json({ success: false, error: 'Failed to fetch article stock movements' }, 500);
  }
});

// Create stock entry (manual stock adjustment)
stock.post('/entry', async (c) => {
  try {
    const body = await c.req.json();
    const { narticle, qte, type_mouvement, commentaire } = body;

    // Get current stock
    const { data: article, error: articleError } = await supabaseAdmin
      .from('article')
      .select('stock_f')
      .eq('narticle', narticle)
      .single();

    if (articleError) throw articleError;

    // Calculate new stock
    const newStock = type_mouvement === 'ENTREE' 
      ? article.stock_f + qte 
      : article.stock_f - qte;

    // Update article stock
    const { error: updateError } = await supabaseAdmin
      .from('article')
      .update({ stock_f: newStock })
      .eq('narticle', narticle);

    if (updateError) throw updateError;

    // Create stock movement record
    const { data: movement, error: movementError } = await supabaseAdmin
      .from('mouvement_stock')
      .insert({
        narticle,
        type_mouvement,
        quantite: qte,
        stock_avant: article.stock_f,
        stock_apres: newStock,
        date_mouvement: new Date().toISOString(),
        commentaire
      })
      .select()
      .single();

    if (movementError) throw movementError;

    return c.json({ success: true, data: movement });
  } catch (error) {
    console.error('Error creating stock entry:', error);
    return c.json({ success: false, error: 'Failed to create stock entry' }, 500);
  }
});

// Get stock valuation by family
stock.get('/valuation/by-family', async (c) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('article')
      .select('famille, stock_f, prix_vente, prix_unitaire');

    if (error) throw error;

    const valuationByFamily = data.reduce((acc: any, article) => {
      if (!acc[article.famille]) {
        acc[article.famille] = {
          famille: article.famille,
          total_stock: 0,
          total_value_sale: 0,
          total_value_cost: 0,
          article_count: 0
        };
      }

      acc[article.famille].total_stock += article.stock_f;
      acc[article.famille].total_value_sale += article.stock_f * article.prix_vente;
      acc[article.famille].total_value_cost += article.stock_f * article.prix_unitaire;
      acc[article.famille].article_count += 1;

      return acc;
    }, {});

    return c.json({ success: true, data: Object.values(valuationByFamily) });
  } catch (error) {
    console.error('Error fetching stock valuation:', error);
    return c.json({ success: false, error: 'Failed to fetch stock valuation' }, 500);
  }
});

export default stock;
