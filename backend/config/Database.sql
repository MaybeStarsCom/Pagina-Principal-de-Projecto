IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'clinica_db')
    CREATE DATABASE clinica_db;
GO

USE clinica_db;
GO

-- -----------------------------------------------
-- TABLA: usuarios
-- -----------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='usuarios' AND xtype='U')
BEGIN
    CREATE TABLE usuarios (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        nombre      NVARCHAR(100) NOT NULL,
        email       NVARCHAR(150) NOT NULL UNIQUE,
        password    NVARCHAR(255) NOT NULL,
        rol         NVARCHAR(20)  NOT NULL DEFAULT 'recepcionista'
                    CONSTRAINT chk_rol CHECK (rol IN ('admin','medico','recepcionista')),
        activo      BIT NOT NULL DEFAULT 1,
        created_at  DATETIME DEFAULT GETDATE(),
        updated_at  DATETIME DEFAULT GETDATE()
    );
END
GO

-- -----------------------------------------------
-- TABLA: medicos
-- -----------------------------------------------
CREATE TABLE medicos (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id      INT NULL,
    nombre          NVARCHAR(100) NOT NULL,
    especialidad    NVARCHAR(100) NOT NULL,
    telefono        NVARCHAR(20)  NULL,
    email           NVARCHAR(150) NULL,
    horario_inicio  TIME NOT NULL DEFAULT '08:00',
    horario_fin     TIME NOT NULL DEFAULT '17:00',
    activo          BIT NOT NULL DEFAULT 1,
    created_at      DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_medico_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);
GO

-- -----------------------------------------------
-- TABLA: pacientes
-- -----------------------------------------------
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pacientes' AND xtype='U')
BEGIN
    CREATE TABLE pacientes (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        cedula      NVARCHAR(20)  NULL UNIQUE,
        nombre      NVARCHAR(100) NOT NULL,
        apellido    NVARCHAR(100) NOT NULL,
        fecha_nac   DATE          NULL,
        sexo        NVARCHAR(5)   NULL
                    CONSTRAINT chk_sexo CHECK (sexo IN ('M','F','Otro')),
        telefono    NVARCHAR(20)  NULL,
        email       NVARCHAR(150) NULL,
        direccion   NVARCHAR(MAX) NULL,
        sangre      NVARCHAR(5)   NULL,
        alergias    NVARCHAR(MAX) NULL,
        created_at  DATETIME DEFAULT GETDATE(),
        updated_at  DATETIME DEFAULT GETDATE()
    );
END
GO

-- -----------------------------------------------
-- TABLA: citas
-- -----------------------------------------------
CREATE TABLE citas (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    paciente_id INT NOT NULL,
    medico_id   INT NOT NULL,
    fecha       DATE NOT NULL,
    hora        TIME NOT NULL,
    motivo      NVARCHAR(255) NULL,
    estado      NVARCHAR(20) NOT NULL DEFAULT 'pendiente'
                CONSTRAINT chk_estado CHECK (estado IN ('pendiente','confirmada','completada','cancelada')),
    notas       NVARCHAR(MAX) NULL,
    created_by  INT NULL,
    created_at  DATETIME DEFAULT GETDATE(),
    updated_at  DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_cita_paciente FOREIGN KEY (paciente_id)
        REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_cita_medico FOREIGN KEY (medico_id)
        REFERENCES medicos(id),
    CONSTRAINT fk_cita_usuario FOREIGN KEY (created_by)
        REFERENCES usuarios(id),
    CONSTRAINT uq_cita_medico_hora UNIQUE (medico_id, fecha, hora)
);
GO

-- -----------------------------------------------
-- TABLA: historial_clinico
-- -----------------------------------------------
CREATE TABLE historial_clinico (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    cita_id       INT NOT NULL UNIQUE,
    paciente_id   INT NOT NULL,
    medico_id     INT NOT NULL,
    diagnostico   NVARCHAR(MAX) NOT NULL,
    tratamiento   NVARCHAR(MAX) NULL,
    receta        NVARCHAR(MAX) NULL,
    peso_kg       DECIMAL(5,2)  NULL,
    presion       NVARCHAR(20)  NULL,
    temperatura   DECIMAL(4,1)  NULL,
    created_at    DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_hist_cita     FOREIGN KEY (cita_id)
        REFERENCES citas(id) ON DELETE CASCADE,
    CONSTRAINT fk_hist_paciente FOREIGN KEY (paciente_id)
        REFERENCES pacientes(id),
    CONSTRAINT fk_hist_medico   FOREIGN KEY (medico_id)
        REFERENCES medicos(id)
);
GO

-- -----------------------------------------------
-- DATOS INICIALES
-- -----------------------------------------------

-- Usuario admin
-- Contraseña: password
IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@clinica.com')
    INSERT INTO usuarios (nombre, email, password, rol)
    VALUES ('Administrador', 'admin@clinica.com',
            '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            'admin');
GO

-- Médicos de ejemplo
INSERT INTO medicos (nombre, especialidad, telefono, horario_inicio, horario_fin) VALUES
    ('Dr. Juan Pérez',     'Medicina General', '809-555-0001', '08:00', '16:00'),
    ('Dra. María López',   'Pediatría',        '809-555-0002', '09:00', '17:00'),
    ('Dr. Carlos Sánchez', 'Cardiología',      '809-555-0003', '08:00', '15:00');
GO

-- Pacientes de ejemplo
IF NOT EXISTS (SELECT 1 FROM pacientes WHERE cedula = '001-1234567-8')
BEGIN
    INSERT INTO pacientes (cedula, nombre, apellido, fecha_nac, sexo, telefono, sangre) VALUES
        ('001-1234567-8', 'Ana',    'Rodríguez', '1990-05-14', 'F', '809-555-1001', 'O+'),
        ('001-7654321-2', 'Carlos', 'Méndez',    '1985-11-23', 'M', '809-555-1002', 'A+'),
        ('402-0012345-6', 'Luis',   'Fernández', '1978-03-08', 'M', '809-555-1003', 'B-'),
        ('001-9876543-1', 'Sofía',  'Castro',    '2000-07-30', 'F', '809-555-1004', 'AB+'),
        ('001-1111111-1', 'Pedro',  'García',    '1995-01-15', 'M', '809-555-1005', 'O-');
END
GO

-- -----------------------------------------------
-- VERIFICAR RESULTADO
-- -----------------------------------------------
SELECT TABLE_NAME AS tablas_creadas
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_CATALOG = 'clinica_db'
AND TABLE_TYPE = 'BASE TABLE';
GO

SELECT nombre, email, rol FROM usuarios;
GO

SELECT nombre, especialidad FROM medicos;
GO

SELECT nombre, apellido, cedula FROM pacientes;
GO

SELECT name, type_desc 
FROM sys.server_principals
WHERE type IN ('S','U') 
AND name NOT LIKE '##%';


ALTER LOGIN sa WITH PASSWORD = 'Clinica123!';
ALTER LOGIN sa ENABLE;
GO

EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode', 
    REG_DWORD, 
    2;
GO

SELECT * FROM pacientes;