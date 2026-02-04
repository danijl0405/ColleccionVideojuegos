## Colección de Videojuegos

Aplicación web completa para gestionar una colección personal de videojuegos.
Incluye control de acceso (login/logout), operaciones CRUD sobre los juegos y
filtrado por plataforma, género y estado.

Tecnologías principales:
- **Frontend**: HTML5, CSS3, JavaScript, **Bootstrap 5**
- **Backend**: Node.js, **Express**, **TypeScript**
- **Base de datos**: **SQLite** mediante `better-sqlite3`

---

## Requisitos previos

- Node.js >= 18
- npm

No necesitas instalar SQLite por separado: la base de datos se crea como un
archivo local en la carpeta `data`.

---

## Instalación

```bash
git clone <TU_REPO_GITHUB>.git
cd colleccionVideojuegos
npm install
```

---

## Ejecución en local

### Modo desarrollo

```bash
npm run dev
```

El servidor se levantará en `http://localhost:3000` y podrás abrir la interfaz
web directamente desde el navegador.

### Modo producción

```bash
npm run start
```

Esto compila TypeScript a JavaScript (carpeta `dist`) y luego ejecuta el
servidor compilado.

---

## Uso de la aplicación

1. **Registro / login**
   - En la tarjeta de *Acceso* introduce un usuario y una contraseña.
   - Pulsa **Registrarse** para crear un nuevo usuario.
   - A partir de entonces podrás usar **Iniciar sesión** con esas credenciales.
   - La sesión se maneja mediante cookies (Express Session); tu colección es
     privada y sólo ves tus propios juegos.

2. **Alta de videojuegos (HU2)**
   - Completa el formulario *Nuevo videojuego* (título, plataforma, género,
     estado).
   - Pulsa **Guardar** para crear el videojuego.

3. **Edición de videojuegos (HU3)**
   - En la tabla de *Mis videojuegos* pulsa **Editar** en la fila deseada.
   - El formulario de la izquierda se rellenará con los datos del juego.
   - Modifica la información y pulsa **Guardar** para actualizarlo.
   - Puedes cancelar la edición con el botón **Cancelar edición**.

4. **Eliminación de videojuegos (HU4)**
   - En la tabla, pulsa **Eliminar** y confirma el mensaje.

5. **Gestión del estado (HU5)**
   - Haz clic en la “píldora” de estado del juego (Pendiente / En progreso /
     Completado).
   - Cada clic alterna el estado (pendiente → en progreso → completado → pendiente).

6. **Filtrado y consulta (HU6)**
   - En la parte superior de la tabla tienes campos de filtro por:
     - Plataforma
     - Género
     - Estado
   - Rellena los filtros deseados y pulsa **Aplicar filtros**.

---

## Estructura del proyecto

- `src/`
  - `server.ts`: configuración principal de Express y arranque del servidor.
  - `db.ts`: conexión y creación de tablas SQLite (`users` y `games`).
  - `auth.ts`: rutas de autenticación (registro, login, logout, `/me`) y middleware `requireAuth`.
  - `games.ts`: rutas CRUD de videojuegos y actualización de estado.
- `public/`
  - `index.html`: interfaz principal (Bootstrap, layout responsive).
  - `styles.css`: estilos adicionales.
  - `app.js`: lógica de frontend, llamadas a la API y manejo de UI.
- `data/database.sqlite`: archivo de base de datos (se genera automáticamente).

---

## Despliegue

Puedes desplegar el proyecto en cualquier plataforma que soporte Node.js
(Render, Railway, Fly.io, etc.). Pasos generales:

1. Sube el código a un repositorio de **GitHub**.
2. En la plataforma de despliegue, crea un nuevo servicio a partir del repositorio.
3. Configura:
   - Orden de build: `npm install && npm run build`
   - Orden de start: `npm run start`
4. La base de datos SQLite se almacenará como un archivo dentro del contenedor
   (`data/database.sqlite`). Para un proyecto de aula o demo es suficiente.

---

## Vídeo demostrativo

Para el reto, graba un vídeo corto mostrando:

- Registro y login de un usuario.
- Alta de varios videojuegos.
- Edición y eliminación de uno de ellos.
- Cambio de estado (pendiente / en progreso / completado).
- Uso de los filtros por plataforma, género y estado.

