// controllers/authController.js — Login y registro de usuarios

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;

  // Validación básica de entrada
  if (!email || !password) {
    return res.status(400).json({ ok: false, mensaje: 'Email y contraseña son requeridos.' });
  }

  try {
    // Buscar usuario activo por email
    const [rows] = await pool.query(
      'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? AND activo = TRUE',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      // Respuesta genérica para no revelar si el email existe
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas.' });
    }

    const usuario = rows[0];

    // Comparar contraseña con hash almacenado
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas.' });
    }

    // Generar JWT con datos mínimos necesarios
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });

  } catch (err) {
    console.error('[authController.login]', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}

/**
 * POST /api/auth/registro
 * Body: { nombre, email, password, rol }
 * Solo accesible por administradores (proteger la ruta con requireRole)
 */
async function registro(req, res) {
  const { nombre, email, password, rol = 'recepcionista' } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ ok: false, mensaje: 'Nombre, email y contraseña son requeridos.' });
  }

  // Validar fortaleza mínima de contraseña
  if (password.length < 8) {
    return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  const rolesPermitidos = ['admin', 'medico', 'recepcionista'];
  if (!rolesPermitidos.includes(rol)) {
    return res.status(400).json({ ok: false, mensaje: `Rol no válido. Opciones: ${rolesPermitidos.join(', ')}.` });
  }

  try {
    // Verificar si el email ya existe
    const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe.length > 0) {
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado.' });
    }

    // Hashear contraseña con bcrypt (costo 10 = equilibrio seguridad/velocidad)
    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre.trim(), email.toLowerCase().trim(), hash, rol]
    );

    res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado correctamente.',
      id: result.insertId,
    });

  } catch (err) {
    console.error('[authController.registro]', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
}

/**
 * GET /api/auth/perfil
 * Retorna los datos del usuario autenticado (desde el token)
 */
function perfil(req, res) {
  res.json({ ok: true, usuario: req.user });
}

module.exports = { login, registro, perfil };
