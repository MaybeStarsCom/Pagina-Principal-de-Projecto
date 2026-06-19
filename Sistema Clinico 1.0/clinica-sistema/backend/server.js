// server.js — Punto de entrada del servidor Node.js + Express
// Arranque: node server.js  |  Desarrollo: npm run dev

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { testConnection } = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // URL del frontend React
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());                    // parsear JSON en el body
app.use(express.urlencoded({ extended: true }));

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/citas',     require('./routes/citas'));
app.use('/api/reportes',  require('./routes/reportes'));

// ── Ruta de salud (health check) ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mensaje: 'API funcionando correctamente 🏥', timestamp: new Date() });
});

// ── Manejo de rutas no encontradas ───────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// ── Manejo global de errores ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR GLOBAL]', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
});

// ── Arrancar servidor ─────────────────────────────────────────
async function iniciarServidor() {
  await testConnection(); // verificar BD antes de abrir el servidor
  app.listen(PORT, () => {
    console.log(`\n🏥 Sistema de Gestión Médica`);
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌱 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

iniciarServidor();
