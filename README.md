# U-Market — Marketplace Universitario UTP

Plataforma web full-stack para compra, venta y moderación de productos, comida y servicios dentro de la comunidad universitaria UTP.

## Stack Tecnológico

- **Frontend:** Angular 21 (Standalone Components, Signals, Control Flow `@if`/`@for`, Reactive Forms, SASS, Bootstrap 5.3)
- **Backend:** Spring Boot 4.1.1 (Java 21, Spring Web, Spring Data JPA, Spring Security 6, JWT, JavaMail SMTP)
- **Base de Datos:** H2 en archivo (desarrollo local) / PostgreSQL (producción)
- **Despliegue:** Vercel (Frontend + SSL) y Render con Docker (Backend + SSL)

---

## Ejecución en Local

### 1. Variables de entorno locales
Copia el archivo de ejemplo y completa tus credenciales locales (el archivo `.env` está ignorado por Git):

```bash
cp .env.example .env
```

### 2. Iniciar Backend (Spring Boot — puerto `8080`)
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
Endpoint de verificación: `http://localhost:8080/api/health`

### 3. Iniciar Frontend (Angular — puerto `4200`)
```bash
cd frontend
npm install
npm start
```
Aplicación disponible en: `http://localhost:4200`

---

## Variables de Entorno

| Variable | Descripción | Valor por defecto (local) |
|---|---|---|
| `PORT` | Puerto HTTP del backend | `8080` |
| `SPRING_DATASOURCE_URL` | URL JDBC de base de datos | `jdbc:h2:file:./data/utradedb` |
| `SPRING_DATASOURCE_DRIVER` | Driver JDBC (`org.h2.Driver` / `org.postgresql.Driver`) | `org.h2.Driver` |
| `SPRING_DATASOURCE_USERNAME` | Usuario de base de datos | `sa` |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de base de datos | *(vacío)* |
| `JPA_DDL_AUTO` | Estrategia Hibernate DDL | `update` |
| `SHOW_SQL` | Mostrar consultas SQL en consola | `false` |
| `H2_CONSOLE_ENABLED` | Habilitar consola H2 (`/h2-console`) | `false` |
| `JWT_SECRET` | Clave secreta HMAC-SHA256 (mín. 32 caracteres) | clave local |
| `JWT_EXPIRATION_MS` | Tiempo de expiración del token JWT en ms | `3600000` (1 hora) |
| `CORS_ALLOWED_ORIGINS` | Orígenes autorizados separados por coma | `http://localhost:4200` |
| `MAIL_HOST` / `MAIL_PORT` | Servidor y puerto SMTP | `smtp.gmail.com` / `587` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Credenciales SMTP para envío de códigos OTP | *(definir en `.env`)* |

---

## Despliegue en Producción (Render + Vercel)

### Backend en Render (Docker)
1. Crear un **Web Service** conectado al repositorio.
2. Configurar **Root Directory:** `backend` y **Runtime:** `Docker`.
3. En **Environment Variables**, configurar `SPRING_DATASOURCE_*` (PostgreSQL), `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `H2_CONSOLE_ENABLED=false` y `SHOW_SQL=false`.
4. Verificar `https://<tu-backend>.onrender.com/api/health`.

### Frontend en Vercel
1. Actualizar `apiUrl` en `frontend/src/environments/environment.prod.ts` con la URL HTTPS del backend en Render.
2. Importar el repositorio en Vercel con **Root Directory:** `frontend`.
3. Vercel detectará `frontend/vercel.json` (`npm run build` → `dist/frontend/browser`, con reescritura SPA a `/index.html` y certificado SSL automático).
4. Actualizar `CORS_ALLOWED_ORIGINS` en Render agregando la URL `https://<tu-frontend>.vercel.app`.
