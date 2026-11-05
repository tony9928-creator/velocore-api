// Genera el entorno de Thunder Client con tokens e IDs reales del seed.
// Requiere la API corriendo y el seed cargado. Uso: npm run thunder:env
//
// 1. Escribe docs/thunder/velocore.environment.json (formato nativo de Thunder, para importar).
// 2. Si Thunder Client está instalado en VS Code, actualiza también su entorno "Velocore"
//    directamente (después hay que recargar VS Code: Ctrl+Shift+P > Reload Window).
import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api`;
const PASSWORD = "Velocore2026";
const ENV_NAME = "Velocore";
const OUT = fileURLToPath(new URL("../docs/thunder/velocore.environment.json", import.meta.url));
const THUNDER_ENVS = process.env.APPDATA
  ? join(process.env.APPDATA, "Code", "User", "globalStorage", "rangav.vscode-thunder-client", "environments")
  : undefined;

async function call(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${data.message ?? ""}`);
  return data;
}

const login = (email) => call("/auth/login", { method: "POST", body: { email, password: PASSWORD } });

/** Actualiza el entorno "Velocore" guardado por Thunder Client, si existe. Devuelve la ruta o undefined. */
function syncThunder(data) {
  if (!THUNDER_ENVS || !existsSync(THUNDER_ENVS)) return undefined;
  for (const file of readdirSync(THUNDER_ENVS).filter((f) => f.endsWith(".json"))) {
    const path = join(THUNDER_ENVS, file);
    const env = JSON.parse(readFileSync(path, "utf8"));
    if (env.name !== ENV_NAME) continue;
    env.data = data;
    env.modified = new Date().toISOString();
    writeFileSync(path, JSON.stringify(env, null, 4));
    return path;
  }
  return undefined;
}

try {
  await call("/health");
  const [admin, trainer, client] = await Promise.all([
    login("admin@velocore.io"),
    login("lautaro.maidana@velocore.io"),
    login("ana.socia@velocore.io"),
  ]);

  const classes = await call("/classes");
  const byName = (name) => classes.find((c) => c.name === name);

  // Reserva confirmada de Ana (del seed): sirve para probar "Cancelar reserva".
  const bookings = await call("/bookings/me", { token: client.token });

  const values = {
    base: BASE,
    adminToken: admin.token,
    trainerToken: trainer.token,
    clientToken: client.token,
    kickboxingId: byName("Kickboxing")?.id,
    boxeoId: byName("Boxeo")?.id,
    calisteniaId: byName("Calistenia")?.id,
    fullClassId: byName("Boxeo Principiantes")?.id,
    bookingId: bookings.find((b) => b.status === "confirmed")?.id,
    // Día (UTC) de la clase de Kickboxing, para el filtro ?date=AAAA-MM-DD.
    classDate: byName("Kickboxing")?.startsAt.slice(0, 10),
  };
  const data = Object.entries(values).map(([name, value]) => ({ name, value: value ?? "" }));

  const now = new Date().toISOString();
  const environment = { _id: randomUUID(), name: ENV_NAME, default: true, sortNum: 10000, created: now, modified: now, data };
  writeFileSync(OUT, JSON.stringify(environment, null, 2) + "\n");
  console.log(`Entorno escrito en ${OUT}`);

  const synced = syncThunder(data);
  if (synced) console.log(`Thunder Client actualizado. Recarga VS Code (Ctrl+Shift+P > Reload Window).`);
  else console.log(`Importalo en Thunder Client: Env > Import > ${OUT}`);

  const missing = data.filter((v) => !v.value).map((v) => v.name);
  if (missing.length) console.warn(`Atención: sin valor -> ${missing.join(", ")}. ¿Corriste npm run seed?`);
} catch (error) {
  console.error(`No se pudo generar el entorno: ${error.message}`);
  console.error("Revisa que la API esté corriendo (npm run dev) y que hayas cargado el seed (npm run seed).");
  process.exit(1);
}
