# Fix: Infinite Loop in Payment Status Filter (FINAL)

## Problem
The delivery notes list page had an infinite loop when filtering by payment status, causing thousands of API requests and making the application unusable.

## Root Cause
The infinite loop was caused by a circular dependency in React useEffect hooks:

1. `applyFilters` function depended on `paymentStatuses` state
2. `useEffect` called `applyFilters` when it changed
3. Another `useEffect` loaded payment statuses and updated `paymentStatuses`
4. This created the cycle: `paymentStatuses` changes → `applyFilters` runs → triggers useEffect → loads statuses → updates `paymentStatuses` → cycle repeats infinitely

## Solution (Final Approach)
Broke the dependency chain using `useRef` to track loading state:

1. **Removed `paymentStatuses` from `applyFilters` dependencies**
   - The function still reads `paymentStatuses` but doesn't re-create when it changes
   - This prevents the infinite loop

2. **Added `useRef` to prevent multiple simultaneous loads**
   ```typescript
   const isLoadingStatuses = useRef(false);
   const statusesLoadedFor = useRef<string>(''); // Track which filter we loaded for
   ```
   - `isLoadingStatuses` prevents concurrent API calls
   - `statusesLoadedFor` tracks which filter value we already loaded for

3. **Modified useEffect to only load once per filter value**
   ```typescript
   useEffect(() => {
     if (statusesLoadedFor.current === paymentStatus) {
       return; // Already loaded for this filter
     }
     
     if (paymentStatus !== 'all' && deliveryNotes.length > 0) {
       statusesLoadedFor.current = paymentStatus;
       loadPaymentStatusesOptimized(...).then(() => {
         applyFilters(); // Re-apply after loading
       });
     }
   }, [paymentStatus]);
   ```

4. **Added guard in loadPaymentStatusesOptimized**
   - Checks `isLoadingStatuses.current` at the start
   - Returns early if already loading
   - Uses try/finally to ensure flag is reset

## Files Modified
- `frontend/app/delivery-notes/list/page.tsx`

## How It Works Now
1. User selects payment status filter (e.g., "Partiellement payés")
2. `paymentStatus` state changes
3. useEffect checks if we already loaded for this value
4. If not, marks it as loading and calls `loadPaymentStatusesOptimized`
5. Function loads payment data for ALL delivery notes (with guard against concurrent calls)
6. After loading completes, calls `applyFilters()` once via Promise.then()
7. Filtered results are displayed
8. If user changes filter again, the ref prevents reloading the same data
9. No more infinite loop!

## Key Differences from Previous Attempt
- Uses `useRef` instead of adding another `useEffect` that depends on `paymentStatuses`
- Tracks which filter value we loaded for to avoid redundant loads
- Calls `applyFilters()` explicitly after loading via Promise.then() instead of relying on state changes
- Guards against concurrent loads with `isLoadingStatuses.current`

## Testing
1. Navigate to delivery notes list
2. Select "Partiellement payés" from payment status filter
3. Verify:
   - No infinite loop in console
   - Results are displayed correctly
   - Only BLs with partial payments are shown
   - Switching between filters doesn't cause redundant loads

## Next Steps
- Apply same fix to `frontend/app/invoices/list/page.tsx` (has same pattern)
- Consider adding loading indicator while statuses are being loaded
- Optimize by caching payment statuses to avoid reloading on every page visit
