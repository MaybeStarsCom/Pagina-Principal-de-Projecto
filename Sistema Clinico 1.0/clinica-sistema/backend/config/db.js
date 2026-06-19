// config/db.js — Pool de conexiones MySQL
// Usa pool en lugar de conexión única para manejar múltiples peticiones simultáneas

const mysql = require('mysql2/promise');
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

// Verificar conexión al arrancar el servidor
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    conn.release();
  } catch (err) {
    console.error('❌ Error al conectar con MySQL:', err.message);
    process.exit(1); // detener el servidor si no hay BD
  }
}

module.exports = { pool, testConnection };
