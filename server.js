require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { testConnection } = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/citas',     require('./routes/citas'));
app.use('/api/reportes',  require('./routes/reportes'));
app.use('/api/medicos',   require('./routes/medicos'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, mensaje: 'API funcionando correctamente 🏥', timestamp: new Date() });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Error global
app.use((err, req, res, next) => {
  console.error('[ERROR GLOBAL]', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
});

// Arrancar
async function iniciarServidor() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🏥 Sistema de Gestión Médica`);
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌱 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

iniciarServidor();