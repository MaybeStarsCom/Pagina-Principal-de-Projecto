// routes/reportes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportesController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/citas/pdf',      ctrl.citasPDF);
router.get('/citas/excel',    ctrl.citasExcel);
router.get('/estadisticas',   ctrl.estadisticas);

module.exports = router;
