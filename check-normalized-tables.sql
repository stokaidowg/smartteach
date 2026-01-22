-- Quick check and setup for normalized tables
-- Run this to apply the normalization schema

\echo 'Checking if normalized tables exist...'

-- Check if tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_list_categories') THEN
        RAISE NOTICE 'Normalized tables do not exist. Please run database-normalization.sql first.';
        RAISE NOTICE 'To apply the schema, run: psql -U postgres -d smartTeach -f database-normalization.sql';
    ELSE
        RAISE NOTICE 'Normalized tables already exist!';
    END IF;
END $$;

-- Show table status
SELECT 
    'global_list_categories' as table_name,
    COUNT(*) as row_count
FROM global_list_categories
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_list_categories')

UNION ALL

SELECT 
    'global_list_items' as table_name,
    COUNT(*) as row_count
FROM global_list_items
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_list_items')

UNION ALL

SELECT 
    'year_groups' as table_name,
    COUNT(*) as row_count
FROM year_groups
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'year_groups')

UNION ALL

SELECT 
    'houses' as table_name,
    COUNT(*) as row_count
FROM houses
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'houses')

UNION ALL

SELECT 
    'forms' as table_name,
    COUNT(*) as row_count
FROM forms
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forms')

UNION ALL

SELECT 
    'departments' as table_name,
    COUNT(*) as row_count
FROM departments
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments');
