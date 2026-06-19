// controllers/reportesController.js — Generación de PDF y Excel
// Librerías: pdfkit (PDF), exceljs (XLSX)

const PDFDocument = require('pdfkit');
const ExcelJS     = require('exceljs');
const { pool }    = require('../config/db');

// ─── Helper: obtener datos de citas según rango de fechas ───────────────────
async function getCitasReporte(desde, hasta) {
  const [rows] = await pool.query(
    `SELECT c.id, c.fecha, c.hora, c.estado, c.motivo,
            CONCAT(p.nombre,' ',p.apellido) AS paciente, p.cedula,
            m.nombre AS medico, m.especialidad
     FROM citas c
     JOIN pacientes p ON p.id = c.paciente_id
     JOIN medicos   m ON m.id = c.medico_id
     WHERE c.fecha BETWEEN ? AND ?
     ORDER BY c.fecha, c.hora`,
    [desde, hasta]
  );
  return rows;
}

// ─── GET /api/reportes/citas/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD ──────────
async function citasPDF(req, res) {
  const { desde = new Date().toISOString().slice(0, 10), hasta = desde } = req.query;

  try {
    const datos = await getCitasReporte(desde, hasta);

    // Configurar headers de respuesta para descarga del PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="citas_${desde}_${hasta}.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // ── Encabezado ────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').text('Sistema de Gestión Médica', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Reporte de Citas Médicas', { align: 'center' });
    doc.fontSize(10).text(`Período: ${desde} al ${hasta}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Resumen ───────────────────────────────────────────────
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

    // ── Tabla de datos ────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').text('Detalle de Citas:');
    doc.moveDown(0.3);

    // Cabeceras de columna
    const cols = { fecha: 50, hora: 105, paciente: 155, medico: 295, estado: 420 };
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Fecha',    cols.fecha,    doc.y, { continued: true });
    doc.text('Hora',     cols.hora,     doc.y, { continued: true });
    doc.text('Paciente', cols.paciente, doc.y, { continued: true });
    doc.text('Médico',   cols.medico,   doc.y, { continued: true });
    doc.text('Estado',   cols.estado,   doc.y);
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke();
    doc.moveDown(0.3);

    // Filas de datos
    doc.font('Helvetica').fontSize(8);
    datos.forEach((c, i) => {
      if (doc.y > 720) { doc.addPage(); } // salto de página automático

      const y = doc.y;
      const bg = i % 2 === 0 ? '#f8f8f8' : '#ffffff';
      doc.rect(50, y - 2, 495, 14).fill(bg).fillColor('black');

      doc.text(c.fecha,     cols.fecha,    y, { width: 50 });
      doc.text(c.hora,      cols.hora,     y, { width: 48 });
      doc.text(c.paciente,  cols.paciente, y, { width: 135 });
      doc.text(c.medico,    cols.medico,   y, { width: 120 });
      doc.text(c.estado,    cols.estado,   y, { width: 90 });
      doc.moveDown(0.8);
    });

    // ── Pie de página ─────────────────────────────────────────
    doc.moveDown();
    doc.fontSize(8).fillColor('#888888')
      .text(`Generado el ${new Date().toLocaleString('es-DO')} — Sistema de Gestión Médica`,
        { align: 'center' });

    doc.end();

  } catch (err) {
    console.error('[reportesController.citasPDF]', err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, mensaje: 'Error al generar el PDF.' });
    }
  }
}

// ─── GET /api/reportes/citas/excel?desde=YYYY-MM-DD&hasta=YYYY-MM-DD ────────
async function citasExcel(req, res) {
  const { desde = new Date().toISOString().slice(0, 10), hasta = desde } = req.query;

  try {
    const datos = await getCitasReporte(desde, hasta);

    const workbook  = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión Médica';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Citas', {
      views: [{ state: 'frozen', ySplit: 3 }] // congela las primeras 3 filas
    });

    // ── Fila de título ────────────────────────────────────────
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Reporte de Citas: ${desde} al ${hasta}`;
    titleCell.font  = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    titleCell.font  = { bold: true, size: 14, color: { argb: 'FFFFFF' } };

    // ── Fila de resumen ───────────────────────────────────────
    sheet.getCell('A2').value = `Total: ${datos.length} citas`;
    sheet.getCell('A2').font  = { italic: true };

    // ── Cabeceras ─────────────────────────────────────────────
    sheet.getRow(3).values = ['#', 'Fecha', 'Hora', 'Paciente', 'Cédula', 'Médico', 'Especialidad', 'Estado', 'Motivo'];
    sheet.getRow(3).font   = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(3).fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } };
    sheet.getRow(3).alignment = { horizontal: 'center' };

    // ── Anchos de columna ─────────────────────────────────────
    sheet.columns = [
      { key: 'num',    width: 5  },
      { key: 'fecha',  width: 14 },
      { key: 'hora',   width: 10 },
      { key: 'pac',    width: 28 },
      { key: 'ced',    width: 16 },
      { key: 'med',    width: 28 },
      { key: 'esp',    width: 22 },
      { key: 'estado', width: 14 },
      { key: 'motivo', width: 35 },
    ];

    // ── Filas de datos ────────────────────────────────────────
    datos.forEach((c, i) => {
      const row = sheet.addRow([
        i + 1, c.fecha, c.hora, c.paciente, c.cedula,
        c.medico, c.especialidad, c.estado, c.motivo || ''
      ]);

      // Alternar color de fondo
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };
      }

      // Color de estado
      const estadoColores = {
        completada: 'D1FAE5', cancelada: 'FEE2E2',
        confirmada: 'DBEAFE', pendiente:  'FEF9C3'
      };
      row.getCell(8).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: estadoColores[c.estado] || 'FFFFFF' }
      };
    });

    // ── Bordes en toda la tabla ───────────────────────────────
    const borderStyle = { style: 'thin', color: { argb: 'CBD5E1' } };
    sheet.eachRow((row, rowNum) => {
      if (rowNum >= 3) {
        row.eachCell(cell => {
          cell.border = { top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle };
        });
      }
    });

    // Enviar como descarga
    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',
      `attachment; filename="citas_${desde}_${hasta}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('[reportesController.citasExcel]', err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, mensaje: 'Error al generar el Excel.' });
    }
  }
}

// ─── GET /api/reportes/estadisticas — Dashboard de datos ────────────────────
async function estadisticas(req, res) {
  try {
    const [[totales]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM pacientes)  AS total_pacientes,
        (SELECT COUNT(*) FROM medicos WHERE activo=1) AS total_medicos,
        (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE()) AS citas_hoy,
        (SELECT COUNT(*) FROM citas WHERE estado='pendiente') AS citas_pendientes`
    );

    const [citasPorMes] = await pool.query(
      `SELECT DATE_FORMAT(fecha,'%Y-%m') AS mes, COUNT(*) AS total
       FROM citas
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY mes ORDER BY mes`
    );

    const [porEspecialidad] = await pool.query(
      `SELECT m.especialidad, COUNT(*) AS total
       FROM citas c JOIN medicos m ON m.id = c.medico_id
       GROUP BY m.especialidad ORDER BY total DESC LIMIT 5`
    );

    res.json({ ok: true, totales, citasPorMes, porEspecialidad });
  } catch (err) {
    console.error('[reportesController.estadisticas]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener estadísticas.' });
  }
}

module.exports = { citasPDF, citasExcel, estadisticas };
