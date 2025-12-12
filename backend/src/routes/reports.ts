import { Hono } from 'hono';
import { supabaseAdmin } from '../supabaseClient.js';

const reports = new Hono();

// Sales report by period
reports.get('/sales/period', async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    if (!startDate || !endDate) {
      return c.json({ success: false, error: 'start_date and end_date are required' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('fact')
      .select(`
        nfact,
        date_fact,
        nclient,
        montant_ht,
        tva,
        timbre,
        autre_taxe,
        client:client(nclient, raison_sociale)
      `)
      .gte('date_fact', startDate)
      .lte('date_fact', endDate)
      .order('date_fact', { ascending: false });

    if (error) throw error;

    const totalHT = data.reduce((sum, inv) => sum + inv.montant_ht, 0);
    const totalTVA = data.reduce((sum, inv) => sum + inv.tva, 0);
    const totalTTC = data.reduce((sum, inv) => sum + (inv.montant_ht + inv.tva + inv.timbre + inv.autre_taxe), 0);

    return c.json({
      success: true,
      data: {
        invoices: data,
        summary: {
          count: data.length,
          total_ht: totalHT,
          total_tva: totalTVA,
          total_ttc: totalTTC
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return c.json({ success: false, error: 'Failed to fetch sales report' }, 500);
  }
});

// Sales report by client
reports.get('/sales/by-client', async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const query = supabaseAdmin
      .from('fact')
      .select(`
        nclient,
        montant_ht,
        tva,
        timbre,
        autre_taxe,
        client:client(nclient, raison_sociale)
      `);

    if (startDate) query.gte('date_fact', startDate);
    if (endDate) query.lte('date_fact', endDate);

    const { data, error } = await query;

    if (error) throw error;

    const salesByClient = data.reduce((acc: any, inv) => {
      const clientId = inv.nclient;
      if (!acc[clientId]) {
        acc[clientId] = {
          client_id: clientId,
          client_name: inv.client?.raison_sociale || 'Unknown',
          invoice_count: 0,
          total_ht: 0,
          total_tva: 0,
          total_ttc: 0
        };
      }

      acc[clientId].invoice_count += 1;
      acc[clientId].total_ht += inv.montant_ht;
      acc[clientId].total_tva += inv.tva;
      acc[clientId].total_ttc += inv.montant_ht + inv.tva + inv.timbre + inv.autre_taxe;

      return acc;
    }, {});

    return c.json({ success: true, data: Object.values(salesByClient) });
  } catch (error) {
    console.error('Error fetching sales by client:', error);
    return c.json({ success: false, error: 'Failed to fetch sales by client' }, 500);
  }
});

// Sales report by article
reports.get('/sales/by-article', async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const query = supabaseAdmin
      .from('detail_fact')
      .select(`
        narticle,
        qte,
        prix,
        total_ligne,
        fact:fact!inner(date_fact),
        article:article(narticle, designation)
      `);

    if (startDate) query.gte('fact.date_fact', startDate);
    if (endDate) query.lte('fact.date_fact', endDate);

    const { data, error } = await query;

    if (error) throw error;

    const salesByArticle = data.reduce((acc: any, detail) => {
      const articleId = detail.narticle;
      if (!acc[articleId]) {
        acc[articleId] = {
          article_id: articleId,
          article_name: detail.article?.designation || 'Unknown',
          quantity_sold: 0,
          total_sales: 0
        };
      }

      acc[articleId].quantity_sold += detail.qte;
      acc[articleId].total_sales += detail.total_ligne;

      return acc;
    }, {});

    return c.json({ success: true, data: Object.values(salesByArticle) });
  } catch (error) {
    console.error('Error fetching sales by article:', error);
    return c.json({ success: false, error: 'Failed to fetch sales by article' }, 500);
  }
});

// Purchase report by period
reports.get('/purchases/period', async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    if (!startDate || !endDate) {
      return c.json({ success: false, error: 'start_date and end_date are required' }, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('fachat')
      .select(`
        nfact,
        date_fact,
        nfournisseur,
        montant_ht,
        tva,
        timbre,
        autre_taxe,
        fournisseur:fournisseur(nfournisseur, nom_fournisseur)
      `)
      .gte('date_fact', startDate)
      .lte('date_fact', endDate)
      .order('date_fact', { ascending: false });

    if (error) throw error;

    const totalHT = data.reduce((sum, inv) => sum + inv.montant_ht, 0);
    const totalTVA = data.reduce((sum, inv) => sum + inv.tva, 0);
    const totalTTC = data.reduce((sum, inv) => sum + (inv.montant_ht + inv.tva + inv.timbre + inv.autre_taxe), 0);

    return c.json({
      success: true,
      data: {
        invoices: data,
        summary: {
          count: data.length,
          total_ht: totalHT,
          total_tva: totalTVA,
          total_ttc: totalTTC
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchase report:', error);
    return c.json({ success: false, error: 'Failed to fetch purchase report' }, 500);
  }
});

// Profit margin report
reports.get('/profit-margin', async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const query = supabaseAdmin
      .from('detail_fact')
      .select(`
        narticle,
        qte,
        prix,
        pr_achat,
        total_ligne,
        fact:fact!inner(date_fact),
        article:article(narticle, designation)
      `);

    if (startDate) query.gte('fact.date_fact', startDate);
    if (endDate) query.lte('fact.date_fact', endDate);

    const { data, error } = await query;

    if (error) throw error;

    const profitByArticle = data.map(detail => {
      const costPrice = detail.pr_achat * detail.qte;
      const salePrice = detail.total_ligne;
      const profit = salePrice - costPrice;
      const marginPercent = costPrice > 0 ? (profit / costPrice) * 100 : 0;

      return {
        article_id: detail.narticle,
        article_name: detail.article?.designation || 'Unknown',
        quantity: detail.qte,
        cost_price: costPrice,
        sale_price: salePrice,
        profit,
        margin_percent: marginPercent
      };
    });

    const totalProfit = profitByArticle.reduce((sum, item) => sum + item.profit, 0);
    const totalCost = profitByArticle.reduce((sum, item) => sum + item.cost_price, 0);
    const totalSales = profitByArticle.reduce((sum, item) => sum + item.sale_price, 0);
    const overallMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return c.json({
      success: true,
      data: {
        details: profitByArticle,
        summary: {
          total_cost: totalCost,
          total_sales: totalSales,
          total_profit: totalProfit,
          overall_margin_percent: overallMargin
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profit margin report:', error);
    return c.json({ success: false, error: 'Failed to fetch profit margin report' }, 500);
  }
});

// Top selling articles
reports.get('/top-articles', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    const query = supabaseAdmin
      .from('detail_fact')
      .select(`
        narticle,
        qte,
        total_ligne,
        fact:fact!inner(date_fact),
        article:article(narticle, designation)
      `);

    if (startDate) query.gte('fact.date_fact', startDate);
    if (endDate) query.lte('fact.date_fact', endDate);

    const { data, error } = await query;

    if (error) throw error;

    const articleSales = data.reduce((acc: any, detail) => {
      const articleId = detail.narticle;
      if (!acc[articleId]) {
        acc[articleId] = {
          article_id: articleId,
          article_name: detail.article?.designation || 'Unknown',
          total_quantity: 0,
          total_revenue: 0
        };
      }

      acc[articleId].total_quantity += detail.qte;
      acc[articleId].total_revenue += detail.total_ligne;

      return acc;
    }, {});

    const topArticles = Object.values(articleSales)
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return c.json({ success: true, data: topArticles });
  } catch (error) {
    console.error('Error fetching top articles:', error);
    return c.json({ success: false, error: 'Failed to fetch top articles' }, 500);
  }
});

export default reports;
