import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { env } from "../config/env";
import { BookingModel } from "../modules/booking/booking.model";
import { GymClassModel } from "../modules/class/class.model";
import { UserModel } from "../modules/user/user.model";
import { Role } from "../modules/user/user.types";

/** Contraseña de todos los usuarios de ejemplo. Solo para desarrollo y pruebas. */
export const SEED_PASSWORD = "Velocore2026";

/** Argentina (Corrientes) no usa horario de verano: siempre UTC-3. */
const ARGENTINA_UTC_OFFSET_HOURS = 3;

/** Fecha futura: dentro de `daysAhead` días a las hh:mm hora de Corrientes. */
function futureClass(daysAhead: number, hour: number, minute = 0): Date {
  const nowArgentina = new Date(Date.now() - ARGENTINA_UTC_OFFSET_HOURS * 3_600_000);
  return new Date(
    Date.UTC(
      nowArgentina.getUTCFullYear(),
      nowArgentina.getUTCMonth(),
      nowArgentina.getUTCDate() + daysAhead,
      hour + ARGENTINA_UTC_OFFSET_HOURS,
      minute,
    ),
  );
}

const USERS: { key: string; name: string; email: string; role: Role }[] = [
  { key: "admin", name: "Admin Velocore", email: "admin@velocore.io", role: "admin" },
  { key: "lautaro", name: "Lautaro Maidana", email: "lautaro.maidana@velocore.io", role: "trainer" },
  { key: "camila", name: "Camila Benítez", email: "camila.benitez@velocore.io", role: "trainer" },
  { key: "ana", name: "Ana Socia", email: "ana.socia@velocore.io", role: "client" },
  { key: "facundo", name: "Facundo Ramírez", email: "facundo.ramirez@velocore.io", role: "client" },
];

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("El seeder borra datos y no puede ejecutarse con NODE_ENV=production");
  }

  await connectDatabase();
  const dbName = mongoose.connection.name;
  console.log(`Base de datos: "${dbName}"`);

  // 1. Limpieza: solo las colecciones de la aplicación.
  await Promise.all([BookingModel.deleteMany({}), GymClassModel.deleteMany({}), UserModel.deleteMany({})]);
  console.log("Datos anteriores eliminados");

  // 2. Usuarios
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, env.saltRounds);
  const users = new Map<string, mongoose.Types.ObjectId>();
  for (const { key, ...data } of USERS) {
    const user = await UserModel.create({ ...data, passwordHash });
    users.set(key, user._id);
  }
  const id = (key: string) => users.get(key)!;

  // 3. Clases (siempre a futuro, relativas al día en que se ejecuta el seeder)
  const classes = await GymClassModel.insertMany([
    {
      name: "Kickboxing",
      description: "Técnica de golpeo, combinaciones y acondicionamiento. Todos los niveles.",
      trainerId: id("lautaro"),
      startsAt: futureClass(1, 19),
      durationMinutes: 60,
      capacity: 12,
    },
    {
      name: "Boxeo",
      description: "Trabajo de guardia, desplazamientos y bolsa. Nivel intermedio.",
      trainerId: id("lautaro"),
      startsAt: futureClass(2, 20),
      durationMinutes: 75,
      capacity: 10,
    },
    {
      name: "Calistenia",
      description: "Fuerza con el peso del cuerpo: dominadas, fondos y core.",
      trainerId: id("camila"),
      startsAt: futureClass(2, 8),
      durationMinutes: 60,
      capacity: 15,
    },
    {
      name: "Boxeo Principiantes",
      description: "Primeros pasos en boxeo. Cupo reducido para atención personalizada.",
      trainerId: id("camila"),
      startsAt: futureClass(3, 18),
      durationMinutes: 60,
      capacity: 2,
    },
  ]);
  const classId = (name: string) => classes.find((c) => c.name === name)!._id;

  // 4. Reservas: incluye una clase llena y una reserva cancelada para mostrar ambos casos.
  await BookingModel.insertMany([
    { userId: id("ana"), classId: classId("Kickboxing") },
    { userId: id("ana"), classId: classId("Calistenia") },
    { userId: id("ana"), classId: classId("Boxeo Principiantes") },
    { userId: id("facundo"), classId: classId("Kickboxing") },
    { userId: id("facundo"), classId: classId("Boxeo") },
    { userId: id("facundo"), classId: classId("Boxeo Principiantes") },
    { userId: id("facundo"), classId: classId("Calistenia"), status: "cancelled", cancelledAt: new Date() },
  ]);

  console.log(`\nCargados: ${USERS.length} usuarios, ${classes.length} clases y 7 reservas.`);
  console.log(`\nUsuarios de ejemplo (contraseña de todos: ${SEED_PASSWORD})`);
  console.table(USERS.map(({ name, email, role }) => ({ nombre: name, email, rol: role })));
}

seed()
  .then(() => disconnectDatabase())
  .catch(async (error) => {
    console.error("No se pudo ejecutar el seeder:", error);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
