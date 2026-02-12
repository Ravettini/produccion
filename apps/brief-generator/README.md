# Generador de Briefs Institucionales

Módulo para generar documentos DOCX de "Brief Estratégico" a partir de datos estructurados (evento + propuestas aprobadas).

## Reglas de negocio

- **Solo APPROVED**: Solo se usa información de propuestas con `status === "APPROVED"`. Las propuestas REJECTED o PENDING se ignoran.
- **No inventar**: Si un dato no existe en el input o en propuestas aprobadas, se escribe "Por confirmar" o "No definido" según corresponda.
- **Idioma**: Español. Tono formal e institucional.

## Instalación

```bash
npm install
npm run build
```

## Uso del CLI

```bash
# Sintaxis
node cli/cli.js --in <input.json> --out <brief.docx>

# Ejemplo
npm run example
# o
npx tsx cli/cli.ts --in examples/input.sample.json --out examples/brief.sample.docx
```

## Formato del input (JSON)

```json
{
  "event": {
    "titulo": "string",
    "descripcion": "string",
    "requiere": ["Producción", "Institucionales", ...],
    "areaSolicitante": "string",
    "usuarioSolicitante": "string | null",
    "publico": "EXTERNO" | "INTERNO" | "MIXTO",
    "fechaTentativa": "YYYY-MM-DD" | null,
    "estado": "string"
  },
  "proposals": [
    {
      "status": "APPROVED" | "REJECTED" | "PENDING",
      "categoria": "LOGISTICA" | "CATERING" | "TECNICA" | "AGENDA" | "PRODUCCION" | "OTRO",
      "titulo": "string",
      "nombreProyecto": "string | null",
      "descripcion": "string",
      "impacto": "ALTO" | "MEDIO" | "BAJO",
      "datosExtra": {}
    }
  ]
}
```

### datosExtra por categoría

- **PRODUCCION**: `horarioCitacion`, `lugar`, `cantidadPersonas`, `equipamientoNecesario`
- **AGENDA**: `horario`, `fechaEspecifica`, `duracionEstimada`
- **LOGISTICA**: `lugar`, `horarioMontaje`
- **CATERING**: `cantidadPersonas`, `restriccionesAlimentarias`
- **TECNICA**: `equipamientoNecesario`, `requerimientosTecnicos`
- **OTRO**: objeto libre

## Uso programático

```typescript
import { generateBriefDocx } from "brief-generator";

const buffer = await generateBriefDocx({
  event: { ... },
  proposals: [ ... ],
});

// buffer es un Buffer de Node.js con el DOCX
fs.writeFileSync("brief.docx", buffer);
```

## Scripts

| Script   | Descripción                    |
|----------|--------------------------------|
| `npm run build`  | Compila TypeScript a `dist/`   |
| `npm run test`   | Ejecuta tests con Vitest       |
| `npm run cli`    | Ejecuta el CLI (con tsx)       |
| `npm run example`| Genera `examples/brief.sample.docx` |

## Estructura del documento generado

Formato BRIEF ESTRATÉGICO (con colores institucionales):

1. **Encabezado**: "BRIEF ESTRATÉGICO" en blanco sobre fondo verde azulado (#153244)
2. **Título de la actividad** centrado, color institucional
3. **Secciones** con emojis y color: Datos básicos, Sentido estratégico, Funcionarios clave, Participación del público, Imagen buscada, Definiciones aprobadas, Cronograma, BRIEF PRODUCCIÓN, Pedido de piezas de comunicación
4. **Tablas** con encabezados en gris claro (E8EEF2)
