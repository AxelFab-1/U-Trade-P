# 🚀 U-Market (Avance 2) - Resumen de Iteraciones Scrum y Commits

Este documento detalla cómo se organizó el desarrollo ágil de la segunda entrega de **U-Market** (Semanas 6 a 9). Cada integrante completó **10 commits de funcionalidad**, estructurados en **3 iteraciones (Sprints cortos)** con ramas de trabajo en paralelo y fusiones de 3 vías en Git.

---

## 👥 Resumen del Equipo y Responsabilidades

| Integrante | Rol en el Proyecto | Commits | Foco Técnico |
| :--- | :--- | :---: | :--- |
| **Fabian.Z.A** | Backend Developer | **10** | Spring Data JPA, Base de datos H2, Spring Security, JWT y Transacciones ACID. |
| **AxelFab-1** | Full-Stack / Frontend Core | **10** | Conexión HTTP, AuthService, JwtInterceptor, Flujo de Compra y Rutas protegidas. |
| **yarlyan** | Frontend UI & Features | **10** | Pantalla de Registro, Validaciones institucionales UTP, Mis Publicaciones y Eliminación. |

---

## 📦 Iteración 1: Persistencia y Estructura Base (9 Commits)
> **Objetivo:** Migrar de persistencia en archivos JSON a una base de datos real (H2 con Spring Data JPA), mientras el frontend prepara el cliente HTTP y la vista base de Registro.

### 👤 Fabian.Z.A (Backend - `feature/backend-persistencia`)
1. `88ba05a` - `feat(backend): agregar dependencias Spring Data JPA y H2 en pom.xml`
2. `9d4442d` - `config(backend): configurar conexion a base de datos H2 en application.properties`
   * *Detalle:* Base de datos H2 en modo archivo (`./data/utradedb`) para que los datos persistan tras reiniciar el servidor, y consola web `/h2-console` habilitada.
3. `32c7af7` - `refactor(backend): transformar modelos Usuario y Producto a entidades JPA`
   * *Detalle:* Mapeo con `@Entity`, `@Table`, `@Id`, `@GeneratedValue` y relación `@ManyToOne` entre Producto y Vendedor.

### 👤 AxelFab-1 (Frontend Core - `feature/front-http-base`)
4. `f3f04eb` - `feat(front): configurar provideHttpClient en app.config.ts`
   * *Detalle:* Habilitación del cliente HTTP moderno de Angular 21 para peticiones asíncronas.
5. `915d507` - `config(front): definir URL base del backend en environment`
   * *Detalle:* Centralización de la URL de la API (`http://localhost:8080/api`) en `environment.ts`.
6. `c9be332` - `refactor(front): adaptar interfaces de frontend a entidades JPA del backend`
   * *Detalle:* Actualización de interfaces TypeScript para sincronizar campos como `disponible`, `rol` y `comprador`.

### 👤 yarlyan (Frontend UI - `feature/front-registro-ui`)
7. `26cb5dc` - `feat(front): crear componente y plantilla de Registro de Estudiante`
   * *Detalle:* Creación del componente `Registro` para capturar nuevos usuarios universitarios.
8. `9d2ab40` - `style(front): maquetar formulario de Registro responsive`
   * *Detalle:* Estilizado centrado con soporte mobile-first y desktop (`max-width: 480px`).
9. `ec29fec` - `feat(front): agregar ruta de Registro en app.routes.ts`
   * *Detalle:* Registro de la ruta `/registro` en el Router de Angular.

---

## 📦 Iteración 2: Autenticación, Seguridad y JWT (10 Commits)
> **Objetivo:** Blindar la plataforma con seguridad "Stateless" basada en JSON Web Tokens (JWT), roles perimetrales y validaciones de correo institucional UTP.

### 👤 Fabian.Z.A (Backend - `feature/backend-security-jwt`)
10. `0006a86` - `feat(backend): agregar dependencias de Spring Security y JJWT en pom.xml`
    * *Detalle:* Instalación de Spring Security y biblioteca JJWT (0.12.6) para criptografía y tokens.
11. `a3eeb5e` - `feat(backend): implementar JwtService y JwtAuthenticationFilter`
    * *Detalle:* Generación de tokens con expiración de 1 hora y filtro que intercepta cabeceras `Authorization: Bearer <token>`.
12. `668e301` - `config(backend): configurar SecurityConfig y UserDetailsServiceImpl con roles`
    * *Detalle:* Reglas de autorización RBAC (`ROLE_ESTUDIANTE` y `ROLE_ADMIN`), habilitación de CORS para Angular y deshabilitación de CSRF (API sin estado).
13. `d087b32` - `feat(backend): crear AuthController para login y generación de tokens`
    * *Detalle:* Endpoint `POST /api/auth/login` que autentica al usuario y devuelve el token JWT.

### 👤 AxelFab-1 (Frontend Core - `feature/front-jwt-auth`)
14. `3f42acf` - `feat(front): crear AuthService para almacenar y decodificar token JWT`
    * *Detalle:* Almacenamiento seguro del token en `localStorage` y métodos para verificar expiración.
15. `851a7a5` - `feat(front): implementar JwtInterceptor para cabeceras HTTP Bearer`
    * *Detalle:* Interceptor HTTP que inyecta automáticamente el token Bearer en cada petición hacia el backend.
16. `87ce9da` - `feat(front): conectar formulario Login con endpoint /api/auth/login`
    * *Detalle:* Conexión del formulario de inicio de sesión con manejo de errores y redirección a `/explorar`.
17. `e8d92b2` - `feat(front): agregar AuthGuard para proteger rutas privadas`
    * *Detalle:* Protección de rutas `/publicar`, `/mensajes` y `/perfil` impidiendo el acceso a usuarios no logueados.

### 👤 yarlyan (Frontend UI - `feature/front-registro-validaciones`)
18. `ca18c12` - `feat(front): agregar validaciones estrictas de correo @utp.edu.pe en Registro`
    * *Detalle:* Validación de negocio: solo se admiten correos terminados en `@utp.edu.pe` y claves de mínimo 4 caracteres.
19. `b659f73` - `feat(front): conectar formulario Registro con POST /api/usuarios`
    * *Detalle:* Registro conectado con el backend forzando el rol de `ESTUDIANTE` por seguridad.
20. `90fa566` - `style(front): agregar alertas visuales de validación y errores en formulario`
    * *Detalle:* Banners visuales de éxito y error con iconos informativos para el estudiante.

---

## 📦 Iteración 3: Transacciones ACID, Compra y Mis Publicaciones (11 Commits)
> **Objetivo:** Implementar la lógica transaccional de compra protegida contra concurrencia y permitir la gestión completa de publicaciones desde el perfil.

### 👤 Fabian.Z.A (Backend - `feature/backend-transacciones`)
21. `76aa9e8` - `feat(backend): migrar Repositorios a JpaRepository y consulta JPQL findByVendedorId`
    * *Detalle:* Uso de `JpaRepository` y consulta orientada a objetos con `@Query` para filtrar artículos por vendedor.
22. `f52faca` - `feat(backend): actualizar UsuarioService con BCrypt y transacciones ACID`
    * *Detalle:* Encriptación con `BCryptPasswordEncoder` y métodos protegidos con `@Transactional` para evitar estados inconsistentes (Rollback automático).
23. `59722c6` - `feat(backend): implementar lógica transaccional de compra en ProductoService y endpoint`
    * *Detalle:* Método transaccional `comprarProducto(id)` que evita compras del propio vendedor, verifica disponibilidad y expone `POST /api/productos/{id}/comprar`.

### 👤 AxelFab-1 (Frontend Core - `feature/front-api-compra`)
24. `a496fef` - `feat(front): conectar vista Explorar con endpoint GET /api/productos real`
    * *Detalle:* Catálogo conectado a la base de datos real con fallback automático ante desconexiones.
25. `bda5a28` - `feat(front): conectar Detalle de Producto con endpoint GET /api/productos/:id`
    * *Detalle:* Carga en tiempo real de los datos del producto con etiquetas de estado "Disponible" / "Vendido".
26. `ed23349` - `feat(front): implementar botón y flujo transaccional de compra de producto`
    * *Detalle:* Botón "Comprar Ahora" que consume la transacción ACID y actualiza la interfaz al instante.

### 👤 yarlyan (Frontend UI - `feature/front-mis-publicaciones`)
27. `8369ac6` - `feat(front): conectar vista Publicar con endpoint POST /api/productos real`
    * *Detalle:* Formulario conectado con el backend asignando el artículo al usuario vendedor.
28. `819dcf1` - `feat(front): conectar Perfil con endpoint /api/productos/vendedor/:id ('Mis Publicaciones')`
    * *Detalle:* Consumo de la consulta JPQL de Fabian para listar únicamente los artículos del alumno logueado.
29. `88222ba` - `style(front): maquetar listado de mis publicaciones en la vista Perfil`
    * *Detalle:* Lista estilizada de productos con foto, precio y distintivo de estado.
30. `249f04d` - `feat(front): implementar eliminación de producto propio (DELETE /api/productos/:id)`
    * *Detalle:* Botón de papelera para eliminar publicaciones propias conectado con `DELETE` del backend (que verifica que seas el dueño original).

---

## 🎯 Guion para Exponer ante el Profesor

> *"Profesor, para esta segunda entrega organizamos el desarrollo bajo la metodología **Scrum en 3 iteraciones (Sprints cortos)**:
> 
> 1. **Sprint 1 (Capa de Datos y Base):** Migramos el almacenamiento a una base de datos real H2 con Spring Data JPA en el backend, e implementamos el cliente HTTP y la vista de Registro en el frontend.
> 2. **Sprint 2 (Seguridad y Control de Acceso):** Implementamos arquitectura 'Stateless' con tokens JWT en Spring Security, protegiendo las rutas con roles e integrando el Login y Registro con validación de correos institucionales `@utp.edu.pe`.
> 3. **Sprint 3 (Transacciones y Funcionalidad de Negocio):** Diseñamos la simulación de compra transaccional ACID en el backend con `@Transactional` para evitar concurrencia, y en el frontend conectamos el flujo de compra y la gestión de 'Mis Publicaciones' en el perfil.
> 
> Cada desarrollador completó exactamente **10 commits de responsabilidad** en ramas paralelas, integradas en GitHub mediante fusiones de 3 vías sin fast-forward."*
