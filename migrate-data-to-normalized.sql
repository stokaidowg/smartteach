-- =====================================================
-- DATA MIGRATION SCRIPT FOR SMARTTEACH SYSTEM
-- Migrates legacy text data to normalized structures
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Migrate Gender data from pupils to global_list_items
-- =====================================================
INSERT INTO global_list_items (category_key, value, is_active)
SELECT DISTINCT 'gender', gender, true
FROM pupils
WHERE gender IS NOT NULL 
  AND gender != ''
  AND NOT EXISTS (
    SELECT 1 FROM global_list_items 
    WHERE category_key = 'gender' AND value = pupils.gender
  );

-- =====================================================
-- STEP 2: Migrate Nationality data from pupils to global_list_items
-- =====================================================
INSERT INTO global_list_items (category_key, value, is_active)
SELECT DISTINCT 'nationality', nationality, true
FROM pupils
WHERE nationality IS NOT NULL 
  AND nationality != ''
  AND NOT EXISTS (
    SELECT 1 FROM global_list_items 
    WHERE category_key = 'nationality' AND value = pupils.nationality
  );

-- =====================================================
-- STEP 3: Migrate Religion data from pupils to global_list_items
-- =====================================================
INSERT INTO global_list_items (category_key, value, is_active)
SELECT DISTINCT 'religion', religion, true
FROM pupils
WHERE religion IS NOT NULL 
  AND religion != ''
  AND NOT EXISTS (
    SELECT 1 FROM global_list_items 
    WHERE category_key = 'religion' AND value = pupils.religion
  );

-- =====================================================
-- STEP 4: Migrate Ethnicity data from pupils to global_list_items
-- =====================================================
INSERT INTO global_list_items (category_key, value, is_active)
SELECT DISTINCT 'ethnicity', ethnicity, true
FROM pupils
WHERE ethnicity IS NOT NULL 
  AND ethnicity != ''
  AND NOT EXISTS (
    SELECT 1 FROM global_list_items 
    WHERE category_key = 'ethnicity' AND value = pupils.ethnicity
  );

-- =====================================================
-- STEP 5: Migrate unique Year Group data to year_groups table
-- =====================================================
INSERT INTO year_groups (name, code, sort_order, is_active)
SELECT DISTINCT 
    year_group,
    SUBSTRING(year_group FROM 1 FOR 3), -- Simple code extraction
    CASE 
        WHEN year_group ~ '^[0-9]+' THEN year_group::integer
        ELSE 999
    END, -- Sort order based on numeric prefix
    true
FROM pupils
WHERE year_group IS NOT NULL 
  AND year_group != ''
  AND NOT EXISTS (
    SELECT 1 FROM year_groups WHERE name = pupils.year_group
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 6: Migrate unique House data to houses table
-- =====================================================
INSERT INTO houses (name, code, is_active)
SELECT DISTINCT 
    house,
    SUBSTRING(house FROM 1 FOR 3), -- Simple code extraction
    true
FROM pupils
WHERE house IS NOT NULL 
  AND house != ''
  AND NOT EXISTS (
    SELECT 1 FROM houses WHERE name = pupils.house
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 7: Migrate unique Form data to forms table
-- =====================================================
INSERT INTO forms (name, code, is_active)
SELECT DISTINCT 
    form,
    form, -- Use full name as code
    true
FROM pupils
WHERE form IS NOT NULL 
  AND form != ''
  AND NOT EXISTS (
    SELECT 1 FROM forms WHERE name = pupils.form
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 8: Link Year Groups to Forms where applicable
-- =====================================================
-- This tries to match forms to year groups based on naming patterns
UPDATE forms f
SET year_group_id = yg.id
FROM year_groups yg
WHERE f.year_group_id IS NULL
  AND (
    f.name LIKE yg.name || '%'  -- Form name starts with year group name
    OR f.code LIKE yg.code || '%'
  );

-- =====================================================
-- STEP 9: Update pupil records with year_group_id foreign keys
-- =====================================================
UPDATE pupils p
SET year_group_id = yg.id
FROM year_groups yg
WHERE p.year_group = yg.name
  AND p.year_group_id IS NULL;

-- =====================================================
-- STEP 10: Update pupil records with house_id foreign keys
-- =====================================================
UPDATE pupils p
SET house_id = h.id
FROM houses h
WHERE p.house = h.name
  AND p.house_id IS NULL;

-- =====================================================
-- STEP 11: Update pupil records with form_id foreign keys
-- =====================================================
UPDATE pupils p
SET form_id = f.id
FROM forms f
WHERE p.form = f.name
  AND p.form_id IS NULL;

-- =====================================================
-- STAFF DATA MIGRATION
-- =====================================================

-- =====================================================
-- STEP 12: Migrate Gender data from staff to global_list_items
-- =====================================================
INSERT INTO global_list_items (category_key, value, is_active)
SELECT DISTINCT 'gender', gender, true
FROM staff
WHERE gender IS NOT NULL 
  AND gender != ''
  AND NOT EXISTS (
    SELECT 1 FROM global_list_items 
    WHERE category_key = 'gender' AND value = staff.gender
  );

-- =====================================================
-- STEP 13: Migrate Religion data from staff to global_list_items
-- =====================================================
INSERT INTO global_list_items (category_key, value, is_active)
SELECT DISTINCT 'religion', religion, true
FROM staff
WHERE religion IS NOT NULL 
  AND religion != ''
  AND NOT EXISTS (
    SELECT 1 FROM global_list_items 
    WHERE category_key = 'religion' AND value = staff.religion
  );

-- =====================================================
-- STEP 14: Migrate Job Title data from staff to global_list_items
-- =====================================================
INSERT INTO global_list_items (category_key, value, is_active)
SELECT DISTINCT 'job-title', job_title, true
FROM staff
WHERE job_title IS NOT NULL 
  AND job_title != ''
  AND NOT EXISTS (
    SELECT 1 FROM global_list_items 
    WHERE category_key = 'job-title' AND value = staff.job_title
  );

-- =====================================================
-- STEP 15: Migrate Employment Type data from staff to global_list_items
-- =====================================================
INSERT INTO global_list_items (category_key, value, is_active)
SELECT DISTINCT 'employment-type', employment_type, true
FROM staff
WHERE employment_type IS NOT NULL 
  AND employment_type != ''
  AND NOT EXISTS (
    SELECT 1 FROM global_list_items 
    WHERE category_key = 'employment-type' AND value = staff.employment_type
  );

-- =====================================================
-- STEP 16: Migrate Department data from staff to departments table
-- =====================================================
INSERT INTO departments (name, code, is_active)
SELECT DISTINCT 
    department,
    SUBSTRING(department FROM 1 FOR 5), -- Simple code extraction
    true
FROM staff
WHERE department IS NOT NULL 
  AND department != ''
  AND NOT EXISTS (
    SELECT 1 FROM departments WHERE name = staff.department
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 17: Update staff records with department_id foreign keys
-- =====================================================
UPDATE staff s
SET department_id = d.id
FROM departments d
WHERE s.department = d.name
  AND s.department_id IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check migration progress for pupils
SELECT 
    'Pupils with Year Group FK' as metric,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM pupils WHERE year_group IS NOT NULL AND year_group != ''), 0), 2) as percentage
FROM pupils 
WHERE year_group_id IS NOT NULL

UNION ALL

SELECT 
    'Pupils with House FK' as metric,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM pupils WHERE house IS NOT NULL AND house != ''), 0), 2) as percentage
FROM pupils 
WHERE house_id IS NOT NULL

UNION ALL

SELECT 
    'Pupils with Form FK' as metric,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM pupils WHERE form IS NOT NULL AND form != ''), 0), 2) as percentage
FROM pupils 
WHERE form_id IS NOT NULL

UNION ALL

-- Check migration progress for staff
SELECT 
    'Staff with Department FK' as metric,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM staff WHERE department IS NOT NULL AND department != ''), 0), 2) as percentage
FROM staff 
WHERE department_id IS NOT NULL;

-- List any unmigrated pupil data
SELECT 
    'Unmigrated Year Groups' as issue,
    STRING_AGG(DISTINCT year_group, ', ') as values
FROM pupils 
WHERE year_group IS NOT NULL 
  AND year_group != '' 
  AND year_group_id IS NULL

UNION ALL

SELECT 
    'Unmigrated Houses' as issue,
    STRING_AGG(DISTINCT house, ', ') as values
FROM pupils 
WHERE house IS NOT NULL 
  AND house != '' 
  AND house_id IS NULL

UNION ALL

SELECT 
    'Unmigrated Forms' as issue,
    STRING_AGG(DISTINCT form, ', ') as values
FROM pupils 
WHERE form IS NOT NULL 
  AND form != '' 
  AND form_id IS NULL

UNION ALL

SELECT 
    'Unmigrated Departments' as issue,
    STRING_AGG(DISTINCT department, ', ') as values
FROM staff 
WHERE department IS NOT NULL 
  AND department != '' 
  AND department_id IS NULL;

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- After running this migration:
-- 1. Review the verification output to ensure all data was migrated
-- 2. Manually review and clean up any unmigrated values
-- 3. Consider adding business logic to year_groups (key_stage, capacity, etc.)
-- 4. Assign house captains to houses table
-- 5. Assign form tutors and rooms to forms table
-- 6. Assign heads of department to departments table
-- 7. Test the application with the new normalized data
-- 8. Once verified, you may optionally drop the old text columns:
--    ALTER TABLE pupils DROP COLUMN year_group, DROP COLUMN house, DROP COLUMN form;
--    ALTER TABLE staff DROP COLUMN department;
-- =====================================================
