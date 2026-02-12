import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  Packer,
  type FileChild,
} from "docx";
import type { BriefInput } from "../schemas/index.js";
import { normalizeInput, formatFechaEsAR, formatPublico } from "../normalize/index.js";
import {
  filterApproved,
  groupByCategory,
  resolveValue,
  resolveReferente,
  resolveLugar,
  buildCronogramaRows,
  matchTecnicaItem,
  getMicrofonosCount,
  matchCateringTipo,
  getCateringRestricciones,
  getCateringCantidad,
  hasEvidenciaMateriales,
  hasEvidenciaPedidosEspeciales,
  CATEGORY_LABELS,
  type ApprovedProposal,
  type CategoryKey,
} from "../rules/index.js";

const POR_CONFIRMAR = "Por confirmar";
const NO_DEFINIDO = "No definido";

/** Color institucional del template BRIEF ESTRATÉGICO (verde azulado) */
const COLOR_PRINCIPAL = "153244";
const COLOR_BLANCO = "FFFFFF";

function labelValue(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: COLOR_PRINCIPAL, size: 20 }),
      new TextRun({ text: value, color: COLOR_PRINCIPAL, size: 20 }),
    ],
    spacing: { before: 0, after: 0 },
  });
}

function sectionHeading(emoji: string, title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${emoji} ${title}`,
        bold: true,
        color: COLOR_PRINCIPAL,
        size: 20,
      }),
    ],
    spacing: { before: 360, after: 120 },
  });
}

function buildDefinicionesAprobadas(byCategory: Map<CategoryKey, ApprovedProposal[]>): FileChild[] {
  const children: FileChild[] = [];
  const cats: CategoryKey[] = ["LOGISTICA", "CATERING", "TECNICA", "AGENDA", "PRODUCCION", "OTRO"];
  let hasAny = false;
  for (const cat of cats) {
    const props = byCategory.get(cat) ?? [];
    if (props.length === 0) continue;
    hasAny = true;
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: CATEGORY_LABELS[cat] ?? cat,
            bold: true,
            color: COLOR_PRINCIPAL,
            size: 20,
          }),
        ],
        spacing: { before: 240, after: 80 },
      })
    );
    for (const prop of props) {
      const line = `${prop.titulo}${prop.nombreProyecto ? ` (Proyecto: ${prop.nombreProyecto})` : ""}: ${prop.descripcion}`;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, color: COLOR_PRINCIPAL, size: 20 })],
          bullet: { level: 0 },
          spacing: { before: 0, after: 0 },
        })
      );
    }
  }
  if (!hasAny) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Sin definiciones aún.", italics: true, color: COLOR_PRINCIPAL }),
        ],
      })
    );
  }
  return children;
}

function buildCronogramaTable(rows: Array<{ horario: string; dinamica: string; orador: string }>): Table {
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Horario", bold: true, color: COLOR_PRINCIPAL }),
              ],
            }),
          ],
          shading: { fill: "E8EEF2" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Dinámica", bold: true, color: COLOR_PRINCIPAL }),
              ],
            }),
          ],
          shading: { fill: "E8EEF2" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Orador", bold: true, color: COLOR_PRINCIPAL }),
              ],
            }),
          ],
          shading: { fill: "E8EEF2" },
        }),
      ],
    }),
    ...rows.map(
      (r) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: r.horario, color: COLOR_PRINCIPAL })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: r.dinamica, color: COLOR_PRINCIPAL })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: r.orador, color: COLOR_PRINCIPAL })] })],
            }),
          ],
        })
    ),
  ];
  return new Table({
    rows: tableRows,
    width: { size: 100, type: "pct" },
  });
}

function buildBriefProduccionTable(approved: ApprovedProposal[]): Table {
  const tecnicaPantalla = matchTecnicaItem(approved, "pantallaLED");
  const tecnicaProyector = matchTecnicaItem(approved, "proyector");
  const tecnicaSonido = matchTecnicaItem(approved, "sonido");
  const tecnicaMicro = matchTecnicaItem(approved, "microfonos");
  const microCount = getMicrofonosCount(approved);
  const cateringTipos = matchCateringTipo(approved);
  const cateringRest = getCateringRestricciones(approved);
  const cateringCant = getCateringCantidad(approved);
  const materiales = hasEvidenciaMateriales(approved);
  const pedidosEsp = hasEvidenciaPedidosEspeciales(approved);

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Ítem", bold: true, color: COLOR_PRINCIPAL })],
            }),
          ],
          shading: { fill: "E8EEF2" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Estado / Detalle", bold: true, color: COLOR_PRINCIPAL })],
            }),
          ],
          shading: { fill: "E8EEF2" },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Técnica - Pantalla LED", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: tecnicaPantalla.found ? `Sí. ${tecnicaPantalla.detail}` : NO_DEFINIDO,
                  color: COLOR_PRINCIPAL,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Técnica - Proyector", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: tecnicaProyector.found ? `Sí. ${tecnicaProyector.detail}` : NO_DEFINIDO,
                  color: COLOR_PRINCIPAL,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Técnica - Sonido", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: tecnicaSonido.found ? `Sí. ${tecnicaSonido.detail}` : NO_DEFINIDO,
                  color: COLOR_PRINCIPAL,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Técnica - Micrófonos", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: tecnicaMicro.found ? `Sí. Cantidad: ${microCount}` : NO_DEFINIDO,
                  color: COLOR_PRINCIPAL,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Catering - Tipo", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    [
                      cateringTipos.desayuno && "Desayuno",
                      cateringTipos.almuerzo && "Almuerzo",
                      cateringTipos.cena && "Cena",
                      cateringTipos.coffeeBreak && "Coffee break",
                    ]
                      .filter(Boolean)
                      .join(", ") || POR_CONFIRMAR,
                  color: COLOR_PRINCIPAL,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Catering - Cantidad", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: cateringCant, color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Catering - Restricciones", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: cateringRest, color: COLOR_PRINCIPAL }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Listado de materiales", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: materiales ? "Sí (según propuestas aprobadas)" : NO_DEFINIDO,
                  color: COLOR_PRINCIPAL,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Artes gráficas", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: materiales ? "Sí (según propuestas aprobadas)" : NO_DEFINIDO,
                  color: COLOR_PRINCIPAL,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Pedidos especiales", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: pedidosEsp ? "Sí (según propuestas aprobadas)" : NO_DEFINIDO,
                  color: COLOR_PRINCIPAL,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  return new Table({
    rows,
    width: { size: 100, type: "pct" },
  });
}

export function buildBriefDocument(input: BriefInput): Document {
  const normalized = normalizeInput(input);
  const approved = filterApproved(normalized.proposals);
  const byCategory = groupByCategory(approved);

  const event = normalized.event;
  const titulo = resolveValue(event.titulo, "Sin título");
  const fecha = formatFechaEsAR(event.fechaTentativa);
  const publico = formatPublico(event.publico);
  const area = resolveValue(event.areaSolicitante);
  const referente = resolveReferente(event, approved);
  const requiere =
    event.requiere?.length ? event.requiere.join(", ") : POR_CONFIRMAR;
  const lugarEvent = (event as { lugar?: string | null }).lugar;
  const lugar =
    lugarEvent != null && String(lugarEvent).trim() !== ""
      ? resolveValue(lugarEvent)
      : resolveLugar(approved);

  const cronogramaRows = buildCronogramaRows(approved);

  const children: FileChild[] = [
    // Encabezado: BRIEF ESTRATÉGICO (blanco sobre fondo verde azulado)
    new Paragraph({
      children: [
        new TextRun({
          text: "BRIEF ESTRATÉGICO",
          bold: true,
          color: COLOR_BLANCO,
          size: 48,
        }),
      ],
      shading: { fill: COLOR_PRINCIPAL },
      alignment: "center" as const,
      spacing: { after: 200 },
    }),
    // Título de la actividad
    new Paragraph({
      children: [
        new TextRun({
          text: titulo,
          bold: true,
          color: COLOR_PRINCIPAL,
          size: 24,
        }),
      ],
      alignment: "center" as const,
      spacing: { after: 400 },
    }),

    sectionHeading("📝", "Datos básicos del evento"),
    labelValue("Nombre del evento", titulo),
    labelValue("Fecha tentativa", fecha),
    labelValue("Área solicitante", area),
    labelValue("Usuario solicitante", resolveValue(event.usuarioSolicitante)),
    labelValue("Referente del evento", referente),
    labelValue("Requiere", requiere),
    labelValue("Público", publico),
    labelValue("Lugar", lugar),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("🎯", "Sentido estratégico del evento"),
    new Paragraph({
      children: [new TextRun({ text: resolveValue(event.descripcion), color: COLOR_PRINCIPAL })],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("🧑‍💼", "Funcionarios clave"),
    labelValue("Referente operativo", referente),
    labelValue("Programa", resolveValue((event as { programa?: string | null }).programa)),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("🧍‍♂️", "Participación del público"),
    new Paragraph({
      children: [
        new TextRun({
          text: `Público: ${publico}. ${POR_CONFIRMAR}`,
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("📸", "Imagen buscada sugerida"),
    new Paragraph({
      children: [
        new TextRun({
          text: resolveValue((event as { imagenBuscadaSugerida?: string | null }).imagenBuscadaSugerida),
          italics: true,
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "Definiciones aprobadas por área",
          bold: true,
          color: COLOR_PRINCIPAL,
          size: 24,
        }),
      ],
      spacing: { before: 400, after: 200 },
    }),
    ...buildDefinicionesAprobadas(byCategory),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("⏰", "Cronograma del evento"),
    buildCronogramaTable(cronogramaRows),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "BRIEF PRODUCCIÓN",
          bold: true,
          color: COLOR_PRINCIPAL,
          size: 24,
        }),
      ],
      spacing: { before: 400, after: 200 },
    }),
    buildBriefProduccionTable(approved),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "BRIEF PRODUCCIÓN - Producción tendrá en cuenta",
          bold: true,
          color: COLOR_PRINCIPAL,
          size: 20,
        }),
      ],
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Notas: Según definiciones aprobadas por área.",
          italics: true,
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "PEDIDO DE PIEZAS DE COMUNICACIÓN",
          bold: true,
          color: COLOR_PRINCIPAL,
          size: 24,
        }),
      ],
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "1. ¿Qué pieza se necesita? Por confirmar.",
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "2. ¿Para qué medio? Por confirmar.",
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "3. ¿Cuál es el mensaje clave? Por confirmar.",
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "4. ¿Hay restricciones de diseño? Por confirmar.",
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "5. ¿Plazo de entrega? Por confirmar.",
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
  ];

  return new Document({
    sections: [{ children }],
    title: `Brief - ${titulo}`,
    creator: "Sistema de Gestión de Eventos",
  });
}
