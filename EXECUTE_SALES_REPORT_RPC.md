# Execute Sales Report RPC Function

## Instructions

To complete the sales report feature, you need to execute the RPC function in your Supabase database.

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Execute the RPC Function

Copy and paste the entire content from `backend/SALES_REPORT_RPC_FUNCTION.sql` into the SQL editor and run it.

The function will:
- Create `get_sales_report_with_margin()` function
- Grant necessary permissions
- Enable sales report with margin calculations

### Step 3: Test the Sales Report

1. Start your backend: `cd backend && bun run dev`
2. Start your frontend: `cd frontend && bun run dev`
3. Go to Dashboard → Ventes → 📊 Rapport des Ventes
4. The report should now work with real database data

### Expected Features

✅ **Frontend Page**: Complete with filters and totals display
✅ **Backend Endpoint**: `/api/sales/report` with RPC integration
✅ **Navigation Link**: Added to dashboard sales section
⏳ **RPC Function**: Needs to be executed in Supabase (this step)

### RPC Function Features

- Combines BL (delivery notes) and Factures (invoices)
- Calculates profit margins automatically
- Supports date range filtering
- Supports document type filtering (ALL, BL, FACTURE)
- Supports client code filtering
- Returns totals and detailed sales data
- Handles multi-tenant architecture

### Test Queries

After executing the RPC function, you can test it directly in Supabase:

```sql
-- Test with all sales for today
SELECT get_sales_report_with_margin('2025_bu01', '2025-12-21', '2025-12-21', 'ALL', NULL);

-- Test with only BL for a specific client
SELECT get_sales_report_with_margin('2025_bu01', '2025-12-01', '2025-12-31', 'BL', 'CL01');
```

### Troubleshooting

If you get permission errors, make sure your Supabase user has the necessary privileges to create functions.

If the function fails, check that your tenant schemas (like `2025_bu01`) exist and have the required tables:
- `bl` (delivery notes)
- `factures` (invoices) 
- `detail_bl` (delivery note details)
- `detail_fact` (invoice details)
- `clients` (clients)
- `articles` (articles with cost prices)