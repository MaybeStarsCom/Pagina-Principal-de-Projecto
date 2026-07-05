// middleware/auth.js — Verificación de tokens JWT
// Se aplica a todas las rutas protegidas

const jwt = require('jsonwebtoken');

/**
 * verifyToken — Middleware que valida el JWT del header Authorization.
 * Si el token es válido, adjunta el payload al objeto req.user.
 */
function verifyToken(req, res, next) {
  // Esperar cabecera: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Acceso denegado. Se requiere token de autenticación.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, nombre, email, rol, iat, exp }
    next();
  } catch (err) {
    // Distinguir entre token expirado y token inválido
    const mensaje = err.name === 'TokenExpiredError'
      ? 'La sesión ha expirado. Por favor, inicia sesión de nuevo.'
      : 'Token inválido.';

    return res.status(403).json({ ok: false, mensaje });
  }
}

/**
 * requireRole — Middleware de autorización por rol.
 * Uso: router.delete('/...', verifyToken, requireRole('admin'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso restringido. Se requiere rol: ${roles.join(' o ')}.`,
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
