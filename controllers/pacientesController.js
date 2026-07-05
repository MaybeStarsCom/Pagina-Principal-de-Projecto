// controllers/pacientesController.js — CRUD completo de pacientes

const { getPool, sql } = require('../config/db');

/** GET /api/pacientes */
async function listar(req, res) {
  const { buscar = '', pagina = 1, limite = 10 } = req.query;
  const offset  = (parseInt(pagina) - 1) * parseInt(limite);
  const termino = `%${buscar}%`;

  try {
    const pool = await getPool();

    const totalResult = await pool.request()
      .input('t', sql.NVarChar, termino)
      .query(`SELECT COUNT(*) AS total FROM pacientes
              WHERE nombre LIKE @t OR apellido LIKE @t OR cedula LIKE @t`);

    const total = totalResult.recordset[0].total;

    const datosResult = await pool.request()
      .input('t',      sql.NVarChar, termino)
      .input('limite', sql.Int,      parseInt(limite))
      .input('offset', sql.Int,      offset)
      .query(`SELECT id, cedula, nombre, apellido, fecha_nac, sexo, telefono, email, sangre
              FROM pacientes
              WHERE nombre LIKE @t OR apellido LIKE @t OR cedula LIKE @t
              ORDER BY apellido, nombre
              OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY`);

    res.json({
      ok:      true,
      total,
      pagina:  parseInt(pagina),
      paginas: Math.ceil(total / parseInt(limite)) || 1,
      datos:   datosResult.recordset,
    });

  } catch (err) {
    console.error('[pacientesController.listar] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** GET /api/pacientes/:id */
async function obtener(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM pacientes WHERE id = @id');

    if (result.recordset.length === 0)
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });

    const historial = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT TOP 10 h.*, c.fecha, c.hora, m.nombre AS medico, m.especialidad
              FROM historial_clinico h
              JOIN citas   c ON c.id = h.cita_id
              JOIN medicos m ON m.id = h.medico_id
              WHERE h.paciente_id = @id
              ORDER BY c.fecha DESC, c.hora DESC`);

    res.json({ ok: true, paciente: result.recordset[0], historial: historial.recordset });
  } catch (err) {
    console.error('[pacientesController.obtener] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** POST /api/pacientes */
async function crear(req, res) {
  const { cedula, nombre, apellido, fecha_nac, sexo, telefono, email, direccion, sangre, alergias } = req.body;

  if (!nombre || !apellido)
    return res.status(400).json({ ok: false, mensaje: 'Nombre y apellido son requeridos.' });

  try {
    const pool = await getPool();

    if (cedula) {
      const existe = await pool.request()
        .input('c', sql.NVarChar, cedula)
        .query('SELECT id FROM pacientes WHERE cedula = @c');
      if (existe.recordset.length > 0)
        return res.status(409).json({ ok: false, mensaje: 'Ya existe un paciente con esa cédula.' });
    }

    const ins = await pool.request()
      .input('cedula',    sql.NVarChar, cedula    || null)
      .input('nombre',    sql.NVarChar, nombre.trim())
      .input('apellido',  sql.NVarChar, apellido.trim())
      .input('fecha_nac', sql.Date,     fecha_nac || null)
      .input('sexo',      sql.NVarChar, sexo      || null)
      .input('telefono',  sql.NVarChar, telefono  || null)
      .input('email',     sql.NVarChar, email     || null)
      .input('direccion', sql.NVarChar, direccion || null)
      .input('sangre',    sql.NVarChar, sangre    || null)
      .input('alergias',  sql.NVarChar, alergias  || null)
      .query(`INSERT INTO pacientes (cedula,nombre,apellido,fecha_nac,sexo,telefono,email,direccion,sangre,alergias)
              OUTPUT INSERTED.id
              VALUES (@cedula,@nombre,@apellido,@fecha_nac,@sexo,@telefono,@email,@direccion,@sangre,@alergias)`);

    res.status(201).json({ ok: true, mensaje: 'Paciente registrado.', id: ins.recordset[0].id });
  } catch (err) {
    console.error('[pacientesController.crear] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** PUT /api/pacientes/:id */
async function actualizar(req, res) {
  const { nombre, apellido, fecha_nac, sexo, telefono, email, direccion, sangre, alergias } = req.body;

  if (!nombre || !apellido)
    return res.status(400).json({ ok: false, mensaje: 'Nombre y apellido son requeridos.' });

  try {
    const pool = await getPool();
    const upd  = await pool.request()
      .input('id',        sql.Int,      req.params.id)
      .input('nombre',    sql.NVarChar, nombre.trim())
      .input('apellido',  sql.NVarChar, apellido.trim())
      .input('fecha_nac', sql.Date,     fecha_nac || null)
      .input('sexo',      sql.NVarChar, sexo      || null)
      .input('telefono',  sql.NVarChar, telefono  || null)
      .input('email',     sql.NVarChar, email     || null)
      .input('direccion', sql.NVarChar, direccion || null)
      .input('sangre',    sql.NVarChar, sangre    || null)
      .input('alergias',  sql.NVarChar, alergias  || null)
      .query(`UPDATE pacientes
              SET nombre=@nombre, apellido=@apellido, fecha_nac=@fecha_nac,
                  sexo=@sexo, telefono=@telefono, email=@email,
                  direccion=@direccion, sangre=@sangre, alergias=@alergias,
                  updated_at=GETDATE()
              WHERE id=@id`);

    if (upd.rowsAffected[0] === 0)
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });

    res.json({ ok: true, mensaje: 'Paciente actualizado.' });
  } catch (err) {
    console.error('[pacientesController.actualizar] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** DELETE /api/pacientes/:id */
async function eliminar(req, res) {
  try {
    const pool = await getPool();
    const del  = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM pacientes WHERE id = @id');

    if (del.rowsAffected[0] === 0)
      return res.status(404).json({ ok: false, mensaje: 'Paciente no encontrado.' });

    res.json({ ok: true, mensaje: 'Paciente eliminado.' });
  } catch (err) {
    console.error('[pacientesController.eliminar] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };