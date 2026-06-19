# 🏥 Sistema de Gestión Médica — Clínica

> Proyecto Final — Programación III · UAPA · Trimestre Mayo-Julio 2026

---

## 📋 Descripción del Sistema

Sistema web para la gestión integral de una clínica médica.  
Permite administrar pacientes, médicos, citas y generar reportes en PDF y Excel.

## 🎯 Objetivo

Desarrollar una solución informática funcional que resuelva la gestión de citas e historial clínico de una clínica, aplicando principios de programación orientada a objetos, bases de datos relacionales, autenticación segura y buenas prácticas de desarrollo.

---

## 🛠️ Tecnologías Utilizadas

| Capa       | Tecnología           |
|------------|----------------------|
| Backend    | Node.js + Express    |
| Base Datos | MySQL 8.x            |
| Auth       | JWT + bcryptjs       |
| Reportes   | pdfkit + ExcelJS     |
| Frontend   | React.js + Axios     |
| Control V. | Git + GitHub         |

---

## 📁 Estructura del Proyecto

```
clinica-sistema/
├── backend/
│   ├── config/
│   │   ├── db.js           # Conexión SQL Server (2022)
│   │   └── database.sql    # Esquema y datos iniciales
│   ├── middleware/
│   │   └── auth.js         # JWT verifyToken + requireRole
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── pacientesController.js
│   │   ├── citasController.js
│   │   └── reportesController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── pacientes.js
│   │   ├── citas.js
│   │   └── reportes.js
│   ├── server.js           # Punto de entrada
│   ├── package.json
│   └── .env.example
├── frontend/               # React (por implementar)
├── .gitignore
└── README.md
```

---

## ⚙️ Instalación y Ejecución

### Prerequisitos
- Node.js v18+
- MySQL 8.x
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/clinica-sistema.git
cd clinica-sistema
```

### 2. Configurar la base de datos
```bash
mysql -u root -p < backend/config/database.sql
```

### 3. Configurar variables de entorno
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de MySQL
```

### 4. Instalar dependencias y arrancar
```bash
npm install
npm run dev     # desarrollo con nodemon
# o
npm start       # producción
```

El servidor estará disponible en: `http://localhost:3000`

---

## 🔌 Endpoints de la API

### Autenticación
| Método | Ruta              | Descripción           |
|--------|-------------------|-----------------------|
| POST   | /api/auth/login   | Iniciar sesión → JWT  |
| POST   | /api/auth/registro| Crear usuario (admin) |
| GET    | /api/auth/perfil  | Ver perfil actual     |

### Pacientes
| Método | Ruta                  | Descripción           |
|--------|-----------------------|-----------------------|
| GET    | /api/pacientes        | Listar / buscar       |
| GET    | /api/pacientes/:id    | Ver paciente + historial |
| POST   | /api/pacientes        | Registrar paciente    |
| PUT    | /api/pacientes/:id    | Actualizar            |
| DELETE | /api/pacientes/:id    | Eliminar (admin)      |

### Citas
| Método | Ruta                       | Descripción           |
|--------|----------------------------|-----------------------|
| GET    | /api/citas                 | Listar con filtros    |
| POST   | /api/citas                 | Crear cita            |
| PUT    | /api/citas/:id/estado      | Cambiar estado        |
| POST   | /api/citas/:id/historial   | Registrar consulta    |

### Reportes
| Método | Ruta                          | Descripción           |
|--------|-------------------------------|-----------------------|
| GET    | /api/reportes/citas/pdf       | Descargar PDF         |
| GET    | /api/reportes/citas/excel     | Descargar Excel       |
| GET    | /api/reportes/estadisticas    | Dashboard de datos    |

---

## 👥 Roles del equipo

| Rol                | Responsabilidad                        |
|--------------------|----------------------------------------|
| Líder del Proyecto | Coordinación, GitHub, entregas         |
| Programador Backend| Node.js, Express, MySQL, JWT           |
| Programador Frontend| React, Axios, diseño de páginas       |
| Diseñador UI/UX    | Wireframes, estilos, experiencia       |
| Tester             | Pruebas funcionales, casos de error    |
| Documentador       | README, documentación técnica, video   |

---

## 👤 Credenciales de prueba

```
Email:    admin@clinica.com
Password: password
Rol:      admin
```

---

## 📄 Licencia

Proyecto académico — UAPA 2026
