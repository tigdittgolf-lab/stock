# Fix Supabase Payment Filter - Solution Complete

## Problem
The payment status filter was returning 0 results for Supabase even though payments exist in the database. BL 8703 is fully paid with 3605.7 DA but doesn't show up when filtering by "paid" status.

## Root Cause
When querying payments for Supabase, the code was using `executePostgreSQLQuery` which connects to a local PostgreSQL database instead of using the Supabase client to query the `public.payments` table in Supabase.

The flow was:
1. `executeRPC('get_all_payments_by_tenant')` → tries Supabase RPC (doesn't exist)
2. Falls back to `executeSupabaseAdaptiveFallback` (no case for this function)
3. Falls back to `getMockDataForFunction` → calls `convertRPCToSQL('postgresql', ...)`
4. `getAllPaymentsByTenant` with `dbType='postgresql'` → calls `executePostgreSQLQuery`
5. `executePostgreSQLQuery` uses local PostgreSQL client ❌ (should use Supabase client)

## Solution Applied
Modified two functions in `backend/src/services/databaseService.ts` to detect when the active database is Supabase and use the Supabase client instead of the local PostgreSQL client:

### 1. `getAllPaymentsByTenant` (Line ~3505)
Added Supabase client detection at the beginning:
```typescript
const activeDbType = this.getActiveDatabaseType();
if (activeDbType === 'supabase') {
  console.log(`💰 Using Supabase client for payments query`);
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('document_id, amount')
    .eq('tenant_id', tenant)
    .eq('document_type', documentType);
  
  // Group and sum by document_id
  const paymentSummaries = new Map<number, number>();
  data?.forEach((payment: any) => {
    const docId = payment.document_id;
    const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
    paymentSummaries.set(docId, (paymentSummaries.get(docId) || 0) + amount);
  });
  
  // Convert to array
  const result = Array.from(paymentSummaries.entries()).map(([document_id, total_paid]) => ({
    document_id,
    total_paid
  }));
  
  return { success: true, data: result };
}
```

### 2. `getPaymentsByDocument` (Line ~3442)
Added the same Supabase client detection:
```typescript
const activeDbType = this.getActiveDatabaseType();
if (activeDbType === 'supabase') {
  console.log(`💰 Using Supabase client for payments query`);
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('tenant_id', tenant)
    .eq('document_type', documentType)
    .eq('document_id', documentId)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false });
  
  return { success: true, data: data || [] };
}
```

## Verification
Created test script `test-supabase-payments-direct.mjs` that confirms:
- ✅ Supabase has 2 payments for tenant 2009_bu02
- ✅ BL 8701: 947.4 DA (partially paid)
- ✅ BL 8703: 3605.7 DA (fully paid)

## Next Steps - IMPORTANT!

### 1. Restart the Backend Server
The backend must be restarted to pick up the code changes:
```bash
# Stop the backend (Ctrl+C in the terminal where it's running)
# Then restart it:
cd backend
npm run dev
```

### 2. Test the Filter
After restarting, test with curl:
```bash
# Test paid status (should return BL 8703)
curl.exe http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=paid -H "X-Tenant: 2009_bu02" -H "X-Database-Type: supabase"

# Test partially_paid status (should return BL 8701)
curl.exe http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=partially_paid -H "X-Tenant: 2009_bu02" -H "X-Database-Type: supabase"

# Test unpaid status (should return all BLs without payments)
curl.exe http://localhost:3005/api/sales/delivery-notes-by-payment-status?status=unpaid -H "X-Tenant: 2009_bu02" -H "X-Database-Type: supabase"
```

### 3. Expected Results
After restart, you should see in the backend console:
```
💰 Loading all payments for tenant 2009_bu02...
💰 Using Supabase client for payments query
✅ Found payment summaries for 2 documents
💰 Loaded 2 payment summaries in one query
💰 Payments map created with 2 entries
  - Document 8701: 947.4 paid
  - Document 8703: 3605.7 paid
```

And the API should return:
- `status=paid`: BL 8703 (3605.7 DA paid)
- `status=partially_paid`: BL 8701 (947.4 DA paid out of 2460 DA)
- `status=unpaid`: All other BLs with no payments

## Files Modified
- `backend/src/services/databaseService.ts` (2 functions updated)

## Files Created for Testing
- `test-supabase-payments-direct.mjs` - Direct Supabase query test
- `test-bl-8703-supabase.mjs` - BL 8703 specific test
- `SUPABASE_PAYMENT_FILTER_FIX.md` - This documentation

## Architecture Notes
- MySQL: `stock_management.payments` (central database)
- Supabase: `public.payments` (central schema, accessible via Supabase client)
- BL tables: In tenant schemas (e.g., `2009_bu02.bl`) for both MySQL and Supabase
- Payments table uses `tenant_id` column to filter by tenant
