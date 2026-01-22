// Test database connection for SmartTeach
// Run this file to verify your database connection is working
// Usage: node test-db-connection.js

const { Pool } = require('pg');

const pool = new Pool({
  user: 'school_user',
  host: 'localhost',
  database: 'smartTeach',
  password: '123',
  port: 5432,
});

console.log('=================================================');
console.log('Testing SmartTeach Database Connection...');
console.log('=================================================');
console.log('Configuration:');
console.log('  Host:     localhost');
console.log('  Port:     5432');
console.log('  Database: smartTeach');
console.log('  User:     school_user');
console.log('=================================================\n');

async function testConnection() {
  try {
    console.log('Attempting to connect...\n');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL successfully!\n');
    
    // Test database access
    const dbCheck = await client.query('SELECT current_database(), current_user, version()');
    console.log('Database Information:');
    console.log('  Current Database:', dbCheck.rows[0].current_database);
    console.log('  Current User:', dbCheck.rows[0].current_user);
    console.log('  PostgreSQL Version:', dbCheck.rows[0].version.split(',')[0]);
    console.log('');
    
    // Test tables exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables found:', tableCheck.rows.length);
    if (tableCheck.rows.length > 0) {
      console.log('  Tables:');
      tableCheck.rows.forEach(row => {
        console.log(`    - ${row.table_name}`);
      });
    } else {
      console.log('  ⚠ WARNING: No tables found! You need to run database-setup.sql');
    }
    console.log('');
    
    // Test users table
    try {
      const userCheck = await client.query('SELECT COUNT(*) FROM users');
      console.log(`✓ Users table accessible (${userCheck.rows[0].count} users found)`);
      
      const adminCheck = await client.query("SELECT username, is_superuser FROM users WHERE username = 'admin'");
      if (adminCheck.rows.length > 0) {
        console.log('✓ Admin user found:', adminCheck.rows[0]);
      } else {
        console.log('⚠ Admin user not found - run create-admin-user.sql');
      }
    } catch (err) {
      console.log('⚠ Could not query users table:', err.message);
    }
    
    client.release();
    console.log('\n=================================================');
    console.log('✓ DATABASE CONNECTION TEST PASSED!');
    console.log('=================================================\n');
    
  } catch (error) {
    console.error('\n=================================================');
    console.error('✗ DATABASE CONNECTION TEST FAILED!');
    console.error('=================================================');
    console.error('Error Details:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Possible causes:');
      console.error('  1. PostgreSQL server is not running');
      console.error('  2. PostgreSQL is running on a different port');
      console.error('  3. PostgreSQL is not accepting TCP/IP connections');
      console.error('');
      console.error('Solutions:');
      console.error('  - Start PostgreSQL service');
      console.error('  - Check PostgreSQL is listening on port 5432');
      console.error('  - Check pg_hba.conf allows local connections');
    } else if (error.code === '28P01') {
      console.error('Possible causes:');
      console.error('  1. User "school_user" does not exist');
      console.error('  2. Password is incorrect');
      console.error('  3. User lacks permissions');
      console.error('');
      console.error('Solutions:');
      console.error('  - Run database-setup.sql to create the user');
      console.error('  - Verify password is "123"');
    } else if (error.code === '3D000') {
      console.error('Possible causes:');
      console.error('  1. Database "smartTeach" does not exist');
      console.error('');
      console.error('Solutions:');
      console.error('  - Run database-setup.sql to create the database');
      console.error('  - Check database name spelling (case-sensitive!)');
    }
    
    console.error('\n=================================================\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
