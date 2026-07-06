/**
 * Antes de setup: si no existe apps/api/.env, lo crea desde .env.example.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, "apps", "api", ".env");
const examplePath = path.join(root, "apps", "api", ".env.example");

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log("\n[prepare-env] Se creó apps/api/.env desde .env.example");
  } else {
    console.error("[prepare-env] Falta apps/api/.env.example");
    process.exit(1);
  }
  console.log("[prepare-env] Configurá DATABASE_URL (PostgreSQL) en apps/api/.env");
  console.log("[prepare-env] Solo para pruebas sin DB: NO_DATABASE=true");
}

process.exit(0);
