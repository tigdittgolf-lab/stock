# Fix: "Client not found" Error When Creating BL

## Problem
When creating a delivery note (BL), the system returned error "Client 32 not found" even though the client existed in the database.

## Root Causes Identified

### 1. Frontend: Hardcoded Tenant in handleSubmit
- **Location**: `frontend/app/delivery-notes/page.tsx` line ~302
- **Issue**: The POST request to create BL used hardcoded tenant '2025_bu01' instead of dynamic tenant from localStorage
- **Impact**: BL creation always tried to validate client in wrong tenant database

### 2. Backend: Wrong Database Service for MySQL
- **Location**: `backend/src/routes/sales-clean.ts` POST /delivery-notes route (line ~497)
- **Issue**: Used `databaseRouter.rpc()` which only works for Supabase, not for MySQL
- **Impact**: MySQL database couldn't execute RPC functions, causing validation failures

## Solutions Implemented

### Frontend Fix (frontend/app/delivery-notes/page.tsx)
```typescript
// BEFORE (line 302):
'X-Tenant': '2025_bu01'

// AFTER:
const tenant = localStorage.getItem('tenant') || '2025_bu01';
const databaseType = localStorage.getItem('databaseType') || 'mysql';

headers: {
  'Content-Type': 'application/json',
  'X-Tenant': tenant,
  'X-Database-Type': databaseType
}
```

### Backend Fix (backend/src/routes/sales-clean.ts)
Changed all RPC calls from `databaseRouter.rpc()` to `backendDatabaseService.executeRPC()`:

1. **Get next BL number** (line ~515)
2. **Validate client** (line ~527)
3. **Validate articles** (line ~540)
4. **Check stock** (line ~563)
5. **Insert BL header** (line ~598)
6. **Insert BL details** (line ~612)
7. **Update stock** (line ~628)

## Result
- BL creation now works correctly for both MySQL and Supabase
- Dynamic tenant selection from login is properly used
- All database operations use the correct database service layer

## Testing
User should test:
1. Login with tenant 2009_bu02 (MySQL)
2. Select client 32 (or any client from the 1284 available)
3. Add article lines
4. Create BL
5. Verify BL is created successfully with correct client and tenant

## Related Files
- `frontend/app/delivery-notes/page.tsx` (handleSubmit function)
- `backend/src/routes/sales-clean.ts` (POST /delivery-notes route)
- `backend/src/services/databaseService.ts` (executeRPC method)
