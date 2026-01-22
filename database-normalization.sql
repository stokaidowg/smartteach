-- SmartTeach Data Normalization - Database Schema
-- This script adds normalized reference tables for student and staff data
-- Run this AFTER the main database-setup.sql

-- =====================================================
-- GLOBAL LISTS (Simple Reference Data)
-- =====================================================

-- Global list categories table
CREATE TABLE IF NOT EXISTS global_list_categories (
    id SERIAL PRIMARY KEY,
    category_key VARCHAR(100) UNIQUE NOT NULL,
    category_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Global list items table
CREATE TABLE IF NOT EXISTS global_list_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES global_list_categories(id) ON DELETE CASCADE,
    item_value VARCHAR(200) NOT NULL,
    item_code VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, item_value)
);

-- =====================================================
-- ACADEMIC STRUCTURE MODULES (Complex Entities)
-- =====================================================

-- Year Groups (e.g., Year 7, Year 8, etc.)
CREATE TABLE IF NOT EXISTS year_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    key_stage VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    academic_year VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Houses (e.g., Red House, Blue House, etc.)
CREATE TABLE IF NOT EXISTS houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    color VARCHAR(50),
    house_captain_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forms/Tutor Groups (e.g., 7A, 7B, etc.)
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    year_group_id UUID REFERENCES year_groups(id) ON DELETE SET NULL,
    form_tutor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments (e.g., Mathematics, Science, etc.)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    head_of_department_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    budget DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- UPDATE EXISTING TABLES TO USE FOREIGN KEYS
-- =====================================================

-- Add new foreign key columns to pupils table
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS year_group_id UUID REFERENCES year_groups(id) ON DELETE SET NULL;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS house_id UUID REFERENCES houses(id) ON DELETE SET NULL;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES forms(id) ON DELETE SET NULL;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS gender_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS nationality_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS religion_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS ethnicity_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE pupils ADD COLUMN IF NOT EXISTS sen_status_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;

-- Add new foreign key columns to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS gender_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS nationality_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS religion_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_type_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES global_list_items(id) ON DELETE SET NULL;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_global_list_items_category ON global_list_items(category_id);
CREATE INDEX IF NOT EXISTS idx_global_list_items_active ON global_list_items(is_active);
CREATE INDEX IF NOT EXISTS idx_year_groups_active ON year_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_houses_active ON houses(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_year_group ON forms(year_group_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

CREATE INDEX IF NOT EXISTS idx_pupils_year_group_id ON pupils(year_group_id);
CREATE INDEX IF NOT EXISTS idx_pupils_house_id ON pupils(house_id);
CREATE INDEX IF NOT EXISTS idx_pupils_form_id ON pupils(form_id);
CREATE INDEX IF NOT EXISTS idx_pupils_status_id ON pupils(status_id);

CREATE INDEX IF NOT EXISTS idx_staff_department_id ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_status_id ON staff(status_id);

-- =====================================================
-- SEED DATA FOR GLOBAL LISTS
-- =====================================================

-- Insert Global List Categories
INSERT INTO global_list_categories (category_key, category_name, description, sort_order) VALUES
    ('pupil_status', 'Pupil Status', 'Student enrollment status', 1),
    ('gender', 'Gender', 'Gender options', 2),
    ('nationality', 'Nationality', 'Nationalities', 3),
    ('religion', 'Religion', 'Religious affiliations', 4),
    ('ethnicity', 'Ethnicity', 'Ethnic backgrounds', 5),
    ('sen_status', 'SEN Status', 'Special Educational Needs status', 6),
    ('key_stage', 'Key Stage', 'Key Stage levels', 7),
    ('staff_status', 'Staff Status', 'Staff employment status', 8),
    ('employment_type', 'Employment Type', 'Type of employment contract', 9),
    ('job_title', 'Job Title', 'Staff job titles', 10),
    ('role_type', 'Role Type', 'Staff role classifications', 11)
ON CONFLICT (category_key) DO NOTHING;

-- Get category IDs for inserting items
DO $$
DECLARE
    cat_pupil_status INTEGER;
    cat_gender INTEGER;
    cat_nationality INTEGER;
    cat_religion INTEGER;
    cat_ethnicity INTEGER;
    cat_sen_status INTEGER;
    cat_key_stage INTEGER;
    cat_staff_status INTEGER;
    cat_employment_type INTEGER;
    cat_job_title INTEGER;
    cat_role_type INTEGER;
BEGIN
    SELECT id INTO cat_pupil_status FROM global_list_categories WHERE category_key = 'pupil_status';
    SELECT id INTO cat_gender FROM global_list_categories WHERE category_key = 'gender';
    SELECT id INTO cat_nationality FROM global_list_categories WHERE category_key = 'nationality';
    SELECT id INTO cat_religion FROM global_list_categories WHERE category_key = 'religion';
    SELECT id INTO cat_ethnicity FROM global_list_categories WHERE category_key = 'ethnicity';
    SELECT id INTO cat_sen_status FROM global_list_categories WHERE category_key = 'sen_status';
    SELECT id INTO cat_key_stage FROM global_list_categories WHERE category_key = 'key_stage';
    SELECT id INTO cat_staff_status FROM global_list_categories WHERE category_key = 'staff_status';
    SELECT id INTO cat_employment_type FROM global_list_categories WHERE category_key = 'employment_type';
    SELECT id INTO cat_job_title FROM global_list_categories WHERE category_key = 'job_title';
    SELECT id INTO cat_role_type FROM global_list_categories WHERE category_key = 'role_type';

    -- Pupil Status
    INSERT INTO global_list_items (category_id, item_value, item_code, is_default, sort_order) VALUES
        (cat_pupil_status, 'Active', 'ACTIVE', true, 1),
        (cat_pupil_status, 'Applicant', 'APPLICANT', false, 2),
        (cat_pupil_status, 'Former', 'FORMER', false, 3),
        (cat_pupil_status, 'Suspended', 'SUSPENDED', false, 4)
    ON CONFLICT DO NOTHING;

    -- Gender
    INSERT INTO global_list_items (category_id, item_value, item_code, sort_order) VALUES
        (cat_gender, 'Male', 'M', 1),
        (cat_gender, 'Female', 'F', 2),
        (cat_gender, 'Other', 'O', 3),
        (cat_gender, 'Prefer not to say', 'N', 4)
    ON CONFLICT DO NOTHING;

    -- Nationality (common ones)
    INSERT INTO global_list_items (category_id, item_value, item_code, sort_order) VALUES
        (cat_nationality, 'British', 'GB', 1),
        (cat_nationality, 'American', 'US', 2),
        (cat_nationality, 'Irish', 'IE', 3),
        (cat_nationality, 'Other', 'OTHER', 99)
    ON CONFLICT DO NOTHING;

    -- Religion (common ones)
    INSERT INTO global_list_items (category_id, item_value, item_code, sort_order) VALUES
        (cat_religion, 'Christianity', 'CHRISTIAN', 1),
        (cat_religion, 'Islam', 'ISLAM', 2),
        (cat_religion, 'Hinduism', 'HINDU', 3),
        (cat_religion, 'Buddhism', 'BUDDHIST', 4),
        (cat_religion, 'Judaism', 'JEWISH', 5),
        (cat_religion, 'Sikhism', 'SIKH', 6),
        (cat_religion, 'No Religion', 'NONE', 7),
        (cat_religion, 'Prefer not to say', 'UNDISCLOSED', 8),
        (cat_religion, 'Other', 'OTHER', 99)
    ON CONFLICT DO NOTHING;

    -- SEN Status
    INSERT INTO global_list_items (category_id, item_value, item_code, sort_order) VALUES
        (cat_sen_status, 'None', 'NONE', 1),
        (cat_sen_status, 'SEN Support', 'SUPPORT', 2),
        (cat_sen_status, 'EHCP', 'EHCP', 3)
    ON CONFLICT DO NOTHING;

    -- Key Stage
    INSERT INTO global_list_items (category_id, item_value, item_code, sort_order) VALUES
        (cat_key_stage, 'Key Stage 1', 'KS1', 1),
        (cat_key_stage, 'Key Stage 2', 'KS2', 2),
        (cat_key_stage, 'Key Stage 3', 'KS3', 3),
        (cat_key_stage, 'Key Stage 4', 'KS4', 4),
        (cat_key_stage, 'Key Stage 5', 'KS5', 5)
    ON CONFLICT DO NOTHING;

    -- Staff Status
    INSERT INTO global_list_items (category_id, item_value, item_code, is_default, sort_order) VALUES
        (cat_staff_status, 'Active', 'ACTIVE', true, 1),
        (cat_staff_status, 'On Leave', 'LEAVE', false, 2),
        (cat_staff_status, 'Former', 'FORMER', false, 3),
        (cat_staff_status, 'Suspended', 'SUSPENDED', false, 4)
    ON CONFLICT DO NOTHING;

    -- Employment Type
    INSERT INTO global_list_items (category_id, item_value, item_code, sort_order) VALUES
        (cat_employment_type, 'Full-time', 'FT', 1),
        (cat_employment_type, 'Part-time', 'PT', 2),
        (cat_employment_type, 'Contract', 'CONTRACT', 3),
        (cat_employment_type, 'Supply', 'SUPPLY', 4)
    ON CONFLICT DO NOTHING;

    -- Job Titles (examples)
    INSERT INTO global_list_items (category_id, item_value, sort_order) VALUES
        (cat_job_title, 'Teacher', 1),
        (cat_job_title, 'Head of Department', 2),
        (cat_job_title, 'Assistant Headteacher', 3),
        (cat_job_title, 'Headteacher', 4),
        (cat_job_title, 'Teaching Assistant', 5),
        (cat_job_title, 'Administrator', 6),
        (cat_job_title, 'Receptionist', 7)
    ON CONFLICT DO NOTHING;

    -- Role Types
    INSERT INTO global_list_items (category_id, item_value, sort_order) VALUES
        (cat_role_type, 'Teaching', 1),
        (cat_role_type, 'Administrative', 2),
        (cat_role_type, 'Support', 3),
        (cat_role_type, 'Leadership', 4)
    ON CONFLICT DO NOTHING;

END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON global_list_categories TO school_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON global_list_items TO school_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON year_groups TO school_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON houses TO school_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON forms TO school_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON departments TO school_user;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO school_user;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Data Normalization Schema Created Successfully!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'New Tables:';
    RAISE NOTICE '  - global_list_categories';
    RAISE NOTICE '  - global_list_items';
    RAISE NOTICE '  - year_groups';
    RAISE NOTICE '  - houses';
    RAISE NOTICE '  - forms';
    RAISE NOTICE '  - departments';
    RAISE NOTICE '';
    RAISE NOTICE 'Updated Tables:';
    RAISE NOTICE '  - pupils (added FK columns)';
    RAISE NOTICE '  - staff (added FK columns)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Old text columns still exist for backward compatibility';
    RAISE NOTICE '  2. New FK columns are available for normalized data';
    RAISE NOTICE '  3. Run data migration script to populate FK columns';
    RAISE NOTICE '=================================================';
END
$$;
