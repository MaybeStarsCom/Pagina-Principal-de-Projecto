// controllers/authController.js — Login y registro de usuarios

const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ ok: false, mensaje: 'Email y contraseña son requeridos.' });

  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(150), email.toLowerCase().trim())
      .query(`SELECT id, nombre, email, password, rol
              FROM usuarios
              WHERE email = @email AND activo = 1`);

    if (result.recordset.length === 0)
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas.' });

    const usuario = result.recordset[0];
    const valido  = await bcrypt.compare(password, usuario.password);

    if (!valido)
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas.' });

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      ok:      true,
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });

  } catch (err) {
    console.error('[authController.login] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}

async function registro(req, res) {
  const { nombre, email, password, rol = 'recepcionista' } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ ok: false, mensaje: 'Nombre, email y contraseña son requeridos.' });

  if (password.length < 8)
    return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' });

  const rolesValidos = ['admin', 'medico', 'recepcionista'];
  if (!rolesValidos.includes(rol))
    return res.status(400).json({ ok: false, mensaje: `Rol no válido.` });

  try {
    const pool   = await getPool();
    const existe = await pool.request()
      .input('email', sql.NVarChar(150), email.toLowerCase().trim())
      .query('SELECT id FROM usuarios WHERE email = @email');

    if (existe.recordset.length > 0)
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado.' });

    const hash = await bcrypt.hash(password, 10);
    const ins  = await pool.request()
      .input('nombre',   sql.NVarChar(100), nombre.trim())
      .input('email',    sql.NVarChar(150), email.toLowerCase().trim())
      .input('password', sql.NVarChar(255), hash)
      .input('rol',      sql.NVarChar(20),  rol)
      .query(`INSERT INTO usuarios (nombre, email, password, rol)
              OUTPUT INSERTED.id
              VALUES (@nombre, @email, @password, @rol)`);

    res.status(201).json({ ok: true, mensaje: 'Usuario registrado.', id: ins.recordset[0].id });

  } catch (err) {
    console.error('[authController.registro] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}

function perfil(req, res) {
  res.json({ ok: true, usuario: req.user });
}

module.exports = { login, registro, perfil };