// controllers/pacientesController.js — CRUD completo de pacientes

const { pool } = require('../config/db');

/** GET /api/pacientes — Listar con búsqueda y paginación */
async function listar(req, res) {
  const { buscar = '', pagina = 1, limite = 20 } = req.query;
  const offset = (parseInt(pagina) - 1) * parseInt(limite);
  const termino = `%${buscar}%`;

  try {
    // Contar total para paginación
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM pacientes
       WHERE nombre LIKE ? OR apellido LIKE ? OR cedula LIKE ?`,
      [termino, termino, termino]
    );

    const [pacientes] = await pool.query(
      `SELECT id, cedula, nombre, apellido, fecha_nac, sexo, telefono, email, sangre
       FROM pacientes
       WHERE nombre LIKE ? OR apellido LIKE ? OR cedula LIKE ?
       ORDER BY apellido, nombre
       LIMIT ? OFFSET ?`,
      [termino, termino, termino, parseInt(limite), offset]
    );

    res.json({
      ok: true,
      total,
      pagina: parseInt(pagina),
      paginas: Math.ceil(total / parseInt(limite)),
      datos: pacientes,
    });
  } catch (err) {
    console.error('[pacientesController.listar]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener pacientes.' });
  }
}

/** GET /api/pacientes/:id — Obtener un paciente con su historial */
async function obtener(req, res) {
  const { id } = req.params;

  try {
    const [[paciente]] = await pool.query(
      'SELECT * FROM pacientes WHERE id = ?', [id]
    );

    if (!paciente) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }

    // Incluir últimas 10 entradas del historial clínico
    const [historial] = await pool.query(
      `SELECT h.*, c.fecha, c.hora, m.nombre AS medico, m.especialidad
       FROM historial_clinico h
       JOIN citas    c ON c.id = h.cita_id
       JOIN medicos  m ON m.id = h.medico_id
       WHERE h.paciente_id = ?
       ORDER BY c.fecha DESC, c.hora DESC
       LIMIT 10`,
      [id]
    );

    res.json({ ok: true, paciente, historial });
  } catch (err) {
    console.error('[pacientesController.obtener]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el paciente.' });
  }
}

/** POST /api/pacientes — Crear paciente */
async function crear(req, res) {
  const { cedula, nombre, apellido, fecha_nac, sexo, telefono, email, direccion, sangre, alergias } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ ok: false, mensaje: 'Nombre y apellido son requeridos.' });
  }

  try {
    // Validar cédula única si se proporcionó
    if (cedula) {
      const [[existe]] = await pool.query(
        'SELECT id FROM pacientes WHERE cedula = ?', [cedula]
      );
      if (existe) {
        return res.status(409).json({ ok: false, mensaje: 'Ya existe un paciente con esa cédula.' });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO pacientes (cedula, nombre, apellido, fecha_nac, sexo, telefono, email, direccion, sangre, alergias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cedula || null, nombre.trim(), apellido.trim(), fecha_nac || null,
       sexo || null, telefono || null, email || null, direccion || null,
       sangre || null, alergias || null]
    );

    res.status(201).json({ ok: true, mensaje: 'Paciente registrado.', id: result.insertId });
  } catch (err) {
    console.error('[pacientesController.crear]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el paciente.' });
  }
}

/** PUT /api/pacientes/:id — Actualizar paciente */
async function actualizar(req, res) {
  const { id } = req.params;
  const { nombre, apellido, fecha_nac, sexo, telefono, email, direccion, sangre, alergias } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ ok: false, mensaje: 'Nombre y apellido son requeridos.' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE pacientes
       SET nombre=?, apellido=?, fecha_nac=?, sexo=?, telefono=?, email=?, direccion=?, sangre=?, alergias=?
       WHERE id=?`,
      [nombre.trim(), apellido.trim(), fecha_nac || null, sexo || null,
       telefono || null, email || null, direccion || null,
       sangre || null, alergias || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }

    res.json({ ok: true, mensaje: 'Paciente actualizado correctamente.' });
  } catch (err) {
    console.error('[pacientesController.actualizar]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el paciente.' });
  }
}

/** DELETE /api/pacientes/:id — Eliminar paciente (solo admin) */
async function eliminar(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM pacientes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });
    }

    res.json({ ok: true, mensaje: 'Paciente eliminado.' });
  } catch (err) {
    console.error('[pacientesController.eliminar]', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el paciente.' });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
