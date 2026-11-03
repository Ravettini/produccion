import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = "admin.ssccyrs@gobierno.gob";
const password = "admin123";

try {
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Administrador General SSCCYRS",
      role: "ADMINISTRADOR_GENERAL",
      area: "SS. de Cultura Ciudadana y Responsabilidad Social",
      esSsccyrs: true,
      password: hash,
    },
    create: {
      email,
      password: hash,
      name: "Administrador General SSCCYRS",
      role: "ADMINISTRADOR_GENERAL",
      area: "SS. de Cultura Ciudadana y Responsabilidad Social",
      esSsccyrs: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      area: true,
      esSsccyrs: true,
    },
  });
  console.log("OK", JSON.stringify(user, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
