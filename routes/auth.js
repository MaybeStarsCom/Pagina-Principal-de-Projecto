// routes/auth.js
const express = require('express');
const router  = express.Router();
const { login, registro, perfil } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/login',    login);
router.post('/registro', verifyToken, requireRole('admin'), registro); // solo admin crea usuarios
router.get('/perfil',    verifyToken, perfil);

module.exports = router;
