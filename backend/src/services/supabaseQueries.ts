import { supabaseAdmin } from '../supabaseClient.js';

/**
 * Supabase queries with correct column names matching MySQL-migrated schemas
 */

export async function getArticlesFromSupabase(tenant: string): Promise<any> {
  try {
    const sqlQuery = `SELECT * FROM "${tenant}".article ORDER BY "Narticle" ASC;`;
    console.log(`🔍 [SQ] Fetching articles from Supabase schema: ${tenant}`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlQuery
    });

    if (!error && data && data.length > 0) {
      console.log(`✅ [SQ] Found ${data.length} articles in ${tenant}.article`);
      
      const normalizedData = data.map((article: any) => ({
        narticle: article.Narticle || article.narticle,
        famille: article.famille || article.Famille,
        designation: article.designation || article.Designation,
        nfournisseur: article.Nfournisseur || article.nfournisseur,
        prix_unitaire: article.prix_unitaire || article.Prix_unitaire,
        marge: article.marge || article.Marge,
        tva: article.TVA || article.tva,
        prix_vente: article.prix_vente || article.Prix_vente,
        seuil: article.seuil || article.Seuil,
        stock_f: article.stock_f || article.Stock_f,
        stock_bl: article.stock_bl || article.Stock_bl
      }));
      
      return { success: true, data: normalizedData };
    }

    console.log(`⚠️ [SQ] No articles found in ${tenant}.article:`, error?.message);
    return { success: true, data: [] };
  } catch (error) {
    console.error(`❌ [SQ] Error fetching articles:`, error);
    return { success: true, data: [] };
  }
}

export async function getClientsFromSupabase(tenant: string): Promise<any> {
  try {
    const sqlQuery = `SELECT * FROM "${tenant}".client ORDER BY "Nclient" ASC;`;
    console.log(`🔍 [SQ] Fetching clients from Supabase schema: ${tenant}`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlQuery
    });

    if (!error && data && data.length > 0) {
      console.log(`✅ [SQ] Found ${data.length} clients in ${tenant}.client`);
      
      // Map real MySQL column names (case-insensitive fallback)
      const normalizedData = data.map((client: any) => ({
        nclient: client.Nclient || client.nclient,
        raison_sociale: client.Raison_sociale || client.raison_sociale,
        adresse: client.adresse || client.Adresse,
        contact_person: client.contact_person || client.Contact_person,
        tel: client.Tel || client.tel,
        email: client.email || client.Email,
        nrc: client.NRC || client.nrc,
        date_rc: client.Date_RC || client.date_rc,
        lieu_rc: client.Lieu_RC || client.lieu_rc,
        i_fiscal: client.I_Fiscal || client.i_fiscal,
        n_article: client.N_article || client.n_article,
        c_affaire_fact: client.C_affaire_fact || client.c_affaire_fact,
        c_affaire_bl: client.C_affaire_bl || client.c_affaire_bl,
        commentaire: client.Commentaire || client.commentaire
      }));
      
      return { success: true, data: normalizedData };
    }

    console.log(`⚠️ [SQ] No clients found in ${tenant}.client:`, error?.message);
    return { success: true, data: [] };
  } catch (error) {
    console.error(`❌ [SQ] Error fetching clients:`, error);
    return { success: true, data: [] };
  }
}

export async function getSuppliersFromSupabase(tenant: string): Promise<any> {
  try {
    const sqlQuery = `SELECT * FROM "${tenant}".fournisseur ORDER BY nfournisseur ASC;`;
    console.log(`🔍 [SQ] Fetching suppliers from Supabase schema: ${tenant}`);
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlQuery
    });

    if (!error && data && data.length > 0) {
      console.log(`✅ [SQ] Found ${data.length} suppliers in ${tenant}.fournisseur`);
      
      // Map real MySQL column names for fournisseur table
      const normalizedData = data.map((supplier: any) => ({
        nfournisseur: supplier.Nfournisseur || supplier.nfournisseur,
        nom_fournisseur: supplier.nom_fournisseur || supplier.Nom_fournisseur,
        resp_fournisseur: supplier.resp_fournisseur || supplier.Resp_fournisseur,
        adresse_fourni: supplier.adresse_fourni || supplier.Adresse_fourni,
        tel: supplier.tel || supplier.Tel,
        tel1: supplier.tel1 || supplier.Tel1,
        tel2: supplier.tel2 || supplier.Tel2,
        caf: supplier.caf || supplier.CAF,
        cabl: supplier.cabl || supplier.CABL,
        email: supplier.email || supplier.Email,
        commentaire: supplier.commentaire || supplier.Commentaire
      }));
      
      return { success: true, data: normalizedData };
    }

    console.log(`⚠️ [SQ] No suppliers found in ${tenant}.fournisseur:`, error?.message);
    return { success: true, data: [] };
  } catch (error) {
    console.error(`❌ [SQ] Error fetching suppliers:`, error);
    return { success: true, data: [] };
  }
}
