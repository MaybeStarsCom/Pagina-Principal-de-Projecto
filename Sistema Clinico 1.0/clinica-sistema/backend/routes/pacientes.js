// routes/pacientes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/pacientesController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken); // todas las rutas requieren token

router.get('/',       ctrl.listar);
router.get('/:id',    ctrl.obtener);
router.post('/',      ctrl.crear);
router.put('/:id',    ctrl.actualizar);
router.delete('/:id', requireRole('admin'), ctrl.eliminar); // solo admin elimina

module.exports = router;
