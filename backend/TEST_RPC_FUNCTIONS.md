# TEST RPC FUNCTIONS

## Step 1: Execute RPC Functions in Supabase

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `SUPABASE_RPC_FUNCTIONS.sql`
4. Execute all functions

## Step 2: Test the Functions

### Test BL (Delivery Notes) Functions

```sql
-- Test get_bl_list function
SELECT get_bl_list('2025_bu01');

-- Test get_bl_by_id function (if you have data)
SELECT get_bl_by_id('2025_bu01', 1);
```

### Test Invoice Functions

```sql
-- Test get_fact_list function
SELECT get_fact_list('2025_bu01');

-- Test get_fact_by_id function (if you have data)
SELECT get_fact_by_id('2025_bu01', 1);
```

### Test Proforma Functions

```sql
-- Test get_fprof_list function
SELECT get_fprof_list('2025_bu01');

-- Test get_fprof_by_id function (if you have data)
SELECT get_fprof_by_id('2025_bu01', 1);
```

## Step 3: Test via API

After executing the RPC functions, test the API endpoints:

1. **Create a delivery note**: POST to `http://localhost:3005/api/sales/delivery-notes`
2. **List delivery notes**: GET `http://localhost:3005/api/sales/delivery-notes`
3. **View delivery note**: GET `http://localhost:3005/api/sales/delivery-notes/1`

## Expected Results

- All data should be stored in your database tables in the `2025_bu01` schema
- The "Voir" buttons should work without 404 errors
- No more "NaN" errors in the logs
- Real database storage instead of cache-only

## Troubleshooting

If you get errors:
1. Check that your tenant schema (`2025_bu01`) exists
2. Verify that all tables (bl, detail_bl, fact, detail_fact, fprof, detail_fprof, client, article) exist in the schema
3. Check the browser console and backend logs for specific error messages