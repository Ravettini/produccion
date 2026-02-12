/**
 * Antes de setup: si no existe apps/api/.env, lo crea desde .env.example
 * y sale con error para que el usuario edite DATABASE_URL y vuelva a ejecutar.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, "apps", "api", ".env");
const examplePath = path.join(root, "apps", "api", ".env.example");

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.error("\n[prepare-env] Se creó apps/api/.env desde .env.example\n");
  }
  console.error("[prepare-env] Editá apps/api/.env si querés (JWT_SECRET, etc.).");
  console.error("  Después ejecutá de nuevo: npm run start\n");
  process.exit(1);
}

process.exit(0);
