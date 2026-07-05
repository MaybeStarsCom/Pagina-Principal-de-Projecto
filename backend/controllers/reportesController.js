const PDFDocument = require('pdfkit');
const ExcelJS     = require('exceljs');
const { getPool, sql } = require('../config/db');

// ── Helper: obtener citas por rango de fechas ────
async function getCitasReporte(desde, hasta) {
  const pool = await getPool();
  const result = await pool.request()
    .input('desde', sql.Date, desde)
    .input('hasta', sql.Date, hasta)
    .query(`SELECT c.id, c.fecha, c.hora, c.estado, c.motivo,
                   CONCAT(p.nombre,' ',p.apellido) AS paciente, p.cedula,
                   m.nombre AS medico, m.especialidad
            FROM citas c
            JOIN pacientes p ON p.id = c.paciente_id
            JOIN medicos   m ON m.id = c.medico_id
            WHERE c.fecha BETWEEN @desde AND @hasta
            ORDER BY c.fecha, c.hora`);
  return result.recordset;
}

// ── GET /api/reportes/estadisticas ───────────────
async function estadisticas(req, res) {
  try {
    const pool = await getPool();

    const totales = await pool.request().query(
      `SELECT
        (SELECT COUNT(*) FROM pacientes)               AS total_pacientes,
        (SELECT COUNT(*) FROM medicos WHERE activo=1)  AS total_medicos,
        (SELECT COUNT(*) FROM citas WHERE CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)) AS citas_hoy,
        (SELECT COUNT(*) FROM citas WHERE estado='pendiente') AS citas_pendientes`
    );

    const citasPorMes = await pool.request().query(
      `SELECT FORMAT(fecha,'yyyy-MM') AS mes, COUNT(*) AS total
       FROM citas
       WHERE fecha >= DATEADD(MONTH, -6, GETDATE())
       GROUP BY FORMAT(fecha,'yyyy-MM')
       ORDER BY mes`
    );

    const porEspecialidad = await pool.request().query(
      `SELECT TOP 5 m.especialidad, COUNT(*) AS total
       FROM citas c
       JOIN medicos m ON m.id = c.medico_id
       GROUP BY m.especialidad
       ORDER BY total DESC`
    );

    res.json({
      ok: true,
      totales:        totales.recordset[0],
      citasPorMes:    citasPorMes.recordset,
      porEspecialidad: porEspecialidad.recordset,
    });

  } catch (err) {
    console.error('[reportesController.estadisticas] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

// ── GET /api/reportes/citas/pdf ──────────────────
async function citasPDF(req, res) {
  const { desde = new Date().toISOString().slice(0,10), hasta = desde } = req.query;

  try {
    const datos = await getCitasReporte(desde, hasta);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="citas_${desde}_${hasta}.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('Sistema de Gestión Médica', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Reporte de Citas Médicas', { align: 'center' });
    doc.fontSize(10).text(`Período: ${desde} al ${hasta}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Resumen
    const resumen = datos.reduce((acc, c) => {
      acc[c.estado] = (acc[c.estado] || 0) + 1;
      return acc;
    }, {});

    doc.fontSize(12).font('Helvetica-Bold').text('Resumen:');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total de citas: ${datos.length}`);
    Object.entries(resumen).forEach(([estado, cant]) => {
      doc.text(`  • ${estado.charAt(0).toUpperCase() + estado.slice(1)}: ${cant}`);
    });
    doc.moveDown();

    // Tabla
    doc.fontSize(11).font('Helvetica-Bold').text('Detalle de Citas:');
    doc.moveDown(0.3);

    const cols = { fecha:50, hora:105, paciente:155, medico:295, estado:420 };
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Fecha',    cols.fecha,    doc.y, { continued: true });
    doc.text('Hora',     cols.hora,     doc.y, { continued: true });
    doc.text('Paciente', cols.paciente, doc.y, { continued: true });
    doc.text('Médico',   cols.medico,   doc.y, { continued: true });
    doc.text('Estado',   cols.estado,   doc.y);
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(8);
    datos.forEach((c, i) => {
      if (doc.y > 720) doc.addPage();
      const y  = doc.y;
      const bg = i % 2 === 0 ? '#f8f8f8' : '#ffffff';
      doc.rect(50, y - 2, 495, 14).fill(bg).fillColor('black');

      const fecha = c.fecha ? new Date(c.fecha).toISOString().slice(0,10) : '—';
      const hora  = c.hora  ? String(c.hora).slice(0,5) : '—';

      doc.text(fecha,    cols.fecha,    y, { width: 50  });
      doc.text(hora,     cols.hora,     y, { width: 48  });
      doc.text(c.paciente,  cols.paciente, y, { width: 135 });
      doc.text(c.medico,    cols.medico,   y, { width: 120 });
      doc.text(c.estado,    cols.estado,   y, { width: 90  });
      doc.moveDown(0.8);
    });

    // Pie
    doc.moveDown();
    doc.fontSize(8).fillColor('#888888')
      .text(`Generado el ${new Date().toLocaleString('es-DO')} — Sistema de Gestión Médica`, { align: 'center' });

    doc.end();

  } catch (err) {
    console.error('[reportesController.citasPDF] ERROR:', err.message);
    if (!res.headersSent)
      res.status(500).json({ ok: false, mensaje: err.message });
  }
}

// ── GET /api/reportes/citas/excel ────────────────
async function citasExcel(req, res) {
  const { desde = new Date().toISOString().slice(0,10), hasta = desde } = req.query;

  try {
    const datos = await getCitasReporte(desde, hasta);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión Médica';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Citas', {
      views: [{ state: 'frozen', ySplit: 3 }]
    });

    // Título
    sheet.mergeCells('A1:G1');
    const title = sheet.getCell('A1');
    title.value     = `Reporte de Citas: ${desde} al ${hasta}`;
    title.font      = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    title.alignment = { horizontal: 'center' };
    title.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };

    sheet.getCell('A2').value = `Total: ${datos.length} citas`;
    sheet.getCell('A2').font  = { italic: true };

    // Cabeceras
    sheet.getRow(3).values = ['#','Fecha','Hora','Paciente','Cédula','Médico','Especialidad','Estado','Motivo'];
    sheet.getRow(3).font   = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(3).fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } };
    sheet.getRow(3).alignment = { horizontal: 'center' };

    sheet.columns = [
      { width: 5  }, { width: 14 }, { width: 10 }, { width: 28 },
      { width: 16 }, { width: 28 }, { width: 22 }, { width: 14 }, { width: 35 },
    ];

    // Datos
    const estadoColores = {
      completada: 'D1FAE5', cancelada: 'FEE2E2',
      confirmada: 'DBEAFE', pendiente: 'FEF9C3'
    };

    datos.forEach((c, i) => {
      const fecha = c.fecha ? new Date(c.fecha).toISOString().slice(0,10) : '—';
      const hora  = c.hora  ? String(c.hora).slice(0,5) : '—';

      const row = sheet.addRow([
        i + 1, fecha, hora, c.paciente, c.cedula,
        c.medico, c.especialidad, c.estado, c.motivo || ''
      ]);

      if (i % 2 === 0)
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };

      row.getCell(8).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: estadoColores[c.estado] || 'FFFFFF' }
      };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="citas_${desde}_${hasta}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('[reportesController.citasExcel] ERROR:', err.message);
    if (!res.headersSent)
      res.status(500).json({ ok: false, mensaje: err.message });
  }
}

module.exports = { estadisticas, citasPDF, citasExcel };