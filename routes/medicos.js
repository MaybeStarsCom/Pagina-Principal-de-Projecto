const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/medicosController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/',           ctrl.listar);
router.get('/:id',        ctrl.obtener);
router.post('/',          ctrl.crear);
router.put('/:id',        ctrl.actualizar);
router.put('/:id/estado', ctrl.toggleActivo);
router.delete('/:id',     requireRole('admin'), ctrl.eliminar);

module.exports = router;