# 🏥 Sistema de Gestión Médica

Sistema web desarrollado para facilitar la administración de una clínica médica, permitiendo gestionar pacientes, médicos y citas de forma rápida y segura.

## 📌 Características

- Inicio de sesión con autenticación mediante JWT.
- Gestión de pacientes.
- Gestión de médicos.
- Registro y administración de citas médicas.
- Panel principal (Dashboard).
- Conexión a base de datos SQL Server.

## 🛠 Tecnologías utilizadas

- Node.js
- Express.js
- SQL Server
- HTML5
- CSS3
- JavaScript
- JWT
- bcryptjs

## 📁 Estructura del proyecto

```
Sistema-Clinico/
│── config/
│── controllers/
│── middleware/
│── routes/
│── public/
│── views/
│── server.js
│── package.json
│── .env
└── README.md
```

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sistema-clinico.git
cd sistema-clinico
```

### 2. Instalar las dependencias

```bash
npm install
```

### 3. Configurar la base de datos

Crear una base de datos en **SQL Server** e importar el script SQL del proyecto.

### 4. Configurar las variables de entorno

Crear un archivo `.env` con la información de conexión a SQL Server.

Ejemplo:

```env
DB_SERVER=localhost
DB_DATABASE=SistemaClinico
DB_USER=sa
DB_PASSWORD=tu_contraseña
PORT=3000
JWT_SECRET=tu_clave_secreta
```

### 5. Ejecutar el proyecto

```bash
npm start
```

O si utilizas nodemon:

```bash
npm run dev
```

El servidor iniciará en:

```
http://localhost:3000
```

## 📷 Módulos principales

- 🔐 Autenticación de usuarios.
- 👨‍⚕️ Gestión de médicos.
- 🧑‍🤝‍🧑 Gestión de pacientes.
- 📅 Administración de citas.
- 📊 Dashboard.

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos para la asignatura **Programación III** de la **UAPA**.
