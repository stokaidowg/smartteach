const { Pool } = require('pg');

// Connect as postgres superuser
const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  database: 'smartTeach',
  port: 5432,
});

async function grantPermissions() {
  console.log('\n🔧 Granting permissions to school_user...\n');
  
  try {
    await pool.query('GRANT ALL PRIVILEGES ON SCHEMA public TO school_user;');
    console.log('✅ Schema permissions granted');
    
    await pool.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_user;');
    console.log('✅ Table permissions granted');
    
    await pool.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_user;');
    console.log('✅ Sequence permissions granted');
    
    await pool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO school_user;');
    console.log('✅ Default table privileges set');
    
    await pool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO school_user;');
    console.log('✅ Default sequence privileges set');
    
    console.log('\n✅ All permissions granted successfully!');
    console.log('You can now run: node apply-normalization-node.js');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

grantPermissions();
