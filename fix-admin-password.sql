-- Quick fix: Update admin user password hash
-- Run this in pgAdmin connected to smartTeach database

UPDATE users 
SET password_hash = '$2b$10$oSugDl4YJ8AQ4/7/aYZUsuwXkF8s8Jgvt8oWwiN4LrLO.aeIaVOeK'
WHERE username = 'admin';

-- Verify the update
SELECT id, username, display_name, is_superuser, 
       LEFT(password_hash, 20) || '...' as password_hash_preview
FROM users 
WHERE username = 'admin';
