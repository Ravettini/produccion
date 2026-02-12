import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gobierno.gob" },
    update: {},
    create: {
      email: "admin@gobierno.gob",
      password: hash,
      name: "Admin Sistema",
      role: "ADMIN",
    },
  });

  const validador = await prisma.user.upsert({
    where: { email: "validador@gobierno.gob" },
    update: {},
    create: {
      email: "validador@gobierno.gob",
      password: hash,
      name: "Validador General",
      role: "VALIDADOR",
    },
  });

  const organizacion = await prisma.user.upsert({
    where: { email: "organizacion@gobierno.gob" },
    update: {},
    create: {
      email: "organizacion@gobierno.gob",
      password: hash,
      name: "Usuario Organización",
      role: "ORGANIZACION",
    },
  });

  let evento = await prisma.event.findFirst({
    where: { titulo: "Jornada de Gobierno Abierto 2025" },
  });
  if (!evento) {
    evento = await prisma.event.create({
      data: {
        titulo: "Jornada de Gobierno Abierto 2025",
        descripcion: "Evento anual de transparencia y participación ciudadana.",
        tipoEvento: "Jornada",
        areaSolicitante: "Subsecretaría de Gestión Pública",
        fechaTentativa: new Date("2025-03-15"),
        estado: "EN_ANALISIS",
      },
    });
  }
  const eventId = evento.id;

  const propCount = await prisma.proposal.count({ where: { eventId } });
  if (propCount === 0) {
    await prisma.proposal.create({
      data: {
        eventId,
        titulo: "Cambio de locación al CCK",
        descripcion: "Sugerimos mover el evento al Centro Cultural Kirchner por capacidad y visibilidad.",
        categoria: "LOGISTICA",
        impacto: "ALTO",
        estado: "SUBMITTED",
        createdById: admin.id,
      },
    });
    await prisma.proposal.create({
      data: {
        eventId,
        titulo: "Catering vegano y sin TACC",
        descripcion: "Incluir opciones veganas y sin gluten para el coffee break.",
        categoria: "CATERING",
        impacto: "MEDIO",
        estado: "DRAFT",
        createdById: admin.id,
      },
    });
  }

  console.log("Seed OK:", { admin: admin.email, validador: validador.email, organizacion: organizacion.email, evento: eventId });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
