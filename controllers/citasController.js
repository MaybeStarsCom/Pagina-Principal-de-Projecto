// controllers/citasController.js — CRUD de citas médicas

// controllers/citasController.js

const { getPool, sql } = require('../config/db');

/**
 * GET /api/citas
 */
async function listar(req, res) {
  const { fecha, medico_id, estado, paciente_id } = req.query;

  try {
    const pool = await getPool();

    let query = `
      SELECT TOP 100
        c.id,
        c.fecha,
        c.hora,
        c.motivo,
        c.estado,
        c.notas,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        p.cedula,
        m.nombre AS medico_nombre,
        m.especialidad
      FROM citas c
      INNER JOIN pacientes p ON p.id = c.paciente_id
      INNER JOIN medicos m ON m.id = c.medico_id
      WHERE 1 = 1
    `;

    const request = pool.request();

    if (fecha) {
      query += " AND c.fecha = @fecha";
      request.input("fecha", sql.Date, fecha);
    }

    if (medico_id) {
      query += " AND c.medico_id = @medico_id";
      request.input("medico_id", sql.Int, medico_id);
    }

    if (estado) {
      query += " AND c.estado = @estado";
      request.input("estado", sql.NVarChar, estado);
    }

    if (paciente_id) {
      query += " AND c.paciente_id = @paciente_id";
      request.input("paciente_id", sql.Int, paciente_id);
    }

    query += " ORDER BY c.fecha DESC, c.hora ASC";

    const result = await request.query(query);

    res.json({
      ok: true,
      total: result.recordset.length,
      datos: result.recordset
    });

  } catch (err) {
    console.error("[citasController.listar]", err);
    res.status(500).json({
      ok: false,
      mensaje: err.message
    });
  }
}

/**
 * POST /api/citas
 */
async function crear(req, res) {

  const {
    paciente_id,
    medico_id,
    fecha,
    hora,
    motivo
  } = req.body;

  if (!paciente_id || !medico_id || !fecha || !hora) {
    return res.status(400).json({
      ok: false,
      mensaje: "paciente_id, medico_id, fecha y hora son obligatorios."
    });
  }

  try {

    const pool = await getPool();

    const conflicto = await pool.request()
      .input("medico", sql.Int, medico_id)
      .input("fecha", sql.Date, fecha)
      .input("hora", sql.Time, hora)
      .query(`
        SELECT id
        FROM citas
        WHERE medico_id=@medico
        AND fecha=@fecha
        AND hora=@hora
        AND estado<>'cancelada'
      `);

    if (conflicto.recordset.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: "El médico ya tiene una cita a esa hora."
      });
    }

    const result = await pool.request()

      .input("paciente", sql.Int, paciente_id)
      .input("medico", sql.Int, medico_id)
      .input("fecha", sql.Date, fecha)
      .input("hora", sql.Time, hora)
      .input("motivo", sql.NVarChar, motivo || null)
      .input("usuario", sql.Int, req.user.id)

      .query(`
        INSERT INTO citas
        (
          paciente_id,
          medico_id,
          fecha,
          hora,
          motivo,
          created_by
        )

        OUTPUT INSERTED.id

        VALUES
        (
          @paciente,
          @medico,
          @fecha,
          @hora,
          @motivo,
          @usuario
        )
      `);

    res.status(201).json({
      ok: true,
      mensaje: "Cita creada.",
      id: result.recordset[0].id
    });

  } catch (err) {

    console.error("[citasController.crear]", err);

    res.status(500).json({
      ok: false,
      mensaje: err.message
    });

  }

}

/**
 * PUT /api/citas/:id/estado
 */
async function cambiarEstado(req, res) {

  const { id } = req.params;
  const { estado, notas } = req.body;

  const estados = [
    "pendiente",
    "confirmada",
    "completada",
    "cancelada"
  ];

  if (!estados.includes(estado)) {

    return res.status(400).json({
      ok: false,
      mensaje: "Estado inválido."
    });

  }

  try {

    const pool = await getPool();

    const result = await pool.request()

      .input("id", sql.Int, id)
      .input("estado", sql.NVarChar, estado)
      .input("notas", sql.NVarChar, notas || null)

      .query(`
        UPDATE citas
        SET
          estado=@estado,
          notas=@notas
        WHERE id=@id
      `);

    if (result.rowsAffected[0] === 0) {

      return res.status(404).json({
        ok: false,
        mensaje: "Cita no encontrada."
      });

    }

    res.json({
      ok: true,
      mensaje: "Estado actualizado."
    });

  } catch (err) {

    console.error("[citasController.cambiarEstado]", err);

    res.status(500).json({
      ok: false,
      mensaje: err.message
    });

  }

}

/**
 * POST /api/citas/:id/historial
 */
async function registrarHistorial(req, res) {

  const { id } = req.params;

  const {
    diagnostico,
    tratamiento,
    receta,
    peso_kg,
    presion,
    temperatura
  } = req.body;

  if (!diagnostico) {

    return res.status(400).json({
      ok: false,
      mensaje: "Debe indicar un diagnóstico."
    });

  }

  try {

    const pool = await getPool();

    const cita = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT *
        FROM citas
        WHERE id=@id
        AND estado='confirmada'
      `);

    if (cita.recordset.length === 0) {

      return res.status(404).json({
        ok: false,
        mensaje: "La cita no existe o no está confirmada."
      });

    }

    const datos = cita.recordset[0];

    await pool.request()

      .input("cita", sql.Int, id)
      .input("paciente", sql.Int, datos.paciente_id)
      .input("medico", sql.Int, datos.medico_id)
      .input("diagnostico", sql.NVarChar, diagnostico)
      .input("tratamiento", sql.NVarChar, tratamiento || null)
      .input("receta", sql.NVarChar, receta || null)
      .input("peso", sql.Decimal(5,2), peso_kg || null)
      .input("presion", sql.NVarChar, presion || null)
      .input("temperatura", sql.Decimal(4,1), temperatura || null)

      .query(`
        INSERT INTO historial_clinico
        (
          cita_id,
          paciente_id,
          medico_id,
          diagnostico,
          tratamiento,
          receta,
          peso_kg,
          presion,
          temperatura
        )
        VALUES
        (
          @cita,
          @paciente,
          @medico,
          @diagnostico,
          @tratamiento,
          @receta,
          @peso,
          @presion,
          @temperatura
        )
      `);

    await pool.request()
      .input("id", sql.Int, id)
      .query(`
        UPDATE citas
        SET estado='completada'
        WHERE id=@id
      `);

    res.status(201).json({
      ok: true,
      mensaje: "Historial registrado."
    });

  } catch (err) {

    console.error("[citasController.registrarHistorial]", err);

    res.status(500).json({
      ok: false,
      mensaje: err.message
    });

  }

}

module.exports = {
  listar,
  crear,
  cambiarEstado,
  registrarHistorial
};