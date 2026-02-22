-- Check if there's any data in the fachat table
SELECT COUNT(*) as total_invoices FROM "2009_bu02".fachat;

-- Get a sample of the data
SELECT * FROM "2009_bu02".fachat LIMIT 5;

-- Test the function directly
SELECT get_purchase_invoices_list('2009_bu02');
