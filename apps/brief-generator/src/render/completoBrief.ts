import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
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
  getTecnicaStructured,
  matchCateringTipo,
  getCateringRestricciones,
  getCateringCantidad,
  hasEvidenciaMateriales,
  hasEvidenciaPedidosEspeciales,
  getComunicacionPiezas,
  CATEGORY_LABELS,
  type ApprovedProposal,
  type CategoryKey,
} from "../rules/index.js";

const POR_CONFIRMAR = "Por confirmar";
const NO_DEFINIDO = "No definido";

/** Color institucional del template BRIEF ESTRAT??GICO (verde azulado) */
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
          new TextRun({ text: "Sin definiciones a??n.", italics: true, color: COLOR_PRINCIPAL }),
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
                new TextRun({ text: "Din??mica", bold: true, color: COLOR_PRINCIPAL }),
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
  const pantallaStructured = getTecnicaStructured(approved, "pantallaLED");
  const pantallaRetractilStructured = getTecnicaStructured(approved, "pantallaRetractil");
  const proyectorStructured = getTecnicaStructured(approved, "proyector");
  const sonidoStructured = getTecnicaStructured(approved, "sonido");
  const microfonosStructured = getTecnicaStructured(approved, "microfonos");

  const tecnicaPantalla = pantallaStructured.found
    ? { found: true, detail: pantallaStructured.text }
    : matchTecnicaItem(approved, "pantallaLED");
  const tecnicaProyector = proyectorStructured.found
    ? { found: true, detail: proyectorStructured.text }
    : matchTecnicaItem(approved, "proyector");
  const tecnicaSonido = sonidoStructured.found
    ? { found: true, detail: sonidoStructured.text }
    : matchTecnicaItem(approved, "sonido");
  const microCount = getMicrofonosCount(approved);
  const tecnicaMicro = microfonosStructured.found
    ? { found: true, detail: microfonosStructured.text }
    : matchTecnicaItem(approved, "microfonos");

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
              children: [new TextRun({ text: "??tem", bold: true, color: COLOR_PRINCIPAL })],
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
              children: [new TextRun({ text: "T??cnica - Pantalla LED", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: tecnicaPantalla.found ? `S??. ${tecnicaPantalla.detail}` : NO_DEFINIDO,
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
              children: [new TextRun({ text: "T??cnica - Pantalla retr??ctil", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: pantallaRetractilStructured.found ? pantallaRetractilStructured.text : NO_DEFINIDO,
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
              children: [new TextRun({ text: "T??cnica - Proyector", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: tecnicaProyector.found ? `S??. ${tecnicaProyector.detail}` : NO_DEFINIDO,
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
              children: [new TextRun({ text: "T??cnica - Sonido", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: tecnicaSonido.found ? `S??. ${tecnicaSonido.detail}` : NO_DEFINIDO,
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
              children: [new TextRun({ text: "T??cnica - Micr??fonos", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: microfonosStructured.found ? tecnicaMicro.detail : (tecnicaMicro.found ? `S??. Cantidad: ${microCount}` : NO_DEFINIDO),
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
                  text: materiales ? "S?? (seg??n propuestas aprobadas)" : NO_DEFINIDO,
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
              children: [new TextRun({ text: "Artes gr??ficas", color: COLOR_PRINCIPAL })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: materiales ? "S?? (seg??n propuestas aprobadas)" : NO_DEFINIDO,
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
                  text: pedidosEsp ? "S?? (seg??n propuestas aprobadas)" : NO_DEFINIDO,
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

export function buildCompletoBriefDocument(input: BriefInput): Document {
  const normalized = normalizeInput(input);
  let approved = filterApproved(normalized.proposals);
  const event = normalized.event;
  const eventProduccion = event.datosProduccion && typeof event.datosProduccion === "object" && Object.keys(event.datosProduccion).length > 0
    ? event.datosProduccion as Record<string, unknown>
    : null;
  if (eventProduccion) {
    const synthetic: ApprovedProposal = {
      categoria: "PRODUCCION",
      status: "APPROVED",
      titulo: "",
      descripcion: "",
      impacto: "MEDIO",
      datosExtra: eventProduccion,
    };
    approved = [synthetic, ...approved];
  }
  const byCategory = groupByCategory(approved);
  const titulo = resolveValue(event.titulo, "Sin t??tulo");
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
    // Encabezado: BRIEF ESTRAT??GICO (blanco sobre fondo verde azulado)
    new Paragraph({
      children: [
        new TextRun({
          text: "BRIEF ESTRAT??GICO",
          bold: true,
          color: COLOR_BLANCO,
          size: 48,
        }),
      ],
      shading: { fill: COLOR_PRINCIPAL },
      alignment: "center" as const,
      spacing: { after: 200 },
    }),
    // T??tulo de la actividad
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

    sectionHeading("????", "Datos b??sicos del evento"),
    labelValue("Nombre del evento", titulo),
    labelValue("Fecha tentativa", fecha),
    labelValue("??rea solicitante", area),
    labelValue("Usuario solicitante", resolveValue(event.usuarioSolicitante)),
    labelValue("Referente del evento", referente),
    labelValue("Requiere", requiere),
    labelValue("P??blico", publico),
    labelValue("Lugar", lugar),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("????", "Sentido estrat??gico del evento"),
    new Paragraph({
      children: [new TextRun({ text: resolveValue(event.descripcion), color: COLOR_PRINCIPAL })],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("???????????", "Funcionarios clave"),
    labelValue("Referente operativo", referente),
    labelValue("Programa", resolveValue((event as { programa?: string | null }).programa)),
    labelValue("Funcionario(s)", resolveValue((event as { funcionario?: string | null }).funcionario)),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("?????????????", "Participaci??n del p??blico"),
    new Paragraph({
      children: [
        new TextRun({
          text: `P??blico: ${publico}. ${POR_CONFIRMAR}`,
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "Definiciones aprobadas por ??rea",
          bold: true,
          color: COLOR_PRINCIPAL,
          size: 24,
        }),
      ],
      spacing: { before: 400, after: 200 },
    }),
    ...buildDefinicionesAprobadas(byCategory),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    sectionHeading("???", "Cronograma del evento"),
    buildCronogramaTable(cronogramaRows),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "BRIEF PRODUCCI??N",
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
          text: "Producci??n incluye: T??cnica, Catering, listado de materiales, artes gr??ficas y pedidos especiales.",
          italics: true,
          color: COLOR_PRINCIPAL,
          size: 20,
        }),
      ],
      spacing: { after: 120 },
    }),
    buildBriefProduccionTable(approved),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "BRIEF PRODUCCI??N - Producci??n tendr?? en cuenta",
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
          text: "Notas: Seg??n definiciones aprobadas por ??rea.",
          italics: true,
          color: COLOR_PRINCIPAL,
        }),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    new Paragraph({
      children: [
        new TextRun({
          text: "PEDIDO DE PIEZAS DE COMUNICACI??N",
          bold: true,
          color: COLOR_PRINCIPAL,
          size: 24,
        }),
      ],
      spacing: { before: 400, after: 200 },
    }),
    ...(() => {
      const com = getComunicacionPiezas(approved);
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: `1. ??Qu?? pieza se necesita? ${com.pieza}.`,
              color: COLOR_PRINCIPAL,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `2. ??Para qu?? medio? ${com.medio}.`,
              color: COLOR_PRINCIPAL,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `3. ??Cu??l es el mensaje clave? ${com.mensajeClave}.`,
              color: COLOR_PRINCIPAL,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `4. ??Hay restricciones de dise??o? ${com.restriccionesDiseno}.`,
              color: COLOR_PRINCIPAL,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `5. ??Plazo de entrega? ${com.plazoEntrega}.`,
              color: COLOR_PRINCIPAL,
            }),
          ],
        }),
      ];
    })(),
  ];

  return new Document({
    sections: [{ children }],
    title: `Brief - ${titulo}`,
    creator: "Sistema de Gesti??n de Eventos",
  });
}
