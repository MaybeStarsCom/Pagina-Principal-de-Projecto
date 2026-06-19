// controllers/citasController.js — CRUD de citas médicas

const { pool } = require('../config/db');

/** GET /api/citas — Listar citas con filtros opcionales */
async function listar(req, res) {
  const { fecha, medico_id, estado, paciente_id } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  if (fecha)       { where += ' AND c.fecha = ?';        params.push(fecha); }
  if (medico_id)   { where += ' AND c.medico_id = ?';    params.push(medico_id); }
  if (estado)      { where += ' AND c.estado = ?';       params.push(estado); }
  if (paciente_id) { where += ' AND c.paciente_id = ?';  params.push(paciente_id); }

  try {
    const [citas] = await pool.query(
      `SELECT c.id, c.fecha, c.hora, c.motivo, c.estado, c.notas,
              p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, p.cedula,
              m.nombre AS medico_nombre, m.especialidad
       FROM citas c
       JOIN pacientes p ON p.id = c.paciente_id
       JOIN medicos   m ON m.id = c.medico_id
       ${where}
       ORDER BY c.fecha DESC, c.hora ASC
       LIMIT 100`,
      params
    );

    res.json({ ok: true, total: citas.length, datos: citas });
  } catch (err) {
    console.error('[citasController.listar]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener citas.' });
  }
}

/** POST /api/citas — Crear nueva cita */
async function crear(req, res) {
  const { paciente_id, medico_id, fecha, hora, motivo } = req.body;

  if (!paciente_id || !medico_id || !fecha || !hora) {
    return res.status(400).json({
      ok: false, mensaje: 'paciente_id, medico_id, fecha y hora son requeridos.'
    });
  }

  try {
    // Verificar que el médico no tenga otra cita a esa hora
    const [[conflicto]] = await pool.query(
      `SELECT id FROM citas
       WHERE medico_id = ? AND fecha = ? AND hora = ? AND estado != 'cancelada'`,
      [medico_id, fecha, hora]
    );

    if (conflicto) {
      return res.status(409).json({
        ok: false, mensaje: 'El médico ya tiene una cita programada a esa hora.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paciente_id, medico_id, fecha, hora, motivo || null, req.user.id]
    );

    res.status(201).json({ ok: true, mensaje: 'Cita registrada.', id: result.insertId });
  } catch (err) {
    console.error('[citasController.crear]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la cita.' });
  }
}

/** PUT /api/citas/:id/estado — Cambiar estado de una cita */
async function cambiarEstado(req, res) {
  const { id } = req.params;
  const { estado, notas } = req.body;
  const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({
      ok: false, mensaje: `Estado inválido. Opciones: ${estadosValidos.join(', ')}.`
    });
  }

  try {
    const [result] = await pool.query(
      'UPDATE citas SET estado = ?, notas = ? WHERE id = ?',
      [estado, notas || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
    }

    res.json({ ok: true, mensaje: `Cita marcada como "${estado}".` });
  } catch (err) {
    console.error('[citasController.cambiarEstado]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la cita.' });
  }
}

/** POST /api/citas/:id/historial — Registrar consulta médica */
async function registrarHistorial(req, res) {
  const { id } = req.params;
  const { diagnostico, tratamiento, receta, peso_kg, presion, temperatura } = req.body;

  if (!diagnostico) {
    return res.status(400).json({ ok: false, mensaje: 'El diagnóstico es requerido.' });
  }

  try {
    // Obtener datos de la cita
    const [[cita]] = await pool.query(
      'SELECT * FROM citas WHERE id = ? AND estado = "confirmada"', [id]
    );

    if (!cita) {
      return res.status(404).json({
        ok: false, mensaje: 'Cita no encontrada o no está confirmada.'
      });
    }

    await pool.query(
      `INSERT INTO historial_clinico
        (cita_id, paciente_id, medico_id, diagnostico, tratamiento, receta, peso_kg, presion, temperatura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, cita.paciente_id, cita.medico_id, diagnostico,
       tratamiento || null, receta || null,
       peso_kg || null, presion || null, temperatura || null]
    );

    // Marcar la cita como completada automáticamente
    await pool.query("UPDATE citas SET estado='completada' WHERE id=?", [id]);

    res.status(201).json({ ok: true, mensaje: 'Historial clínico registrado.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, mensaje: 'Esta cita ya tiene historial registrado.' });
    }
    console.error('[citasController.registrarHistorial]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar historial.' });
  }
}

module.exports = { listar, crear, cambiarEstado, registrarHistorial };
