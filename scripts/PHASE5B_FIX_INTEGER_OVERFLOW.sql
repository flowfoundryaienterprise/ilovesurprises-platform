-- ==============================================================================
-- PHASE 5B: FIX INTEGER OVERFLOW FOR AUTHORITATIVE CATALOG IMPORT
-- Target Supabase Project: https://grwhdtvorhdvyvcxwomn.supabase.co (grwhdtvorhdvyvcxwomn)
--
-- Why: In authoritative Products.csv, row 879473 contains total_inventory_qty = 10,890,099,000 (10.89 billion).
-- Postgres signed 32-bit 'integer' maxes out at 2,147,483,647.
-- Changing to 'bigint' preserves 100% of exact source data without skipping or data loss.
-- ==============================================================================

-- 1. Alter staging inventory columns to bigint
ALTER TABLE public.staging_products ALTER COLUMN total_inventory_qty TYPE bigint;
ALTER TABLE public.staging_product_variants ALTER COLUMN inventory_qty TYPE bigint;

-- 2. Create helper for automated DDL execution during production cutover
CREATE OR REPLACE FUNCTION public.exec_sql(query text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE query;
END;
$$;
