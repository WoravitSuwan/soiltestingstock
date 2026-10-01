-- Fixes already-imported "ยอดยกมา" rows that landed with is_opening_balance = false
-- (direction = 'in') instead of true, because the uploaded file's หมายเหตุ column
-- wasn't recognized by the importer at the time of that import.
--
-- Run each numbered step IN ORDER in the Supabase SQL Editor. Every UPDATE is preceded
-- by a SELECT that shows exactly what it's about to change — read that output before
-- running the UPDATE right after it. Steps 2A/2B/2C are alternatives: use whichever one
-- actually matches your data (2A is almost always the right one — it's the whole reason
-- import_batches exists). Skip the ones you don't use.

-- ============================================================================
-- STEP 1 — Find the import batch to fix
-- ============================================================================
select id, direction, year, file_name, row_count, new_product_count, imported_at
from import_batches
order by imported_at desc;

-- Look for the row matching your "ยอดยกมา 31/12/2568" import (direction should be the
-- page you imported it from, year should be 2568, row_count should be close to 784).
-- Copy its id — you'll use it as <BATCH_ID> below.


-- ============================================================================
-- STEP 2A — Preferred fix: scoped to that one import batch
-- ============================================================================
-- Preview (run first) — should return ~784 rows, all with is_opening_balance = false:
select id, product_code, product_name, qty, unit_price, total, movement_date, note
from stock_movements
where import_batch_id = '<BATCH_ID>'
  and is_opening_balance = false
order by product_code;

-- Once the preview above looks right, apply the fix:
update stock_movements
set is_opening_balance = true
where import_batch_id = '<BATCH_ID>'
  and is_opening_balance = false;

-- Undo, if something above looks wrong after running it:
-- update stock_movements set is_opening_balance = false where import_batch_id = '<BATCH_ID>';


-- ============================================================================
-- STEP 2B — Fallback: no matching import_batches row at all
-- ============================================================================
-- Use this only if Step 1 found nothing for this import. Scopes by source='import' and
-- the ปี (พ.ศ.) you imported for instead of a batch id.
select count(*) as rows_to_fix
from stock_movements
where source = 'import'
  and reference_year = 2568          -- change to the year you imported
  and is_opening_balance = false;

update stock_movements
set is_opening_balance = true
where source = 'import'
  and reference_year = 2568          -- change to the year you imported
  and is_opening_balance = false;


-- ============================================================================
-- STEP 2C — Last-resort fallback: by "this is the product's only-ever movement"
-- ============================================================================
-- Only use this if 2A and 2B both find nothing usable. Picks out imported rows for
-- products that have never had any other Stock In/Out row (in or out) — i.e. nothing
-- but this one import ever happened for that product, which is exactly what you'd expect
-- for a fresh ยอดยกมา with no real purchases/sales yet. This can misfire for a product
-- that happens to have exactly one *real* purchase and nothing else, so review the
-- preview carefully (check the qty/price look like opening-balance data, not a genuine
-- purchase) before running the UPDATE.
select sm.id, sm.product_code, sm.product_name, sm.qty, sm.unit_price, sm.total, sm.movement_date, sm.note
from stock_movements sm
where sm.source = 'import'
  and sm.is_opening_balance = false
  and sm.product_id in (
    select product_id from stock_movements
    where product_id is not null
    group by product_id
    having count(*) = 1
  )
order by sm.product_code;

update stock_movements sm
set is_opening_balance = true
where sm.source = 'import'
  and sm.is_opening_balance = false
  and sm.product_id in (
    select product_id from stock_movements
    where product_id is not null
    group by product_id
    having count(*) = 1
  );


-- ============================================================================
-- STEP 3 — Verify
-- ============================================================================
-- Spot-check a few codes you know were in the file — each should show exactly one row
-- with is_opening_balance = true and nothing else:
select product_code, is_opening_balance, direction, qty, unit_price, total, movement_date
from stock_movements
where product_code in ('008BAW.025') -- add more codes here, comma-separated
order by product_code, movement_date;

-- Overall sanity check: this should now be 0 (or only cover genuinely different data)
select count(*) from stock_movements
where source = 'import' and reference_year = 2568 and is_opening_balance = false;
