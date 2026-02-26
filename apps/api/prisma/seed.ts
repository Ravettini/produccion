import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Áreas sin código (mismo orden que en frontend). Un usuario por área con rol ORGANIZACION (solo crear eventos y propuestas). */
const AREAS_USUARIOS: { area: string; email: string; name: string }[] = [
  { area: "Cultura Ciudadana y Responsabilidad Social", email: "cultura.ciudadana@gobierno.gob", name: "Usuario Cultura Ciudadana" },
  { area: "Bienestar Ciudadano", email: "bienestar.ciudadano@gobierno.gob", name: "Usuario Bienestar Ciudadano" },
  { area: "Cultura del Servicio Público", email: "cultura.servicio.publico@gobierno.gob", name: "Usuario Cultura del Servicio Público" },
  { area: "Comunicación Interna", email: "comunicacion.interna@gobierno.gob", name: "Usuario Comunicación Interna" },
  { area: "Cultura Organizacional", email: "cultura.organizacional@gobierno.gob", name: "Usuario Cultura Organizacional" },
  { area: "Políticas de Juventud", email: "politicas.juventud@gobierno.gob", name: "Usuario Políticas de Juventud" },
  { area: "Relaciones Gubernamentales", email: "relaciones.gubernamentales@gobierno.gob", name: "Usuario Relaciones Gubernamentales" },
  { area: "Relaciones con la Comunidad", email: "relaciones.comunidad@gobierno.gob", name: "Usuario Relaciones con la Comunidad" },
  { area: "Responsabilidad Social", email: "responsabilidad.social@gobierno.gob", name: "Usuario Responsabilidad Social" },
  { area: "Transformación Cultural", email: "transformacion.cultural@gobierno.gob", name: "Usuario Transformación Cultural" },
  { area: "Cooperación territorial", email: "cooperacion.territorial@gobierno.gob", name: "Usuario Cooperación territorial" },
  { area: "Promotores BA", email: "promotores.ba@gobierno.gob", name: "Usuario Promotores BA" },
  { area: "Dirección de la Mujer", email: "direccion.mujer@gobierno.gob", name: "Usuario Dirección de la Mujer" },
  { area: "Autonomía Económica", email: "autonomia.economica@gobierno.gob", name: "Usuario Autonomía Económica" },
  { area: "Igualdad de Oportunidades", email: "igualdad.oportunidades@gobierno.gob", name: "Usuario Igualdad de Oportunidades" },
];

const PASSWORD_AREA_USUARIOS = "usuario123";

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  const hashArea = await bcrypt.hash(PASSWORD_AREA_USUARIOS, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gobierno.gob" },
    update: { area: "Sistema" },
    create: {
      email: "admin@gobierno.gob",
      password: hash,
      name: "Admin Sistema",
      role: "ADMIN",
      area: "Sistema",
    },
  });

  const validador = await prisma.user.upsert({
    where: { email: "validador@gobierno.gob" },
    update: { area: "Validador" },
    create: {
      email: "validador@gobierno.gob",
      password: hash,
      name: "Validador General",
      role: "VALIDADOR",
      area: "Validador",
    },
  });

  const organizacion = await prisma.user.upsert({
    where: { email: "organizacion@gobierno.gob" },
    update: { area: "Comunicación Interna" },
    create: {
      email: "organizacion@gobierno.gob",
      password: hash,
      name: "Usuario Organización",
      role: "ORGANIZACION",
      area: "Comunicación Interna",
    },
  });

  // Un usuario por área (rol ORGANIZACION: solo crear eventos y propuestas)
  for (const { area, email, name } of AREAS_USUARIOS) {
    await prisma.user.upsert({
      where: { email },
      update: { area, name, role: "ORGANIZACION" },
      create: {
        email,
        password: hashArea,
        name,
        role: "ORGANIZACION",
        area,
      },
    });
  }

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

  // --- Evento demo con todas las propuestas para brief completo ---
  let eventoSemilla = await prisma.event.findFirst({
    where: { titulo: "Evento demo - Brief completo" },
  });
  if (!eventoSemilla) {
    eventoSemilla = await prisma.event.create({
      data: {
        titulo: "Evento demo - Brief completo",
        descripcion:
          "Evento de ejemplo con todas las áreas cubiertas para generar un brief DOC completo: logística, catering, técnica, agenda, producción y otros.",
        tipoEvento: "Jornada, Institucionales, Cobertura",
        areaSolicitante: "Subsecretaría de Comunicación",
        fechaTentativa: new Date("2025-04-20"),
        estado: "CONFIRMADO",
        resumen: "Resumen aprobado: sede CCK, coffee break para 80 personas, pantalla LED y proyector confirmados.",
        publico: "MIXTO",
        usuarioSolicitante: "María García",
        lugar: "Centro Cultural Kirchner, Sala Argentina",
        programa: "Director General, Subsecretario de Comunicación, Invitados especiales",
      },
    });
  }
  const demoEventId = eventoSemilla.id;
  const demoPropCount = await prisma.proposal.count({ where: { eventId: demoEventId } });
  if (demoPropCount === 0) {
    await prisma.proposal.create({
      data: {
        eventId: demoEventId,
        titulo: "Logística sede y montaje",
        descripcion: "Montaje en Sala Argentina. Acceso por entrada principal. Horario de montaje coordinado con producción.",
        categoria: "LOGISTICA",
        impacto: "ALTO",
        estado: "APPROVED",
        createdById: admin.id,
        validatedById: admin.id,
        datosExtra: JSON.stringify({
          lugar: "Centro Cultural Kirchner, Sala Argentina",
          horarioMontaje: "8:00 hs",
        }),
      },
    });
    await prisma.proposal.create({
      data: {
        eventId: demoEventId,
        titulo: "Coffee break",
        descripcion: "Coffee break para asistentes en el intervalo.",
        categoria: "CATERING",
        impacto: "MEDIO",
        estado: "APPROVED",
        createdById: admin.id,
        validatedById: admin.id,
        datosExtra: JSON.stringify({
          cantidadPersonas: "80",
          restriccionesAlimentarias: "Opciones sin TACC y veganas disponibles",
        }),
      },
    });
    await prisma.proposal.create({
      data: {
        eventId: demoEventId,
        titulo: "Equipamiento técnico",
        descripcion: "Sistema de sonido, proyector y pantalla para presentaciones.",
        categoria: "TECNICA",
        impacto: "ALTO",
        estado: "APPROVED",
        createdById: admin.id,
        validatedById: admin.id,
        datosExtra: JSON.stringify({
          equipamiento: "Sonido, proyector, pantalla",
          requerimientosTecnicos: "Conexión HDMI, 2 micrófonos inalámbricos",
        }),
      },
    });
    await prisma.proposal.create({
      data: {
        eventId: demoEventId,
        titulo: "Apertura institucional",
        descripcion: "Palabras de bienvenida del Director General.",
        categoria: "AGENDA",
        impacto: "ALTO",
        estado: "APPROVED",
        createdById: admin.id,
        validatedById: admin.id,
        datosExtra: JSON.stringify({
          horario: "9:00 hs",
          duracionEstimada: "15 min",
        }),
      },
    });
    await prisma.proposal.create({
      data: {
        eventId: demoEventId,
        titulo: "Panel central",
        descripcion: "Panel sobre gobierno abierto con invitados.",
        categoria: "AGENDA",
        impacto: "ALTO",
        estado: "APPROVED",
        createdById: admin.id,
        validatedById: admin.id,
        datosExtra: JSON.stringify({
          horario: "9:30 a 11:00 hs",
          duracionEstimada: "1h 30min",
        }),
      },
    });
    await prisma.proposal.create({
      data: {
        eventId: demoEventId,
        titulo: "Producción integral",
        descripcion:
          "Producción general: técnica (pantalla LED, proyector, sonido, micrófonos), catering (coffee break 80 personas), materiales y artes gráficas según definiciones.",
        categoria: "PRODUCCION",
        impacto: "ALTO",
        estado: "APPROVED",
        createdById: admin.id,
        validatedById: admin.id,
        datosExtra: JSON.stringify({
          horarioCitacion: "8:00 hs",
          lugar: "CCK - Sala Argentina",
          cantidadPersonas: "80",
          equipamiento: "Pantalla LED, proyector, sonido, 2 micrófonos",
          pantallaLED: "si",
          pantallaLEDCantidad: "1",
          proyector: "si",
          sonido: "si",
          microfonos: "si",
          microfonosCantidad: "2",
          requerimientosTecnicos: "HDMI, mesa de mezclas",
          tipoCatering: "coffee break",
          cateringCantidad: "80",
          restriccionesAlimentarias: "Opciones sin TACC y veganas",
          comunicacionPieza: "Afiche A3 y gacetilla de prensa",
          comunicacionMedio: "Redes institucionales y prensa",
          comunicacionMensajeClave: "Jornada de Gobierno Abierto 2025 - Transparencia y participación",
          comunicacionRestriccionesDiseno: "Colores institucionales, logo oficial",
          comunicacionPlazoEntrega: "5 días hábiles antes del evento",
        }),
      },
    });
    await prisma.proposal.create({
      data: {
        eventId: demoEventId,
        titulo: "Materiales y referente",
        descripcion: "Banners institucionales, folletos. Referente: María García.",
        categoria: "OTRO",
        impacto: "MEDIO",
        estado: "APPROVED",
        createdById: admin.id,
        validatedById: admin.id,
        datosExtra: JSON.stringify({}),
      },
    });
    console.log("Evento demo brief completo creado:", demoEventId);
  }

  console.log("Seed OK:", {
    admin: admin.email,
    validador: validador.email,
    organizacion: organizacion.email,
    usuariosPorArea: AREAS_USUARIOS.length,
    passwordAreaUsuarios: PASSWORD_AREA_USUARIOS,
    evento: eventId,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
