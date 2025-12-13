import { supabaseAdmin } from './src/supabaseClient.js';

async function copyActiviteData() {
  console.log('📋 Copie des données de activite1 (public) vers activite (2025_bu01)...');
  
  try {
    // 1. D'abord, examiner la structure de activite1 dans public
    console.log('\n🔍 Examen de la structure de activite1 (public)...');
    
    const { data: activite1Structure, error: structError1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activite1'
        ORDER BY ordinal_position;
      `
    });
    
    if (structError1) {
      console.error('❌ Erreur lors de l\'examen de activite1:', structError1);
      return;
    }
    
    console.log('   Colonnes dans activite1:');
    activite1Structure?.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // 2. Examiner la structure de activite dans 2025_bu01
    console.log('\n🔍 Examen de la structure de activite (2025_bu01)...');
    
    const { data: activiteStructure, error: structError2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '2025_bu01' 
        AND table_name = 'activite'
        ORDER BY ordinal_position;
      `
    });
    
    if (structError2) {
      console.error('❌ Erreur lors de l\'examen de activite:', structError2);
      return;
    }
    
    console.log('   Colonnes dans activite (2025_bu01):');
    activiteStructure?.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // 3. Récupérer les données de activite1
    console.log('\n📊 Récupération des données de activite1...');
    
    const { data: activite1Data, error: dataError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'SELECT * FROM public.activite1 LIMIT 1;'
    });
    
    if (dataError) {
      console.error('❌ Erreur lors de la récupération des données:', dataError);
      return;
    }
    
    if (!activite1Data || activite1Data.length === 0) {
      console.log('⚠️ Aucune donnée trouvée dans activite1');
      return;
    }
    
    console.log('   Données trouvées dans activite1:');
    const data = activite1Data[0];
    Object.keys(data).forEach(key => {
      console.log(`   - ${key}: ${data[key]}`);
    });
    
    // 4. Préparer la requête de copie en mappant les champs
    console.log('\n🔄 Préparation de la copie des données...');
    
    // Mapping des champs (ajustez selon les noms réels des colonnes)
    const fieldMapping = {
      // Champs probablement identiques
      'code_activite': 'code_activite',
      'domaine_activite': 'domaine_activite', 
      'sous_domaine': 'sous_domaine',
      'raison_sociale': 'raison_sociale',
      'adresse': 'adresse',
      'commune': 'commune',
      'wilaya': 'wilaya',
      'tel_fixe': 'tel_fixe',
      'tel_port': 'tel_port',
      'nrc': 'nrc',
      'nis': 'nis',
      'nart': 'nart',
      'ident_fiscal': 'ident_fiscal',
      'banq': 'banq',
      'e_mail': 'e_mail',
      'nif': 'nif',
      'rc': 'rc',
      // Champs possibles avec noms différents
      'telephone': 'tel_fixe',
      'email': 'e_mail',
      'nom_entreprise': 'raison_sociale'
    };
    
    // Construire la liste des champs disponibles dans activite1
    const availableFields = Object.keys(data);
    console.log('   Champs disponibles dans activite1:', availableFields.join(', '));
    
    // 5. Effectuer la copie
    console.log('\n📝 Copie des données vers 2025_bu01.activite...');
    
    // D'abord, supprimer les données existantes dans 2025_bu01.activite
    const { error: deleteError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'DELETE FROM "2025_bu01".activite;'
    });
    
    if (deleteError) {
      console.warn('⚠️ Avertissement lors de la suppression:', deleteError.message);
    }
    
    // Construire la requête INSERT dynamiquement
    const insertFields = [];
    const insertValues = [];
    
    availableFields.forEach(field => {
      if (field !== 'id' && data[field] !== null && data[field] !== undefined) {
        insertFields.push(field);
        // Échapper les apostrophes dans les valeurs
        const value = typeof data[field] === 'string' 
          ? data[field].replace(/'/g, "''") 
          : data[field];
        insertValues.push(`'${value}'`);
      }
    });
    
    const insertSQL = `
      INSERT INTO "2025_bu01".activite (${insertFields.join(', ')})
      VALUES (${insertValues.join(', ')});
    `;
    
    console.log('   Requête SQL:', insertSQL);
    
    const { error: insertError } = await supabaseAdmin.rpc('exec_sql', {
      sql: insertSQL
    });
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion:', insertError);
      return;
    }
    
    console.log('✅ Données copiées avec succès !');
    
    // 6. Vérifier la copie
    console.log('\n🔍 Vérification de la copie...');
    
    const { data: verifyData, error: verifyError } = await supabaseAdmin.rpc('get_company_info', {
      p_tenant: '2025_bu01'
    });
    
    if (verifyError) {
      console.error('❌ Erreur lors de la vérification:', verifyError);
    } else if (verifyData && verifyData.length > 0) {
      console.log('✅ Vérification réussie:');
      console.log(`   Raison sociale: ${verifyData[0].raison_sociale}`);
      console.log(`   Adresse: ${verifyData[0].adresse}`);
      console.log(`   Téléphone: ${verifyData[0].tel_fixe}`);
      console.log(`   Email: ${verifyData[0].e_mail}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

copyActiviteData();