import { supabaseAdmin } from './src/supabaseClient.js';

async function createTables() {
  try {
    console.log('Creating missing tables...');

    // Create fprof table
    const { error: fprofError } = await supabaseAdmin
      .from('fprof')
      .select('id')
      .limit(1);

    if (fprofError && fprofError.code === 'PGRST116') {
      // Table doesn't exist, we need to create it via SQL
      console.log('fprof table does not exist, please create it manually in Supabase SQL editor using setup.sql');
    } else {
      console.log('fprof table already exists');
    }

    if (fprofError) {
      console.error('Error creating fprof table:', fprofError);
    } else {
      console.log('fprof table created successfully');
    }

    // Create detail_fprof table
    const { error: detailFprofError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS detail_fprof (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
          year INTEGER NOT NULL,
          NFact INTEGER NOT NULL,
          Narticle VARCHAR(10) NOT NULL,
          Qte INTEGER NOT NULL,
          tva NUMERIC(5, 2),
          pr_achat NUMERIC(15, 2) DEFAULT 0.00,
          prix NUMERIC(15, 2) NOT NULL,
          total_ligne NUMERIC(15, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (detailFprofError) {
      console.error('Error creating detail_fprof table:', detailFprofError);
    } else {
      console.log('detail_fprof table created successfully');
    }

    console.log('Table creation completed!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createTables();