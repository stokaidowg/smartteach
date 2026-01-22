// Verify admin user in database and test password
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'school_user',
  host: 'localhost',
  database: 'smartTeach',
  password: '123',
  port: 5432,
});

async function verifyAdmin() {
  try {
    // Get admin user from database
    const result = await pool.query("SELECT * FROM users WHERE username = 'admin'");
    
    if (result.rows.length === 0) {
      console.log('❌ ERROR: Admin user not found in database!');
      console.log('You need to run create-admin-user.sql');
      return;
    }
    
    const user = result.rows[0];
    console.log('✓ Admin user found in database:');
    console.log('  ID:', user.id);
    console.log('  Username:', user.username);
    console.log('  Display Name:', user.display_name);
    console.log('  Is Superuser:', user.is_superuser);
    console.log('  Password Hash:', user.password_hash);
    console.log('');
    
    // Test password
    const testPassword = 'admin123';
    console.log('Testing password: "admin123"');
    
    const match = await bcrypt.compare(testPassword, user.password_hash);
    
    if (match) {
      console.log('✓ Password verification: SUCCESS');
      console.log('  The password "admin123" is correct!');
    } else {
      console.log('❌ Password verification: FAILED');
      console.log('  The password hash in the database does not match "admin123"');
      console.log('  You need to re-run create-admin-user.sql with the updated hash');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

verifyAdmin();
