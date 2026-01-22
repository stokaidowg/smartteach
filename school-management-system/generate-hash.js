// Generate correct bcrypt hash for admin123 password
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('BCrypt Hash:', hash);
    console.log('\nUse this hash in the SQL script:');
    console.log(`'${hash}'`);
}

generateHash();
