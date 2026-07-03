const sql = require('mssql');
require('dotenv').config();

const config = {
  server:   process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME     || 'Database',
  user:     process.env.DB_USER     || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

async function testConnection() {
  try {
    const p = await getPool();
    await p.request().query('SELECT 1 AS test');
    console.log('✅ Conexión a SQL Server establecida correctamente');
  } catch (err) {
    console.error('❌ Error al conectar con SQL Server:', err.message);
    process.exit(1);
  }
}

module.exports = { sql, getPool, testConnection };