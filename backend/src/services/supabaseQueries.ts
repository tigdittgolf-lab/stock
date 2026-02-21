import { supabaseAdmin } from '../supabaseClient.js';

/**
 * NEW FILE - Supabase queries with uppercase column names for MySQL-migrated schemas
 * Created to bypass Bun caching issues
 */

export async function getArticlesFromSupabase(tenant: string): Promise<any> {
  try {
    const sqlQuery = `SELECT * FROM "${tenant}".article ORDER BY "Narticle" ASC;`;
    console.log(`🔍 [NEW] Fetching articles from Supabase schema: ${tenant}`);
    console.log(`📝 [NEW] SQL Query: ${sqlQuery}`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlQuery
    });

    if (!error && data && data.length > 0) {
      console.log(`✅ [NEW] Found ${data.length} articles in ${tenant}.article`);
      
      // Normaliser les noms de colonnes en minuscules pour le frontend
      const normalizedData = data.map((article: any) => ({
        narticle: article.Narticle || article.narticle,
        famille: article.famille,
        designation: article.designation,
        nfournisseur: article.Nfournisseur || article.nfournisseur,
        prix_unitaire: article.prix_unitaire,
        marge: article.marge,
        tva: article.tva,
        prix_vente: article.prix_vente,
        seuil: article.seuil,
        stock_f: article.stock_f,
        stock_bl: article.stock_bl
      }));
      
      return { success: true, data: normalizedData };
    }

    console.log(`⚠️ [NEW] No articles found in ${tenant}.article:`, error?.message);
    return { success: true, data: [] };
  } catch (error) {
    console.error(`❌ [NEW] Error fetching articles:`, error);
    return { success: true, data: [] };
  }
}

export async function getClientsFromSupabase(tenant: string): Promise<any> {
  try {
    const sqlQuery = `SELECT * FROM "${tenant}".client ORDER BY "Nclient" ASC;`;
    console.log(`🔍 [NEW] Fetching clients from Supabase schema: ${tenant}`);
    console.log(`📝 [NEW] SQL Query: ${sqlQuery}`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlQuery
    });

    if (!error && data && data.length > 0) {
      console.log(`✅ [NEW] Found ${data.length} clients in ${tenant}.client`);
      
      // Normaliser les noms de colonnes en minuscules pour le frontend
      const normalizedData = data.map((client: any) => ({
        nclient: client.Nclient || client.nclient,
        nom: client.nom,
        raison_sociale: client.raison_sociale,
        adresse: client.adresse,
        telephone: client.telephone,
        nif: client.nif,
        nis: client.nis,
        rc: client.rc,
        article: client.article
      }));
      
      return { success: true, data: normalizedData };
    }

    console.log(`⚠️ [NEW] No clients found in ${tenant}.client:`, error?.message);
    return { success: true, data: [] };
  } catch (error) {
    console.error(`❌ [NEW] Error fetching clients:`, error);
    return { success: true, data: [] };
  }
}

export async function getSuppliersFromSupabase(tenant: string): Promise<any> {
  try {
    const sqlQuery = `SELECT * FROM "${tenant}".fournisseur ORDER BY "Nfournisseur" ASC;`;
    console.log(`🔍 [NEW] Fetching suppliers from Supabase schema: ${tenant}`);
    console.log(`📝 [NEW] SQL Query: ${sqlQuery}`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlQuery
    });

    if (!error && data && data.length > 0) {
      console.log(`✅ [NEW] Found ${data.length} suppliers in ${tenant}.fournisseur`);
      
      // Normaliser les noms de colonnes en minuscules pour le frontend
      const normalizedData = data.map((supplier: any) => ({
        nfournisseur: supplier.Nfournisseur || supplier.nfournisseur,
        nom: supplier.nom,
        raison_sociale: supplier.raison_sociale,
        adresse: supplier.adresse,
        telephone: supplier.telephone,
        nif: supplier.nif,
        nis: supplier.nis,
        rc: supplier.rc,
        article: supplier.article
      }));
      
      return { success: true, data: normalizedData };
    }

    console.log(`⚠️ [NEW] No suppliers found in ${tenant}.fournisseur:`, error?.message);
    
    // Try supplier table
    const sqlQuery2 = `SELECT * FROM "${tenant}".supplier ORDER BY "Nfournisseur" ASC;`;
    const { data: data2, error: error2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlQuery2
    });

    if (!error2 && data2 && data2.length > 0) {
      console.log(`✅ [NEW] Found ${data2.length} suppliers in ${tenant}.supplier`);
      
      const normalizedData = data2.map((supplier: any) => ({
        nfournisseur: supplier.Nfournisseur || supplier.nfournisseur,
        nom: supplier.nom,
        raison_sociale: supplier.raison_sociale,
        adresse: supplier.adresse,
        telephone: supplier.telephone,
        nif: supplier.nif,
        nis: supplier.nis,
        rc: supplier.rc,
        article: supplier.article
      }));
      
      return { success: true, data: normalizedData };
    }

    console.log(`❌ [NEW] No supplier table found in ${tenant}`);
    return { success: true, data: [] };
  } catch (error) {
    console.error(`❌ [NEW] Error fetching suppliers:`, error);
    return { success: true, data: [] };
  }
}
