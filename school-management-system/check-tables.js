const { Pool } = require('pg');

const pool = new Pool({
  user: 'school_user',
  password: '123',
  host: 'localhost',
  database: 'smartTeach',
  port: 5432,
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('global_list_categories', 'global_list_items', 'year_groups', 'houses', 'forms', 'departments')
      ORDER BY table_name
    `);
    
    console.log('\n=== Normalized Tables Status ===');
    if (result.rows.length === 0) {
      console.log('❌ No normalized tables found!');
      console.log('\nYou need to apply the normalization schema:');
      console.log('Run: node apply-normalization-node.js');
    } else {
      console.log('✓ Found tables:');
      result.rows.forEach(row => console.log('  -', row.table_name));
      
      // Check counts
      console.log('\n=== Table Row Counts ===');
      for (const table of result.rows) {
        const count = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`${table.table_name}: ${count.rows[0].count} rows`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTables();
