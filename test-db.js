const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('🔄 Conectando ao banco...');
    
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão bem sucedida!', result.rows[0]);
    
    const users = await pool.query('SELECT * FROM users');
    console.log('✅ Usuários encontrados:', users.rows.length);
    console.log('📋 Primeiros usuários:', users.rows.slice(0, 3));
    
    await pool.end();
    console.log('\n🎉 Banco de dados funcionando perfeitamente!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('Detalhes:', err);
  }
}

test();