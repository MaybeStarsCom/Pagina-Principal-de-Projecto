const { getPool, sql } = require('../config/db');

/** GET /api/medicos */
async function listar(req, res) {
  const { buscar = '' } = req.query;
  const termino = `%${buscar}%`;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('t', sql.NVarChar, termino)
      .query(`SELECT id, nombre, especialidad, telefono, email,
                     horario_inicio, horario_fin, activo
              FROM medicos
              WHERE nombre LIKE @t OR especialidad LIKE @t
              ORDER BY nombre`);

    res.json({ ok: true, total: result.recordset.length, datos: result.recordset });
  } catch (err) {
    console.error('[medicosController.listar] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** GET /api/medicos/:id */
async function obtener(req, res) {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM medicos WHERE id = @id');

    if (result.recordset.length === 0)
      return res.status(404).json({ ok: false, mensaje: 'Médico no encontrado.' });

    res.json({ ok: true, medico: result.recordset[0] });
  } catch (err) {
    console.error('[medicosController.obtener] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** POST /api/medicos */
async function crear(req, res) {
  const { nombre, especialidad, telefono, email, horario_inicio, horario_fin } = req.body;

  if (!nombre || !especialidad)
    return res.status(400).json({ ok: false, mensaje: 'Nombre y especialidad son requeridos.' });

  try {
    const pool = await getPool();
    const ins  = await pool.request()
      .input('nombre',         sql.NVarChar, nombre.trim())
      .input('especialidad',   sql.NVarChar, especialidad.trim())
      .input('telefono',       sql.NVarChar, telefono      || null)
      .input('email',          sql.NVarChar, email         || null)
      .input('horario_inicio', sql.NVarChar, horario_inicio || '08:00')
      .input('horario_fin',    sql.NVarChar, horario_fin   || '17:00')
      .query(`INSERT INTO medicos (nombre, especialidad, telefono, email, horario_inicio, horario_fin)
              OUTPUT INSERTED.id
              VALUES (@nombre, @especialidad, @telefono, @email, @horario_inicio, @horario_fin)`);

    res.status(201).json({ ok: true, mensaje: 'Médico registrado.', id: ins.recordset[0].id });
  } catch (err) {
    console.error('[medicosController.crear] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** PUT /api/medicos/:id */
async function actualizar(req, res) {
  const { nombre, especialidad, telefono, email, horario_inicio, horario_fin } = req.body;

  if (!nombre || !especialidad)
    return res.status(400).json({ ok: false, mensaje: 'Nombre y especialidad son requeridos.' });

  try {
    const pool = await getPool();
    const upd  = await pool.request()
      .input('id',             sql.Int,      req.params.id)
      .input('nombre',         sql.NVarChar, nombre.trim())
      .input('especialidad',   sql.NVarChar, especialidad.trim())
      .input('telefono',       sql.NVarChar, telefono      || null)
      .input('email',          sql.NVarChar, email         || null)
      .input('horario_inicio', sql.NVarChar, horario_inicio || '08:00')
      .input('horario_fin',    sql.NVarChar, horario_fin   || '17:00')
      .query(`UPDATE medicos
              SET nombre=@nombre, especialidad=@especialidad, telefono=@telefono,
                  email=@email, horario_inicio=@horario_inicio, horario_fin=@horario_fin
              WHERE id=@id`);

    if (upd.rowsAffected[0] === 0)
      return res.status(404).json({ ok: false, mensaje: 'Médico no encontrado.' });

    res.json({ ok: true, mensaje: 'Médico actualizado.' });
  } catch (err) {
    console.error('[medicosController.actualizar] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** PUT /api/medicos/:id/estado */
async function toggleActivo(req, res) {
  try {
    const pool   = await getPool();
    const actual = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT activo FROM medicos WHERE id = @id');

    if (actual.recordset.length === 0)
      return res.status(404).json({ ok: false, mensaje: 'Médico no encontrado.' });

    const nuevoEstado = actual.recordset[0].activo ? 0 : 1;

    await pool.request()
      .input('id',     sql.Int, req.params.id)
      .input('activo', sql.Bit, nuevoEstado)
      .query('UPDATE medicos SET activo = @activo WHERE id = @id');

    res.json({ ok: true, mensaje: nuevoEstado ? 'Médico activado.' : 'Médico desactivado.' });
  } catch (err) {
    console.error('[medicosController.toggleActivo] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

/** DELETE /api/medicos/:id */
async function eliminar(req, res) {
  try {
    const pool = await getPool();
    const del  = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM medicos WHERE id = @id');

    if (del.rowsAffected[0] === 0)
      return res.status(404).json({ ok: false, mensaje: 'Médico no encontrado.' });

    res.json({ ok: true, mensaje: 'Médico eliminado.' });
  } catch (err) {
    console.error('[medicosController.eliminar] ERROR:', err.message);
    res.status(500).json({ ok: false, mensaje: err.message });
  }
}

module.exports = { listar, obtener, crear, actualizar, toggleActivo, eliminar };