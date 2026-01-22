-- SmartTeach School Management System - Create Admin User Script
-- This script creates an initial administrator account with full access
-- Run this script AFTER running database-setup.sql

-- Connect to the smartTeach database before running this script

-- =====================================================
-- CREATE ADMIN STAFF MEMBER
-- =====================================================

-- First, create a staff record for the admin
INSERT INTO staff (
    id,
    first_name,
    middle_name,
    last_name,
    preferred_name,
    title,
    gender,
    staff_id,
    job_title,
    department,
    role_type,
    employment_type,
    status,
    work_email,
    is_teaching_staff,
    is_cover_staff
) VALUES (
    gen_random_uuid(),
    'System',
    '',
    'Administrator',
    'Admin',
    'Mr/Ms',
    'Other',
    'ADMIN001',
    'System Administrator',
    'Administration',
    'Administrative',
    'Full-time',
    'Active',
    'admin@smartteach.school',
    false,
    false
)
RETURNING id, first_name, last_name, staff_id;

-- Note: The above query will return the staff UUID. 
-- We need to use it in the next step.

-- =====================================================
-- CREATE ADMIN USER ACCOUNT
-- =====================================================

-- Create the admin user account
-- Password: admin123 (hashed with bcrypt)
-- IMPORTANT: Change this password after first login!

DO $$
DECLARE
    admin_staff_id UUID;
    admin_user_id INTEGER;
BEGIN
    -- Get the staff ID we just created (most recent admin staff)
    SELECT id INTO admin_staff_id
    FROM staff
    WHERE staff_id = 'ADMIN001'
    LIMIT 1;

    -- Delete existing admin user if exists (to recreate with correct password)
    DELETE FROM permissions WHERE user_id IN (SELECT id FROM users WHERE username = 'admin');
    DELETE FROM users WHERE username = 'admin';

    -- Create user account
    INSERT INTO users (
        username,
        password_hash,
        display_name,
        email,
        is_superuser,
        staff_id
    ) VALUES (
        'admin',
        '$2b$10$oSugDl4YJ8AQ4/7/aYZUsuwXkF8s8Jgvt8oWwiN4LrLO.aeIaVOeK', -- Password: admin123
        'System Administrator',
        'admin@smartteach.school',
        true,
        admin_staff_id
    )
    RETURNING id INTO admin_user_id;

    -- Grant all permissions to all modules
    INSERT INTO permissions (user_id, module, can_view, can_edit) VALUES
        (admin_user_id, 'PupilManager', true, true),
        (admin_user_id, 'StaffManager', true, true),
        (admin_user_id, 'RegistrationManager', true, true),
        (admin_user_id, 'RoomManager', true, true),
        (admin_user_id, 'SeatPlanning', true, true),
        (admin_user_id, 'TimetableManager', true, true),
        (admin_user_id, 'TeachingManager', true, true),
        (admin_user_id, 'CoverManager', true, true),
        (admin_user_id, 'ControlPanel', true, true);

    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Admin User Created Successfully!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Username: admin';
    RAISE NOTICE 'Password: admin123';
    RAISE NOTICE 'Staff ID: ADMIN001';
    RAISE NOTICE 'User ID: %', admin_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT SECURITY NOTE:';
    RAISE NOTICE 'Please change the admin password after first login!';
    RAISE NOTICE 'You can do this through the Control Panel > User Accounts';
    RAISE NOTICE '=================================================';
END
$$;

-- =====================================================
-- VERIFICATION QUERY (Optional)
-- =====================================================

-- Uncomment the query below to verify the admin user was created
-- SELECT 
--     u.id as user_id,
--     u.username,
--     u.display_name,
--     u.is_superuser,
--     s.staff_id,
--     s.first_name,
--     s.last_name,
--     s.job_title,
--     COUNT(p.id) as permission_count
-- FROM users u
-- LEFT JOIN staff s ON u.staff_id = s.id
-- LEFT JOIN permissions p ON u.id = p.user_id
-- WHERE u.username = 'admin'
-- GROUP BY u.id, u.username, u.display_name, u.is_superuser, s.staff_id, s.first_name, s.last_name, s.job_title;
