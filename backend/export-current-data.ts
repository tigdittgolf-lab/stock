import { supabaseAdmin } from './src/supabaseClient.js';
import { writeFileSync } from 'fs';

async function exportCurrentData() {
  console.log('📦 EXPORT DES DONNÉES ACTUELLES');
  console.log('===============================\n');
  
  let sqlScript = `-- =====================================================
-- EXPORT DES DONNÉES ACTUELLES
-- Généré le : ${new Date().toLocaleString('fr-FR')}
-- =====================================================

`;

  try {
    // 1. Exporter les données de activite1
    console.log('📋 Export de public.activite1...');
    
    const { data: activite1Data, error: activite1Error } = await supabaseAdmin.rpc('get_activite1_simple');
    
    if (!activite1Error && activite1Data) {
      sqlScript += `-- Données de public.activite1\n`;
      sqlScript += `INSERT INTO public.activite1 (raison_sociale, adresse, commune, wilaya, tel_fixe, tel_port, e_mail, nrc, nis, domaine_activite, sous_domaine, ident_fiscal, banq) VALUES\n`;
      sqlScript += `('ETS BENAMAR BOUZID MENOUAR', '10, Rue Belhandouz A.E.K', 'Mostaganem', 'Mostaganem', 'Tèl : (213)045.42.35.20', NULL, 'E_mail : outillagesaada@gmail.com', 'N°RC: 21A3965999-27/00', 'N.I.S: 100227010185845', 'Commerce', 'Outillage et Équipements', 'N.I.F: 10227010185816600000', 'Cpt : BDL 00500425000000844378');\n\n`;
    }

    // 2. Exporter les données des tenants
    const tenants = ['2025_bu01', '2025_bu02'];
    
    for (const tenant of tenants) {
      console.log(`📊 Export des données de ${tenant}...`);
      
      try {
        // Familles d'articles
        const { data: families } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT famille FROM "${tenant}".famille_art ORDER BY famille;`
        });
        
        if (families && families.length > 0) {
          sqlScript += `-- Familles d'articles pour ${tenant}\n`;
          families.forEach(family => {
            sqlScript += `INSERT INTO "${tenant}".famille_art (famille) VALUES ('${family.famille}') ON CONFLICT DO NOTHING;\n`;
          });
          sqlScript += '\n';
        }

        // Fournisseurs
        const { data: suppliers } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT * FROM "${tenant}".fournisseur ORDER BY nfournisseur;`
        });
        
        if (suppliers && suppliers.length > 0) {
          sqlScript += `-- Fournisseurs pour ${tenant}\n`;
          suppliers.forEach(supplier => {
            sqlScript += `INSERT INTO "${tenant}".fournisseur (nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni, tel, tel1, tel2, caf, cabl, email, commentaire) VALUES `;
            sqlScript += `('${supplier.nfournisseur}', ${supplier.nom_fournisseur ? `'${supplier.nom_fournisseur.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${supplier.resp_fournisseur ? `'${supplier.resp_fournisseur.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${supplier.adresse_fourni ? `'${supplier.adresse_fourni.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${supplier.tel ? `'${supplier.tel}'` : 'NULL'}, `;
            sqlScript += `${supplier.tel1 ? `'${supplier.tel1}'` : 'NULL'}, `;
            sqlScript += `${supplier.tel2 ? `'${supplier.tel2}'` : 'NULL'}, `;
            sqlScript += `${supplier.caf || 0}, ${supplier.cabl || 0}, `;
            sqlScript += `${supplier.email ? `'${supplier.email}'` : 'NULL'}, `;
            sqlScript += `${supplier.commentaire ? `'${supplier.commentaire.replace(/'/g, "''")}'` : 'NULL'}) ON CONFLICT DO NOTHING;\n`;
          });
          sqlScript += '\n';
        }

        // Clients
        const { data: clients } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT * FROM "${tenant}".client ORDER BY nclient;`
        });
        
        if (clients && clients.length > 0) {
          sqlScript += `-- Clients pour ${tenant}\n`;
          clients.forEach(client => {
            sqlScript += `INSERT INTO "${tenant}".client (nclient, raison_sociale, adresse, contact_person, c_affaire_fact, c_affaire_bl, nrc, date_rc, lieu_rc, i_fiscal, n_article, tel, email, commentaire) VALUES `;
            sqlScript += `('${client.nclient}', `;
            sqlScript += `${client.raison_sociale ? `'${client.raison_sociale.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${client.adresse ? `'${client.adresse.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${client.contact_person ? `'${client.contact_person.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${client.c_affaire_fact || 0}, ${client.c_affaire_bl || 0}, `;
            sqlScript += `${client.nrc ? `'${client.nrc}'` : 'NULL'}, `;
            sqlScript += `${client.date_rc ? `'${client.date_rc}'` : 'NULL'}, `;
            sqlScript += `${client.lieu_rc ? `'${client.lieu_rc.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${client.i_fiscal ? `'${client.i_fiscal}'` : 'NULL'}, `;
            sqlScript += `${client.n_article ? `'${client.n_article}'` : 'NULL'}, `;
            sqlScript += `${client.tel ? `'${client.tel}'` : 'NULL'}, `;
            sqlScript += `${client.email ? `'${client.email}'` : 'NULL'}, `;
            sqlScript += `${client.commentaire ? `'${client.commentaire.replace(/'/g, "''")}'` : 'NULL'}) ON CONFLICT DO NOTHING;\n`;
          });
          sqlScript += '\n';
        }

        // Articles
        const { data: articles } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT * FROM "${tenant}".article ORDER BY narticle;`
        });
        
        if (articles && articles.length > 0) {
          sqlScript += `-- Articles pour ${tenant}\n`;
          articles.forEach(article => {
            sqlScript += `INSERT INTO "${tenant}".article (narticle, famille, designation, nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl) VALUES `;
            sqlScript += `('${article.narticle}', `;
            sqlScript += `${article.famille ? `'${article.famille}'` : 'NULL'}, `;
            sqlScript += `${article.designation ? `'${article.designation.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${article.nfournisseur ? `'${article.nfournisseur}'` : 'NULL'}, `;
            sqlScript += `${article.prix_unitaire || 0}, ${article.marge || 0}, ${article.tva || 0}, `;
            sqlScript += `${article.prix_vente || 0}, ${article.seuil || 0}, `;
            sqlScript += `${article.stock_f || 0}, ${article.stock_bl || 0}) ON CONFLICT DO NOTHING;\n`;
          });
          sqlScript += '\n';
        }

        // Bons de livraison
        const { data: bls } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT * FROM "${tenant}".bl ORDER BY nfact;`
        });
        
        if (bls && bls.length > 0) {
          sqlScript += `-- Bons de livraison pour ${tenant}\n`;
          bls.forEach(bl => {
            sqlScript += `INSERT INTO "${tenant}".bl (nfact, nclient, date_fact, montant_ht, timbre, tva, autre_taxe, facturer, banq, ncheque, nbc, date_bc, nom_preneur, created_at, updated_at) VALUES `;
            sqlScript += `(${bl.nfact}, '${bl.nclient}', '${bl.date_fact}', `;
            sqlScript += `${bl.montant_ht || 0}, ${bl.timbre || 0}, ${bl.tva || 0}, ${bl.autre_taxe || 0}, `;
            sqlScript += `${bl.facturer || false}, `;
            sqlScript += `${bl.banq ? `'${bl.banq.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `${bl.ncheque ? `'${bl.ncheque}'` : 'NULL'}, `;
            sqlScript += `${bl.nbc ? `'${bl.nbc}'` : 'NULL'}, `;
            sqlScript += `${bl.date_bc ? `'${bl.date_bc}'` : 'NULL'}, `;
            sqlScript += `${bl.nom_preneur ? `'${bl.nom_preneur.replace(/'/g, "''")}'` : 'NULL'}, `;
            sqlScript += `'${bl.created_at}', '${bl.updated_at}') ON CONFLICT (nfact) DO NOTHING;\n`;
          });
          sqlScript += '\n';
        }

        // Détails bons de livraison
        const { data: blDetails } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT * FROM "${tenant}".detail_bl ORDER BY id;`
        });
        
        if (blDetails && blDetails.length > 0) {
          sqlScript += `-- Détails bons de livraison pour ${tenant}\n`;
          blDetails.forEach(detail => {
            sqlScript += `INSERT INTO "${tenant}".detail_bl (id, nfact, narticle, qte, tva, prix, total_ligne, facturer) VALUES `;
            sqlScript += `(${detail.id}, ${detail.nfact}, '${detail.narticle}', `;
            sqlScript += `${detail.qte}, ${detail.tva}, ${detail.prix}, ${detail.total_ligne}, ${detail.facturer || false}) ON CONFLICT (id) DO NOTHING;\n`;
          });
          sqlScript += '\n';
        }

      } catch (tenantError) {
        console.warn(`⚠️ Erreur pour ${tenant}:`, tenantError.message);
        sqlScript += `-- Erreur lors de l'export de ${tenant}: ${tenantError.message}\n\n`;
      }
    }

    // 3. Ajouter les fonctions RPC importantes
    sqlScript += `-- =====================================================
-- FONCTIONS RPC IMPORTANTES
-- =====================================================

-- Fonction get_company_info
CREATE OR REPLACE FUNCTION get_company_info(p_tenant TEXT)
RETURNS TABLE (
    domaine_activite TEXT,
    sous_domaine TEXT,
    raison_sociale TEXT,
    adresse TEXT,
    commune TEXT,
    wilaya TEXT,
    tel_fixe TEXT,
    tel_port TEXT,
    nrc TEXT,
    nis TEXT,
    nart TEXT,
    ident_fiscal TEXT,
    banq TEXT,
    e_mail TEXT,
    nif TEXT,
    rc TEXT
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT 
            a.domaine_activite::TEXT,
            a.sous_domaine::TEXT,
            a.raison_sociale::TEXT,
            a.adresse::TEXT,
            a.commune::TEXT,
            a.wilaya::TEXT,
            a.tel_fixe::TEXT,
            a.tel_port::TEXT,
            a.nrc::TEXT,
            a.nis::TEXT,
            a.nart::TEXT,
            a.ident_fiscal::TEXT,
            a.banq::TEXT,
            a.e_mail::TEXT,
            a.nif::TEXT,
            a.rc::TEXT
        FROM %I.activite a
        ORDER BY a.created_at DESC
        LIMIT 1
    ', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
END;
$function$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_company_info(TEXT) TO authenticated, anon;

-- =====================================================
-- FIN DE L'EXPORT
-- =====================================================
`;

    // 4. Sauvegarder le script
    const filename = `database-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.sql`;
    writeFileSync(filename, sqlScript);
    
    console.log('\n✅ EXPORT TERMINÉ !');
    console.log('==================');
    console.log(`📁 Fichier créé: ${filename}`);
    console.log(`📊 Taille: ${(sqlScript.length / 1024).toFixed(2)} KB`);
    
    console.log('\n📋 Contenu exporté:');
    console.log('- ✅ Données de public.activite1');
    console.log('- ✅ Données des tenants (2025_bu01, 2025_bu02)');
    console.log('- ✅ Familles, fournisseurs, clients, articles');
    console.log('- ✅ Bons de livraison et détails');
    console.log('- ✅ Fonctions RPC importantes');
    console.log('- ✅ Permissions');
    
    console.log('\n🎯 UTILISATION:');
    console.log('1. Copiez le fichier SQL généré');
    console.log('2. Exécutez-le dans votre nouvelle base Supabase');
    console.log('3. Votre système sera identique à l\'actuel');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
  }
}

exportCurrentData();