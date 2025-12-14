// Script de configuration rapide pour la nouvelle base de données
import { supabaseAdmin } from './src/supabaseClient.js';

async function quickSetup() {
  console.log('⚡ CONFIGURATION RAPIDE NOUVELLE BASE');
  console.log('====================================\n');
  
  try {
    // 1. Créer les schémas
    console.log('🏗️ Création des schémas...');
    const { error: schemaError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE SCHEMA IF NOT EXISTS "2025_bu01";
        CREATE SCHEMA IF NOT EXISTS "2025_bu02";
        CREATE SCHEMA IF NOT EXISTS "2024_bu01";
      `
    });
    
    if (schemaError) {
      console.error('❌ Erreur schémas:', schemaError.message);
    } else {
      console.log('✅ Schémas créés');
    }
    
    // 2. Créer la table activite1 avec les données
    console.log('\n📊 Création table activite1...');
    const { error: activiteError } = await supabaseAdmin.rpc('exec_sql', {
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
        
        DELETE FROM public.activite1;
        
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
        );
      `
    });
    
    if (activiteError) {
      console.error('❌ Erreur activite1:', activiteError.message);
    } else {
      console.log('✅ Table activite1 créée avec données');
    }
    
    // 3. Créer les utilisateurs
    console.log('\n👥 Création des utilisateurs...');
    
    const users = [
      { email: 'admin@stock.dz', password: 'admin123', role: 'admin' },
      { email: 'test@stock.dz', password: 'test123', role: 'user' }
    ];
    
    for (const user of users) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { role: user.role }
        });
        
        if (error) {
          console.log(`⚠️  ${user.email}: ${error.message}`);
        } else {
          console.log(`✅ Utilisateur créé: ${user.email}`);
        }
      } catch (e) {
        console.log(`⚠️  ${user.email}: ${e.message}`);
      }
    }
    
    console.log('\n🎉 CONFIGURATION RAPIDE TERMINÉE !');
    console.log('==================================');
    console.log('✅ Schémas multi-tenants créés');
    console.log('✅ Données d\'entreprise ajoutées');
    console.log('✅ Utilisateurs créés');
    console.log('\n📋 Connexion:');
    console.log('   Email: admin@stock.dz');
    console.log('   Mot de passe: admin123');
    console.log('\n🚀 Redémarrez les serveurs et testez !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

quickSetup();