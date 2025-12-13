import { supabaseAdmin } from './src/supabaseClient.js';

async function createActivite1Table() {
  console.log('📋 Création de la table activite1 dans le schéma public...');
  
  try {
    // Créer la table activite1 avec une structure flexible pour recevoir les données de NetBeans
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.activite1 (
        id SERIAL PRIMARY KEY,
        code_activite VARCHAR(50),
        domaine_activite TEXT,
        sous_domaine TEXT,
        raison_sociale TEXT,
        adresse TEXT,
        commune TEXT,
        wilaya TEXT,
        tel_fixe VARCHAR(50),
        tel_port VARCHAR(50),
        nrc VARCHAR(50),
        nis VARCHAR(50),
        nart VARCHAR(50),
        ident_fiscal VARCHAR(50),
        banq TEXT,
        entete_bon TEXT,
        e_mail VARCHAR(100),
        nom_entreprise TEXT,
        telephone VARCHAR(50),
        email VARCHAR(100),
        nif VARCHAR(50),
        rc VARCHAR(50),
        logo_url TEXT,
        slogan TEXT,
        -- Champs additionnels possibles de NetBeans
        fax VARCHAR(50),
        site_web VARCHAR(100),
        capital DECIMAL(15,2),
        forme_juridique VARCHAR(50),
        secteur_activite VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.error('❌ Erreur lors de la création de la table:', createError);
      return;
    }
    
    console.log('✅ Table activite1 créée avec succès dans le schéma public');
    
    // Afficher la structure créée
    console.log('\n📊 Structure de la table activite1:');
    
    const { data: structure } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activite1'
        ORDER BY ordinal_position;
      `
    });
    
    if (structure && structure.length > 0) {
      structure.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    console.log('\n📝 Instructions pour importer vos données:');
    console.log('');
    console.log('1. Exportez les données de votre table activite NetBeans en SQL');
    console.log('2. Ou utilisez l\'interface Supabase pour importer un fichier CSV');
    console.log('3. Ou insérez manuellement les données avec une requête INSERT');
    console.log('');
    console.log('Exemple d\'insertion manuelle:');
    console.log(`
INSERT INTO public.activite1 (
  raison_sociale, adresse, commune, wilaya, 
  tel_fixe, tel_port, e_mail, nrc, nis, nif, rc
) VALUES (
  'VOTRE ENTREPRISE SARL',
  'Votre adresse complète',
  'Votre commune',
  'Votre wilaya',
  '+213 XX XX XX XX',
  '+213 XX XX XX XX',
  'contact@votre-entreprise.dz',
  'XX/XX-XXXXXXX',
  'XXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXX',
  'XX/XX-XXXXXXX'
);
    `);
    
    console.log('\n🔄 Une fois les données importées, relancez le script de copie:');
    console.log('   bun run copy-activite-data.ts');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createActivite1Table();