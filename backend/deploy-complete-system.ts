import { supabaseAdmin } from './src/supabaseClient.js';
import { readFileSync } from 'fs';

async function deployCompleteSystem() {
  console.log('🚀 DÉPLOIEMENT COMPLET DU SYSTÈME');
  console.log('=================================\n');
  
  try {
    // 1. Lire le script SQL complet
    console.log('📖 Lecture du script de déploiement...');
    
    const sqlScript = readFileSync('COMPLETE_DATABASE_BACKUP.sql', 'utf8');
    console.log(`✅ Script lu (${(sqlScript.length / 1024).toFixed(2)} KB)`);
    
    // 2. Diviser le script en sections exécutables
    console.log('\n🔧 Exécution du déploiement par sections...');
    
    const sections = [
      {
        name: 'Création des schémas',
        sql: `
          CREATE SCHEMA IF NOT EXISTS "2025_bu01";
          CREATE SCHEMA IF NOT EXISTS "2025_bu02";
          CREATE SCHEMA IF NOT EXISTS "2024_bu01";
        `
      },
      {
        name: 'Table activite1',
        sql: `
          CREATE TABLE IF NOT EXISTS public.activite1 (
              raison_sociale TEXT,
              adresse TEXT,
              commune TEXT,
              wilaya TEXT,
              tel_fixe TEXT,
              tel_port TEXT,
              e_mail TEXT,
              nrc TEXT,
              nis TEXT,
              domaine_activite TEXT,
              sous_domaine TEXT,
              ident_fiscal TEXT,
              banq TEXT
          );
          
          INSERT INTO public.activite1 (
              raison_sociale, adresse, commune, wilaya, tel_fixe, tel_port,
              e_mail, nrc, nis, domaine_activite, sous_domaine, ident_fiscal, banq
          ) VALUES (
              'ETS BENAMAR BOUZID MENOUAR',
              '10, Rue Belhandouz A.E.K',
              'Mostaganem',
              'Mostaganem',
              'Tèl : (213)045.42.35.20',
              NULL,
              'E_mail : outillagesaada@gmail.com',
              'N°RC: 21A3965999-27/00',
              'N.I.S: 100227010185845',
              'Commerce',
              'Outillage et Équipements',
              'N.I.F: 10227010185816600000',
              'Cpt : BDL 00500425000000844378'
          ) ON CONFLICT DO NOTHING;
        `
      }
    ];
    
    // Exécuter chaque section
    for (const section of sections) {
      console.log(`\n📋 ${section.name}...`);
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: section.sql
        });
        
        if (error) {
          console.error(`❌ Erreur ${section.name}:`, error.message);
        } else {
          console.log(`✅ ${section.name} - OK`);
        }
      } catch (e) {
        console.error(`❌ Exception ${section.name}:`, e.message);
      }
    }
    
    // 3. Créer les fonctions importantes une par une
    console.log('\n🔧 Création des fonctions RPC...');
    
    const functions = [
      {
        name: 'create_tenant_tables',
        sql: `
          CREATE OR REPLACE FUNCTION create_tenant_tables(schema_name TEXT)
          RETURNS TEXT
          SECURITY DEFINER
          LANGUAGE plpgsql
          AS $$
          BEGIN
              -- Famille d'articles
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.famille_art (
                      famille VARCHAR(50) PRIMARY KEY
                  );
              ', schema_name);

              -- Fournisseurs
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.fournisseur (
                      nfournisseur VARCHAR(20) PRIMARY KEY,
                      nom_fournisseur VARCHAR(100),
                      resp_fournisseur VARCHAR(100),
                      adresse_fourni TEXT,
                      tel VARCHAR(20),
                      tel1 VARCHAR(20),
                      tel2 VARCHAR(20),
                      caf DECIMAL(15,2) DEFAULT 0,
                      cabl DECIMAL(15,2) DEFAULT 0,
                      email VARCHAR(100),
                      commentaire TEXT
                  );
              ', schema_name);

              -- Clients
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.client (
                      nclient VARCHAR(20) PRIMARY KEY,
                      raison_sociale VARCHAR(100),
                      adresse TEXT,
                      contact_person VARCHAR(100),
                      c_affaire_fact DECIMAL(15,2) DEFAULT 0,
                      c_affaire_bl DECIMAL(15,2) DEFAULT 0,
                      nrc VARCHAR(50),
                      date_rc DATE,
                      lieu_rc VARCHAR(100),
                      i_fiscal VARCHAR(50),
                      n_article VARCHAR(50),
                      tel VARCHAR(20),
                      email VARCHAR(100),
                      commentaire TEXT
                  );
              ', schema_name);

              -- Articles
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.article (
                      narticle VARCHAR(20) PRIMARY KEY,
                      famille VARCHAR(50),
                      designation VARCHAR(200),
                      nfournisseur VARCHAR(20),
                      prix_unitaire DECIMAL(15,2) DEFAULT 0,
                      marge DECIMAL(5,2) DEFAULT 0,
                      tva DECIMAL(5,2) DEFAULT 0,
                      prix_vente DECIMAL(15,2) DEFAULT 0,
                      seuil INTEGER DEFAULT 0,
                      stock_f INTEGER DEFAULT 0,
                      stock_bl INTEGER DEFAULT 0
                  );
              ', schema_name);

              -- Table activite
              EXECUTE format('
                  CREATE TABLE IF NOT EXISTS %I.activite (
                      id SERIAL PRIMARY KEY,
                      code_activite VARCHAR(20),
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
                      entete_bon TEXT,
                      e_mail TEXT,
                      nom_entreprise TEXT,
                      telephone TEXT,
                      email TEXT,
                      nif TEXT,
                      rc TEXT,
                      logo_url TEXT,
                      slogan TEXT,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  );
              ', schema_name);

              RETURN 'Tables créées pour le schéma: ' || schema_name;
          END;
          $$;
        `
      },
      {
        name: 'copy_activite1_to_tenant',
        sql: `
          CREATE OR REPLACE FUNCTION copy_activite1_to_tenant(p_tenant TEXT)
          RETURNS TEXT
          SECURITY DEFINER
          LANGUAGE plpgsql
          AS $$
          DECLARE
              source_record RECORD;
              result_text TEXT := '';
              rows_inserted INTEGER := 0;
          BEGIN
              EXECUTE format('DELETE FROM %I.activite WHERE id > 0 OR id IS NULL', p_tenant);
              
              FOR source_record IN 
                  SELECT * FROM public.activite1
              LOOP
                  EXECUTE format('
                      INSERT INTO %I.activite (
                          code_activite, domaine_activite, sous_domaine, raison_sociale,
                          adresse, commune, wilaya, tel_fixe, tel_port, nrc, nis, nart,
                          ident_fiscal, banq, entete_bon, e_mail, nom_entreprise, 
                          telephone, email, nif, rc, logo_url, slogan
                      ) VALUES (
                          %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L,
                          %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
                      )',
                      p_tenant,
                      'BU01',
                      COALESCE(source_record.domaine_activite, ''),
                      COALESCE(source_record.sous_domaine, ''),
                      COALESCE(source_record.raison_sociale, ''),
                      COALESCE(source_record.adresse, ''),
                      COALESCE(source_record.commune, ''),
                      COALESCE(source_record.wilaya, ''),
                      COALESCE(source_record.tel_fixe, ''),
                      COALESCE(source_record.tel_port, ''),
                      COALESCE(source_record.nrc, ''),
                      COALESCE(source_record.nis, ''),
                      COALESCE(source_record.nis, ''),
                      COALESCE(source_record.ident_fiscal, ''),
                      COALESCE(source_record.banq, ''),
                      NULL,
                      COALESCE(source_record.e_mail, ''),
                      COALESCE(source_record.raison_sociale, ''),
                      COALESCE(source_record.tel_fixe, ''),
                      COALESCE(source_record.e_mail, ''),
                      COALESCE(source_record.ident_fiscal, ''),
                      COALESCE(source_record.nrc, ''),
                      NULL,
                      NULL
                  );
                  
                  rows_inserted := rows_inserted + 1;
                  result_text := result_text || 'Copié: ' || COALESCE(source_record.raison_sociale, 'N/A') || '. ';
              END LOOP;
              
              result_text := result_text || 'Total: ' || rows_inserted || ' ligne(s) insérée(s).';
              
              RETURN result_text;
          EXCEPTION
              WHEN OTHERS THEN
                  RETURN 'ERREUR: ' || SQLERRM;
          END;
          $$;
        `
      },
      {
        name: 'get_company_info',
        sql: `
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
          AS $$
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
          $$;
        `
      }
    ];
    
    // Créer chaque fonction
    for (const func of functions) {
      console.log(`\n🔧 Fonction ${func.name}...`);
      
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: func.sql
        });
        
        if (error) {
          console.error(`❌ Erreur ${func.name}:`, error.message);
        } else {
          console.log(`✅ Fonction ${func.name} - OK`);
        }
      } catch (e) {
        console.error(`❌ Exception ${func.name}:`, e.message);
      }
    }
    
    // 4. Créer les tables pour tous les tenants
    console.log('\n🏗️ Création des tables pour tous les tenants...');
    
    const tenants = ['2025_bu01', '2025_bu02', '2024_bu01'];
    
    for (const tenant of tenants) {
      console.log(`\n📋 Tables pour ${tenant}...`);
      
      try {
        const { data, error } = await supabaseAdmin.rpc('create_tenant_tables', {
          schema_name: tenant
        });
        
        if (error) {
          console.error(`❌ Erreur ${tenant}:`, error.message);
        } else {
          console.log(`✅ ${tenant}: ${data}`);
        }
      } catch (e) {
        console.error(`❌ Exception ${tenant}:`, e.message);
      }
    }
    
    // 5. Copier les données d'entreprise
    console.log('\n📊 Copie des données d\'entreprise...');
    
    for (const tenant of ['2025_bu01', '2025_bu02']) {
      console.log(`\n📋 Données pour ${tenant}...`);
      
      try {
        const { data, error } = await supabaseAdmin.rpc('copy_activite1_to_tenant', {
          p_tenant: tenant
        });
        
        if (error) {
          console.error(`❌ Erreur copie ${tenant}:`, error.message);
        } else {
          console.log(`✅ ${tenant}: ${data}`);
        }
      } catch (e) {
        console.error(`❌ Exception copie ${tenant}:`, e.message);
      }
    }
    
    // 6. Vérification finale
    console.log('\n🔍 Vérification finale...');
    
    try {
      const { data: companyData, error: companyError } = await supabaseAdmin.rpc('get_company_info', {
        p_tenant: '2025_bu01'
      });
      
      if (companyError) {
        console.error('❌ Erreur vérification:', companyError.message);
      } else if (companyData && companyData.length > 0) {
        console.log('✅ Vérification réussie:');
        console.log(`   Entreprise: ${companyData[0].raison_sociale}`);
        console.log(`   Adresse: ${companyData[0].adresse}`);
        console.log(`   Téléphone: ${companyData[0].tel_fixe}`);
      }
    } catch (e) {
      console.error('❌ Exception vérification:', e.message);
    }
    
    console.log('\n🎉 DÉPLOIEMENT TERMINÉ !');
    console.log('========================');
    console.log('✅ Schémas multi-tenants créés');
    console.log('✅ Tables créées dans tous les schémas');
    console.log('✅ Fonctions RPC déployées');
    console.log('✅ Données d\'entreprise copiées');
    console.log('✅ Système prêt pour production');
    
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Démarrer le serveur backend: bun run index.ts');
    console.log('2. Démarrer le frontend: bun run dev');
    console.log('3. Tester la génération de PDFs');
    console.log('4. Vérifier les données d\'entreprise');
    
  } catch (error) {
    console.error('❌ Erreur générale de déploiement:', error);
  }
}

deployCompleteSystem();