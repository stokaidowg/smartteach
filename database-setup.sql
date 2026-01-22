-- SmartTeach School Management System - Database Setup Script
-- This script creates the complete database schema from scratch
-- 
-- INSTRUCTIONS FOR pgAdmin:
-- 1. First, run this script while connected to the 'postgres' database to create the smartTeach database and user
-- 2. Then, disconnect and reconnect to the 'smartTeach' database
-- 3. Run the script again (it will skip database creation and set up all tables)
--
-- INSTRUCTIONS FOR psql:
-- Simply run: psql -U postgres -f database-setup.sql

-- =====================================================
-- DATABASE AND USER SETUP
-- =====================================================

-- Create user if not exists (safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'school_user') THEN
        CREATE USER school_user WITH PASSWORD '123';
    END IF;
END
$$;

-- Create database if it doesn't exist (only works if connected to a different database)
-- Skip if already connected to smartTeach
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'smartTeach') THEN
        -- Note: This will only work from psql or when connected to postgres database
        -- In pgAdmin, you may need to create the database manually first
        EXECUTE 'CREATE DATABASE "smartTeach" WITH OWNER = postgres ENCODING = ''UTF8''';
    END IF;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot create database from this context. Please create smartTeach database manually or run from postgres database.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Database smartTeach may already exist or cannot be created from this connection.';
END
$$;

-- If you need to drop and recreate (CAUTION: Deletes all data!)
-- Uncomment the lines below only if you want to start fresh:
-- DROP DATABASE IF EXISTS "smartTeach";
-- CREATE DATABASE "smartTeach" WITH OWNER = postgres ENCODING = 'UTF8';
-- Then reconnect to smartTeach database and run the rest of this script.

-- =====================================================
-- TABLES
-- =====================================================

-- Pupils Table
CREATE TABLE IF NOT EXISTS pupils (
    id UUID PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    dob DATE,
    gender VARCHAR(50),
    nationality VARCHAR(100),
    country_of_birth VARCHAR(100),
    languages TEXT,
    religion VARCHAR(100),
    ethnicity VARCHAR(100),
    photo TEXT,
    sen_status VARCHAR(100),
    sen_details TEXT,
    behaviour_notes TEXT,
    year_group VARCHAR(50),
    form VARCHAR(50),
    house VARCHAR(100),
    tutor VARCHAR(100),
    enrollment_date DATE,
    status VARCHAR(50),
    key_stage VARCHAR(50),
    leaving_date DATE,
    home_address TEXT,
    primary_phone VARCHAR(50),
    email VARCHAR(255),
    parents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    title VARCHAR(50),
    gender VARCHAR(50),
    dob DATE,
    national_id VARCHAR(50),
    staff_id VARCHAR(50) UNIQUE,
    photo TEXT,
    nationality VARCHAR(100),
    languages TEXT,
    religion VARCHAR(100),
    job_title VARCHAR(100),
    department VARCHAR(100),
    role_type VARCHAR(100),
    line_manager VARCHAR(100),
    start_date DATE,
    employment_type VARCHAR(100),
    status VARCHAR(50),
    working_hours VARCHAR(100),
    teaching_subjects TEXT,
    year_responsibility VARCHAR(100),
    work_email VARCHAR(255),
    personal_email VARCHAR(255),
    phone_mobile VARCHAR(50),
    phone_work VARCHAR(50),
    phone_home VARCHAR(50),
    home_address TEXT,
    emergency_contact JSONB,
    qualifications JSONB,
    safeguarding VARCHAR(255),
    first_aid VARCHAR(255),
    background_check VARCHAR(255),
    documents JSONB,
    payroll JSONB,
    schedule JSONB,
    notes TEXT,
    is_teaching_staff BOOLEAN DEFAULT false,
    is_cover_staff BOOLEAN DEFAULT false,
    max_teaching_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(200),
    email VARCHAR(255),
    is_superuser BOOLEAN DEFAULT false,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module)
);

-- Buildings Table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    room_code VARCHAR(50) NOT NULL,
    room_name VARCHAR(200),
    is_teaching_room BOOLEAN DEFAULT false,
    is_cover_room BOOLEAN DEFAULT false,
    capacity INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, room_code)
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sets Table (Teaching Classes)
CREATE TABLE IF NOT EXISTS sets (
    id UUID PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Set Teachers (Many-to-Many)
CREATE TABLE IF NOT EXISTS set_teachers (
    set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (set_id, staff_id)
);

-- Set Pupils (Many-to-Many)
CREATE TABLE IF NOT EXISTS set_pupils (
    set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    pupil_id UUID REFERENCES pupils(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (set_id, pupil_id)
);

-- Set Links (for linked sets)
CREATE TABLE IF NOT EXISTS set_links (
    set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    linked_set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (set_id, linked_set_id)
);

-- Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
    id UUID PRIMARY KEY,
    set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    period INTEGER NOT NULL,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(set_id, day_of_week, period)
);

-- Staff Appointments Table
CREATE TABLE IF NOT EXISTS staff_appointments (
    id UUID PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    period INTEGER NOT NULL,
    title VARCHAR(200),
    notes TEXT,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registration Codes Table
CREATE TABLE IF NOT EXISTS registration_codes (
    status VARCHAR(50) PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT
);

-- Registration Table
CREATE TABLE IF NOT EXISTS registration (
    id UUID PRIMARY KEY,
    set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    timetable_id UUID REFERENCES timetable(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    pupil_id UUID REFERENCES pupils(id) ON DELETE CASCADE,
    status VARCHAR(50) REFERENCES registration_codes(status),
    notes TEXT,
    minutes_late INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(set_id, timetable_id, date, pupil_id)
);

-- Seat Plans Table
CREATE TABLE IF NOT EXISTS seat_plans (
    id UUID PRIMARY KEY,
    set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    seat_row INTEGER NOT NULL,
    seat_col INTEGER NOT NULL,
    pupil_id UUID REFERENCES pupils(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(set_id, room_id, seat_row, seat_col)
);

-- Staff Absences Table
CREATE TABLE IF NOT EXISTS staff_absences (
    id UUID PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cover Allocations Table
CREATE TABLE IF NOT EXISTS cover_allocations (
    id UUID PRIMARY KEY,
    timetable_id UUID REFERENCES timetable(id) ON DELETE CASCADE,
    absent_staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    cover_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pupils_status ON pupils(status);
CREATE INDEX IF NOT EXISTS idx_pupils_year_group ON pupils(year_group);
CREATE INDEX IF NOT EXISTS idx_pupils_form ON pupils(form);
CREATE INDEX IF NOT EXISTS idx_pupils_house ON pupils(house);

CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_is_teaching ON staff(is_teaching_staff);
CREATE INDEX IF NOT EXISTS idx_staff_is_cover ON staff(is_cover_staff);

CREATE INDEX IF NOT EXISTS idx_timetable_set ON timetable(set_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_room ON timetable(room_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day_period ON timetable(day_of_week, period);

CREATE INDEX IF NOT EXISTS idx_registration_date ON registration(date);
CREATE INDEX IF NOT EXISTS idx_registration_pupil ON registration(pupil_id);
CREATE INDEX IF NOT EXISTS idx_registration_set ON registration(set_id);

CREATE INDEX IF NOT EXISTS idx_cover_date ON cover_allocations(date);
CREATE INDEX IF NOT EXISTS idx_staff_absences_dates ON staff_absences(start_date, end_date);

-- =====================================================
-- DEFAULT REGISTRATION CODES
-- =====================================================

INSERT INTO registration_codes (status, code, description) VALUES
    ('Present', '/', 'Present in class'),
    ('Absent', 'A', 'Absent without authorization'),
    ('Authorized Absence', 'AA', 'Authorized absence (sick, appointment, etc.)'),
    ('Late', 'L', 'Late to class'),
    ('Excused', 'E', 'Excused absence'),
    ('Medical', 'M', 'Medical appointment'),
    ('Educational', 'ED', 'Educational visit/activity')
ON CONFLICT (status) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_user;

-- Grant permissions on sequences (for SERIAL columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO school_user;

-- Grant default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO school_user;

-- =====================================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- =====================================================

-- Sample Building
INSERT INTO buildings (id, name) VALUES
    (gen_random_uuid(), 'Main Building'),
    (gen_random_uuid(), 'Science Block'),
    (gen_random_uuid(), 'Sports Hall')
ON CONFLICT DO NOTHING;

-- You can add more sample data here if needed

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'SmartTeach Database Setup Complete!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Database: smartTeach';
    RAISE NOTICE 'User: school_user';
    RAISE NOTICE 'Password: 123';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - pupils';
    RAISE NOTICE '  - staff';
    RAISE NOTICE '  - users';
    RAISE NOTICE '  - permissions';
    RAISE NOTICE '  - buildings';
    RAISE NOTICE '  - rooms';
    RAISE NOTICE '  - subjects';
    RAISE NOTICE '  - sets';
    RAISE NOTICE '  - set_teachers';
    RAISE NOTICE '  - set_pupils';
    RAISE NOTICE '  - set_links';
    RAISE NOTICE '  - timetable';
    RAISE NOTICE '  - staff_appointments';
    RAISE NOTICE '  - registration';
    RAISE NOTICE '  - registration_codes';
    RAISE NOTICE '  - seat_plans';
    RAISE NOTICE '  - staff_absences';
    RAISE NOTICE '  - cover_allocations';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update backend connection strings if needed';
    RAISE NOTICE '  2. Create initial admin user via API or SQL';
    RAISE NOTICE '  3. Start the backend server';
    RAISE NOTICE '=================================================';
END
$$;
