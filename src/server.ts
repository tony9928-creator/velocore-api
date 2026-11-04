import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";

async function main() {
  await connectDatabase();
  const server = createApp().listen(env.port, () => {
    console.log(`Velocore API escuchando en http://localhost:${env.port}/api`);
  });

  const shutdown = () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("No se pudo iniciar la API:", err);
  process.exit(1);
});
