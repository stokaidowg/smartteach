const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try with postgres user first, fall back to school_user
const configs = [
  { user: 'postgres', password: '123' },
  { user: 'postgres', password: 'postgres' },
  { user: 'postgres', password: '' },
  { user: 'school_user', password: '123' }
];

async function tryConnect(config) {
  const pool = new Pool({
    ...config,
    host: 'localhost',
    database: 'smartTeach',
    port: 5432,
  });
  
  try {
    await pool.query('SELECT 1');
    return pool;
  } catch (err) {
    await pool.end();
    return null;
  }
}

async function applyNormalization() {
  console.log('\n🔧 Applying Database Normalization Schema...\n');
  
  // Find working connection
  let pool = null;
  for (const config of configs) {
    console.log(`Trying connection as ${config.user}...`);
    pool = await tryConnect(config);
    if (pool) {
      console.log(`✅ Connected as ${config.user}\n`);
      break;
    }
  }
  
  if (!pool) {
    console.error('❌ Could not connect to database with any credentials');
    console.log('\nPlease run one of these commands manually:');
    console.log('  psql -U postgres -d smartTeach -f ..\\database-normalization.sql');
    console.log('  psql -U school_user -d smartTeach -f ..\\database-normalization.sql');
    process.exit(1);
  }
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database-normalization.sql');
    console.log('Reading SQL file:', sqlPath);
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Error: database-normalization.sql not found!');
      console.log('Expected location:', sqlPath);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    console.log('Executing SQL commands...');
    await pool.query(sql);
    
    console.log('✅ Schema applied successfully!\n');
    
    // Verify tables were created
    console.log('=== Verifying Tables ===');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('global_list_categories', 'global_list_items', 'year_groups', 'houses', 'forms', 'departments')
      ORDER BY table_name
    `);
    
    if (result.rows.length === 6) {
      console.log('✅ All 6 tables created:');
      result.rows.forEach(row => console.log('  ✓', row.table_name));
    } else {
      console.log('⚠️  Only', result.rows.length, 'tables created');
    }
    
    // Check row counts
    console.log('\n=== Initial Data ===');
    const categories = await pool.query('SELECT COUNT(*) as count FROM global_list_categories');
    const items = await pool.query('SELECT COUNT(*) as count FROM global_list_items');
    console.log(`Categories: ${categories.rows[0].count}`);
    console.log(`List Items: ${items.rows[0].count}`);
    
    console.log('\n✅ Normalization complete! You can now restart the application.');
    
  } catch (err) {
    console.error('\n❌ Error applying schema:');
    console.error(err.message);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    await pool.end();
  }
}

applyNormalization();
