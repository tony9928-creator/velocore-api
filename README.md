# Velocore API

API REST para gestionar un gimnasio: usuarios con roles, clases con cupo y reservas.
Construida con Node.js, TypeScript, Express y MongoDB Atlas.

## Tecnologías

| Área | Herramienta |
|---|---|
| Runtime y lenguaje | Node.js + TypeScript (modo `strict`) |
| Framework | Express 5 |
| Base de datos | MongoDB Atlas + Mongoose |
| Autenticación | JWT (`jsonwebtoken`) + bcrypt |
| Validación | Zod |
| Configuración | dotenv |

## Instalación

Requisitos: Node.js 20 o superior y una base de datos MongoDB (Atlas gratuito o MongoDB local).

**1. Clonar e instalar**

```bash
git clone <url-del-repositorio>
cd velocore-api
npm install
```

**2. Configurar el `.env`**

```bash
cp .env.example .env     # en Windows PowerShell: Copy-Item .env.example .env
```

Abre el `.env` y completa `MONGO_URI` (con **tu propia** base de datos) y `JWT_SECRET`. El detalle de cada variable está en la sección siguiente.

**3. Arrancar la API**

```bash
npm run dev
```

La API queda en `http://localhost:3000/api`. Comprueba que responde con `GET /api/health`.

**4. Cargar los datos de ejemplo**

```bash
npm run seed
```

Crea usuarios, clases y reservas de ejemplo (ver [Datos de ejemplo](#datos-de-ejemplo-seeder)) para poder probar todo de inmediato.

Otros comandos:

```bash
npm run build      # compila a dist/
npm start          # ejecuta la versión compilada
npm run typecheck  # verifica tipos sin compilar
```

## Variables de entorno (`.env`)

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `PORT` | No | Puerto HTTP (por defecto `3000`) | `3000` |
| `MONGO_URI` | Sí | Cadena de conexión de MongoDB, **terminada en el nombre de la base** (también se acepta `MONGODB_URI`) | `mongodb+srv://USUARIO:CLAVE@CLUSTER.mongodb.net/velocore?retryWrites=true&w=majority` |
| `JWT_SECRET` | Sí | Secreto para firmar los tokens. Usa uno largo y aleatorio | — |
| `JWT_EXPIRES_IN` | No | Duración del token (por defecto `1d`) | `1d`, `12h` |
| `BCRYPT_SALT_ROUNDS` | No | Costo del hash de contraseñas (por defecto `10`) | `10` |

El archivo `.env` está en `.gitignore` y nunca se sube al repositorio. En Atlas, recuerda permitir tu IP en **Network Access**.

> **Importante:** el nombre de la base (`velocore` en el ejemplo) va después del host y antes del `?`. Si lo omites, MongoDB usa una base llamada `test`. El seeder **borra** las colecciones de la base configurada, así que apunta siempre a una base propia.

Si prefieres MongoDB local, usa `MONGO_URI=mongodb://127.0.0.1:27017/velocore`.

## Arquitectura

Estructura por módulos. Cada módulo separa sus capas: `routes → controller → service → repository → model`.

```
src/
├── app.ts                  # Express, middlewares globales y composición de dependencias
├── server.ts               # arranque y cierre ordenado
├── config/                 # env.ts (variables), database.ts (conexión a MongoDB)
├── errors/AppError.ts      # error de aplicación con código HTTP
├── seeds/seeder.ts         # datos de ejemplo (npm run seed)
├── middlewares/
│   ├── auth.middleware.ts      # verifica el JWT
│   ├── role.middleware.ts      # verifica el rol
│   ├── validate.middleware.ts  # valida body y params con Zod
│   ├── logger.middleware.ts    # registra método, URL, status y tiempo
│   └── error.middleware.ts     # manejador global de errores y 404
├── modules/
│   ├── auth/      # registro y login
│   ├── user/      # perfil, listado y roles
│   ├── class/     # clases del gimnasio
│   └── booking/   # reservas
├── types/express.d.ts      # tipo de req.auth
└── utils/validation.ts     # validadores compartidos (ObjectId)
```

- **Controllers:** solo manejan req/res. Cada método usa `try/catch` y delega el error con `next(error)`.
- **Services:** toda la lógica y las reglas de negocio.
- **Repositories:** el único lugar que habla con MongoDB.

## Datos de ejemplo (seeder)

`npm run seed` deja la base lista para probar. **Borra** usuarios, clases y reservas de la base configurada en `MONGO_URI` y carga:

| Nombre | Email | Rol |
|---|---|---|
| Admin Velocore | `admin@velocore.io` | admin |
| Lautaro Maidana | `lautaro.maidana@velocore.io` | trainer |
| Camila Benítez | `camila.benitez@velocore.io` | trainer |
| Ana Socia | `ana.socia@velocore.io` | client |
| Facundo Ramírez | `facundo.ramirez@velocore.io` | client |

**Contraseña de todos: `Velocore2026`**

| Clase | Instructor | Cupo | Cuándo (hora de Corrientes) |
|---|---|---|---|
| Kickboxing | Lautaro Maidana | 12 | mañana, 19:00 |
| Calistenia | Camila Benítez | 15 | en 2 días, 08:00 |
| Boxeo | Lautaro Maidana | 10 | en 2 días, 20:00 |
| Boxeo Principiantes | Camila Benítez | 2 (llena) | en 3 días, 18:00 |

Las fechas se calculan a partir del día en que ejecutas el seeder, por lo que las clases siempre quedan a futuro. También carga 7 reservas, entre ellas una clase completa (Boxeo Principiantes) y una reserva cancelada. Puedes volver a ejecutarlo cuando quieras para restaurar el estado inicial.

Por seguridad, el seeder se niega a correr si `NODE_ENV=production`.

## Roles

| Acción | admin | trainer | client |
|---|---|---|---|
| Ver clases y disponibilidad | ✅ | ✅ | ✅ (también sin registrarse) |
| Crear clase | ✅ | ✅ (a su nombre) | ❌ |
| Editar clase (PUT/PATCH) | ✅ | ✅ (solo las suyas) | ❌ |
| Eliminar clase | ✅ | ❌ | ❌ |
| Reservar clase | ❌ | ❌ | ✅ |
| Ver sus reservas | ✅ | ✅ | ✅ |
| Ver reservas de clases | ✅ (todas) | ✅ (de sus clases) | ❌ |
| Cancelar reserva | ✅ (cualquiera) | ❌ | ✅ (solo las suyas) |
| Listar usuarios y cambiar roles | ✅ | ❌ | ❌ |

El registro público siempre crea usuarios `client`. El primer `admin` se asigna directamente en la base de datos; luego ese admin puede cambiar roles con `PATCH /api/users/:id/role`.

## Endpoints

Base: `http://localhost:3000/api`. 🔒 = requiere `Authorization: Bearer <token>`.

### Salud
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado de la API |

### Autenticación
| Método | Ruta | Acceso | Body | Respuesta |
|---|---|---|---|---|
| POST | `/auth/register` | Público | `name`, `email`, `password` | `201` `{ user, token }` |
| POST | `/auth/login` | Público | `email`, `password` | `200` `{ user, token }` |

Contraseña: entre 8 y 72 caracteres, con al menos una letra y un número.

### Usuarios
| Método | Ruta | Acceso | Body | Descripción |
|---|---|---|---|---|
| GET | `/users/me` | 🔒 Cualquier rol | — | Perfil del usuario autenticado |
| GET | `/users` | 🔒 admin | — | Lista de usuarios |
| PATCH | `/users/:id/role` | 🔒 admin | `role`: `admin`, `trainer` o `client` | Cambia el rol |

### Clases
| Método | Ruta | Acceso | Body | Descripción |
|---|---|---|---|---|
| GET | `/classes` | Público | — | Lista con `availableSlots`. Acepta filtros (ver abajo) |
| GET | `/classes/:id` | Público | — | Detalle con `availableSlots` |
| POST | `/classes` | 🔒 admin, trainer | `name`, `description?`, `startsAt`, `durationMinutes`, `capacity`, `trainerId?` | Crea una clase (`201`) |
| PUT | `/classes/:id` | 🔒 admin, trainer dueño | `name`, `description?`, `startsAt`, `durationMinutes`, `capacity` | Reemplazo completo |
| PATCH | `/classes/:id` | 🔒 admin, trainer dueño | cualquiera de los campos anteriores | Cambio parcial |
| DELETE | `/classes/:id` | 🔒 admin | — | Elimina la clase y cancela sus reservas |

**Filtros de `GET /classes`** (combinables):

| Query | Ejemplo | Descripción |
|---|---|---|
| `instructor` | `?instructor=665f...` | Clases de un instructor (id de usuario) |
| `date` | `?date=2026-12-01` | Clases que empiezan ese día (UTC) |
| `name` | `?name=yoga` | Búsqueda parcial por nombre, sin distinguir mayúsculas |

`trainerId` solo lo tiene en cuenta un admin; un trainer siempre crea clases a su nombre.

### Reservas
| Método | Ruta | Acceso | Body | Descripción |
|---|---|---|---|---|
| POST | `/bookings` | 🔒 client | `classId` | Reserva una clase (`201`) |
| GET | `/bookings/me` | 🔒 Cualquier rol | — | Reservas del usuario autenticado |
| GET | `/bookings` | 🔒 admin, trainer | — | Admin: todas. Trainer: las de sus clases. Acepta `?classId=` |
| DELETE | `/bookings/:id` | 🔒 dueño o admin | — | Cancela la reserva (queda con `status: "cancelled"`) |

## Reglas de negocio

1. El cupo (`capacity`) es un entero mayor a 0 (máximo 500).
2. La fecha (`startsAt`) debe ser válida y futura.
3. No se puede reservar una clase llena, ni una que ya empezó.
4. Un cliente no puede tener dos reservas confirmadas en la misma clase (lo garantiza un índice único).
5. No se puede bajar el cupo por debajo de las reservas confirmadas.
6. Un trainer solo puede editar sus propias clases.
7. El instructor de una clase debe tener rol `trainer` o `admin`.
8. Solo el cliente dueño o un admin pueden cancelar una reserva.

## Respuestas y errores

Las respuestas exitosas devuelven el recurso en JSON. Todos los errores tienen el mismo formato:

```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [{ "field": "capacity", "message": "El cupo debe ser mayor a 0" }]
}
```

| Código | Cuándo |
|---|---|
| `200` | Lectura, actualización, cancelación o eliminación exitosa |
| `201` | Registro, clase o reserva creada |
| `400` | Validación fallida, JSON mal formado o regla de negocio incumplida |
| `401` | Sin token, token inválido o vencido, credenciales incorrectas |
| `403` | Autenticado pero sin permiso (rol o propiedad del recurso) |
| `404` | Recurso o ruta inexistente |
| `409` | Conflicto: email ya registrado, clase llena, reserva duplicada o ya cancelada |
| `500` | Error interno no controlado |

## Logging

Cada petición se registra en consola al terminar:

```
[GET] /api/classes?name=boxeo - 200 - 73.0 ms
```

## Pruebas manuales

El archivo [`requests.http`](requests.http) tiene todas las peticiones, incluidos los casos de error (400, 401, 403, 404, 409). Se ejecuta con la extensión **REST Client** de VS Code (`humao.rest-client`).

1. Arranca la API (`npm run dev`) y carga los datos (`npm run seed`).
2. Abre `requests.http` y ejecuta primero la sección **1. Login**: guarda los tokens de cada usuario en variables.
3. Sigue en orden. Cada petición indica en su título el código HTTP esperado.

Si cierras VS Code se pierden las variables: vuelve a ejecutar los logins. Para volver al estado inicial, ejecuta `npm run seed`.

## Seguridad

- Las contraseñas se guardan con hash bcrypt y nunca se devuelven en las respuestas.
- El JWT solo contiene el id del usuario y su rol.
- Los secretos se leen del `.env`; no hay credenciales en el código.
