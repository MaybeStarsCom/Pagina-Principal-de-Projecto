# 🏥 Sistema de Gestión Médica
### UAPA — Programación III — Trimestre Mayo-Julio 2026

---

## 📋 Descripción del Sistema

Sistema web completo para la gestión integral de una clínica médica. Permite administrar pacientes, médicos, citas médicas e historial clínico, con generación de reportes en PDF y Excel y autenticación segura por roles.

---

## 🎯 Objetivo

Desarrollar una solución informática funcional que resuelva la gestión de citas e historial clínico de una clínica, aplicando principios de programación orientada a objetos, bases de datos relacionales, autenticación segura y buenas prácticas de desarrollo de software.

---

## ✅ Funcionalidades

- 🔐 **Autenticación** — Login seguro con JWT y bcrypt, control de acceso por roles
- 👥 **Pacientes** — Registro, búsqueda, edición y eliminación de expedientes
- 📅 **Citas** — Agendamiento, cambio de estado y filtros por fecha y estado
- 👨‍⚕️ **Médicos** — Gestión del personal médico con horarios y especialidades
- 📊 **Dashboard** — Estadísticas en tiempo real con gráficos animados
- 📄 **Reportes** — Exportación de citas en PDF y Excel con diseño profesional
- 🔒 **Seguridad** — Tokens JWT, contraseñas hasheadas, validación de datos

---

## 🛠️ Tecnologías Utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js + Express |
| Base de Datos | Microsoft SQL Server |
| Autenticación | JWT + bcryptjs |
| Reportes | pdfkit + ExcelJS |
| Control de Versiones | Git + GitHub |

---

## 📁 Estructura del Proyecto

```
clinica-sistema/
├── backend/
│   ├── config/
│   │   ├── db.js               # Conexión SQL Server
│   │   └── Database.sql        # Script de creación de BD
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── pacientesController.js
│   │   ├── citasController.js
│   │   ├── medicosController.js
│   │   └── reportesController.js
│   ├── middleware/
│   │   └── auth.js             # JWT verifyToken + requireRole
│   ├── routes/
│   │   ├── auth.js
│   │   ├── pacientes.js
│   │   ├── citas.js
│   │   ├── medicos.js
│   │   └── reportes.js
│   ├── server.js
│   └── package.json
└── frontend/
    └── src/pages/
        ├── Login.html
        ├── Dashboard.html
        ├── Pacientes.html
        ├── Citas.html
        └── Medicos.html
```

---

## ⚙️ Instalación y Ejecución

### Prerequisitos
- Node.js v18+
- Microsoft SQL Server
- SQL Server Management Studio (SSMS)
- Navegador moderno + extensión Live Server

### 1. Clonar el repositorio
```bash
git clone https://github.com/MaybeStarsCom/Pagina-Principal-de-Projecto.git
cd Pagina-Principal-de-Projecto
```

### 2. Crear la base de datos
```
1. Abrir SQL Server Management Studio (SSMS)
2. Abrir el archivo: backend/config/Database.sql
3. Presionar F5 para ejecutar
```

### 3. Configurar variables de entorno
```bash
cd backend
# Crear archivo .env con estos valores:
PORT=3000
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=tu_contraseña
DB_NAME=clinica_db
JWT_SECRET=medical_system_secret_2026
JWT_EXPIRES_IN=8h
```

### 4. Instalar dependencias y arrancar
```bash
npm install
npm run dev
```

### 5. Abrir el frontend
```
Abrir Login.html con Live Server en VS Code
```

---

## 🔌 Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/pacientes | Listar pacientes |
| POST | /api/pacientes | Crear paciente |
| PUT | /api/pacientes/:id | Editar paciente |
| DELETE | /api/pacientes/:id | Eliminar paciente |
| GET | /api/citas | Listar citas |
| POST | /api/citas | Crear cita |
| PUT | /api/citas/:id/estado | Cambiar estado |
| GET | /api/medicos | Listar médicos |
| POST | /api/medicos | Crear médico |
| GET | /api/reportes/estadisticas | Dashboard stats |
| GET | /api/reportes/citas/pdf | Exportar PDF |
| GET | /api/reportes/citas/excel | Exportar Excel |

---

## 👤 Credenciales de Prueba

```
Email:    admin@clinica.com
Password: password
Rol:      admin
```

---

## 👥 Roles del Equipo

| Rol | Responsabilidad |
|---|---|
| Líder del Proyecto | Coordinación, GitHub, entregas |
| Programador Backend | Node.js, Express, SQL Server, JWT |
| Programador Frontend | HTML, CSS, JavaScript |
| Diseñador UI/UX | Wireframes, estilos, experiencia |
| Tester | Pruebas funcionales, casos de error |
| Documentador | README, documentación técnica, video |

---

## 📊 Historial de Versiones

| Versión | Descripción |
|---|---|
| v1.0 | Base de datos, backend y login funcional |
| v2.0 | Frontend completo conectado a la API y SQL Server |
| v3.0 | Reportes PDF/Excel y correcciones de SQL Server |

---

## 📄 Licencia

Proyecto académico — UAPA 2026 — Todos los derechos reservados.
