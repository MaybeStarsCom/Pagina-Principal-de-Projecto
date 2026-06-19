// routes/citas.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/citasController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/',                      ctrl.listar);
router.post('/',                     ctrl.crear);
router.put('/:id/estado',            ctrl.cambiarEstado);
router.post('/:id/historial',        ctrl.registrarHistorial);

module.exports = router;

// ─────────────────────────────────────────────────────────────
// routes/reportes.js
// ─────────────────────────────────────────────────────────────
