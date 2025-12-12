-- 1. Grant usage permissions on Schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. Grant sequence permissions (crucial for SERIAL primary keys)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Enable RLS and add basic policies (Optional but recommended for Supabase)
-- Helper function to enable RLS and add policy
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'famille_art', 'fournisseur', 'article', 'client', 
        'fact', 'detail_fact', 'bl', 'detail_bl', 
        'fprof', 'detail_fprof', 'fachat', 'fachat_detail', 
        'user_info', 'activite', 'stock_table_parameter'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policy if any
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for dev" ON %I', t);
        
        -- Create permissive policy for development
        EXECUTE format('CREATE POLICY "Enable all access for dev" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
