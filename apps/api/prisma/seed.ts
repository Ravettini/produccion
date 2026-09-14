import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // El seed está completamente bloqueado para proteger la base de datos y evitar crear usuarios de prueba.
  // Solo se permite ejecutar con ALLOW_MANUAL_SEED="true" si la base está completamente vacía (0 usuarios).
  if (process.env.ALLOW_MANUAL_SEED !== "true") {
    console.log("[seed] BLOQUEADO: El seed automático está desactivado para evitar la creación de usuarios no deseados.");
    return;
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`[seed] Omitiendo seed: ya existen ${userCount} usuarios en la base de datos.`);
    return;
  }

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@gobierno.gob";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { area: "Sistema" },
    create: {
      email: adminEmail,
      password: hash,
      name: "Admin Sistema",
      role: "ADMIN",
      area: "Sistema",
    },
  });

  console.log("[seed] Base de datos en blanco: se configuró únicamente el usuario admin principal:", admin.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
