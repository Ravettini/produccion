# Descripción del sistema de briefs institucionales

## Objetivo

El sistema genera **briefs** para eventos institucionales. Un brief es un documento de síntesis que resume cómo queda definido un evento después de que se aprobaron las propuestas de las distintas áreas (logística, catering, técnica, producción, agenda, etc.). Sirve como referencia única para coordinar la ejecución del evento.

## Por qué usar una plantilla

El brief debe generarse mediante una **plantilla** porque:

1. **Consistencia**: Todos los briefs deben seguir la misma estructura, sin importar el tipo de evento. Así cualquier persona puede leerlos y encontrar la información en el mismo lugar.
2. **Completitud**: La plantilla asegura que no se omitan secciones importantes (lugar, horarios, público, requerimientos técnicos, etc.).
3. **Tono institucional**: Una plantilla guía el estilo (formal, claro, neutro) y evita variaciones de redacción.
4. **Trazabilidad**: Facilita comparar eventos y auditar qué se definió en cada uno.
5. **Integración con procesos**: Si el brief se exporta a Word o se comparte, la estructura predecible facilita su uso en otros sistemas o por otras áreas.

---

## Datos de entrada disponibles

### Información del evento

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Título** | Nombre del evento | "Jornada de Gobierno Abierto 2025" |
| **Descripción** | Descripción general del evento | "Evento anual de transparencia y participación ciudadana." |
| **Requiere** | Checkboxes seleccionados: Producción, Institucionales, Cobertura (puede ser uno o varios, separados por coma) | "Producción, Institucionales, Cobertura" |
| **Área solicitante** | Área o dependencia que solicita el evento | "Subsecretaría de Gestión Pública" |
| **Usuario solicitante** | Nombre del usuario que creó el evento | "Juan Pérez" |
| **Público** | EXTERNO, INTERNO o MIXTO | "MIXTO" |
| **Fecha tentativa** | Fecha prevista | "2025-03-15" |
| **Estado** | BORRADOR, EN_ANALISIS, CONFIRMADO, CANCELADO | "CONFIRMADO" |

### Propuestas aprobadas

Cada propuesta tiene:

| Campo | Descripción |
|-------|-------------|
| **Categoría** | LOGISTICA, CATERING, TECNICA, AGENDA, PRODUCCION, OTRO |
| **Título** | Título de la propuesta |
| **Nombre del proyecto** | (opcional) Nombre del proyecto asociado |
| **Descripción** | Detalle de lo aprobado |
| **Impacto** | ALTO, MEDIO, BAJO |
| **Datos extra** | Campos según categoría (ej. horario de citación, lugar, cantidad de personas, equipamiento, restricciones alimentarias, etc.) |

**Categorías y datos extra por categoría:**

- **PRODUCCION**: Horario de citación, Lugar, Cantidad de personas, Equipamiento necesario
- **AGENDA**: Horario, Fecha específica, Duración estimada
- **LOGISTICA**: Lugar, Horario de montaje
- **CATERING**: Cantidad de personas, Restricciones alimentarias
- **TECNICA**: Equipamiento necesario, Requerimientos técnicos
- **OTRO**: Sin campos extra

---

## Estructura sugerida para la plantilla del brief

La plantilla debe tener secciones fijas. La IA debe completar cada sección con la información disponible, o indicar "No definido" / "Por confirmar" si no hay datos.

### Sección 1: Identificación del evento
- Título
- Fecha
- Área solicitante / Usuario solicitante
- Público (Externo / Interno / Mixto)

### Sección 2: Descripción general
- Resumen del evento según la descripción original
- Qué requiere el evento (según checkboxes: Producción, Institucionales, Cobertura)

### Sección 3: Definiciones aprobadas por área
- **Logística**: Lugar, horarios de montaje, etc.
- **Producción**: Horario de citación, equipamiento, cantidad de personas, etc.
- **Catering**: Cantidad de personas, restricciones alimentarias, etc.
- **Técnica**: Equipamiento, requerimientos técnicos, etc.
- **Agenda**: Horarios, duración, fecha específica, etc.
- **Otro**: Otras definiciones

Solo incluir las categorías que tengan propuestas aprobadas. Si una categoría no tiene propuestas, puede omitirse o indicarse "Sin definiciones aún".

### Sección 4: Resumen ejecutivo (opcional)
- Párrafo final que sintetice en 2–4 líneas cómo queda el evento listo para ejecutar.

---

## Restricciones y reglas

1. **Idioma**: Español.
2. **Tono**: Formal, institucional, claro.
3. **Solo información aprobada**: El brief solo debe incluir lo que figura en las propuestas con estado APPROVED. No inventar datos.
4. **Campos vacíos**: Si un dato no existe, usar "Por confirmar", "No definido" o similar, según el contexto.
5. **Orden**: Respetar la estructura de la plantilla. No mezclar secciones.
6. **Prosa vs. listas**: Se puede combinar párrafos breves con viñetas cuando sea más legible (ej. listado de equipamiento).

---

## Ejemplo de brief esperado (formato)

```
BRIEF — Jornada de Gobierno Abierto 2025

1. IDENTIFICACIÓN
   Título: Jornada de Gobierno Abierto 2025
   Fecha tentativa: 15 de marzo de 2025
   Área solicitante: Subsecretaría de Gestión Pública
   Usuario solicitante: Juan Pérez
   Público: Mixto

2. DESCRIPCIÓN
   Evento anual de transparencia y participación ciudadana. Requiere: Producción, Institucionales y Cobertura.

3. DEFINICIONES APROBADAS

   Logística
   - Lugar: Centro Cultural Kirchner (según propuesta aprobada)
   - Horario de montaje: 8:00 hs

   Catering
   - Cantidad de personas: 50
   - Restricciones: Incluir opciones veganas y sin TACC

   [Otras categorías según corresponda]

4. RESUMEN
   El evento se realizará el 15 de marzo en el CCK, con montaje a las 8:00 hs, coffee break para 50 personas con opciones veganas y sin TACC. Requiere producción, cobertura institucional y comunicacional.
```

---

## Cómo se define cada campo en el DOCX generado

El sistema genera un DOCX con formato **BRIEF ESTRATÉGICO**. Cada campo del documento sale de los datos del **evento** o de las **propuestas aprobadas** (APPROVED). Si falta un dato, se escribe "Por confirmar" o "No definido".

### Encabezado y título

| Campo en el DOCX | Origen |
|------------------|--------|
| **BRIEF ESTRATÉGICO** | Título fijo del template |
| **Título de la actividad** | `event.titulo` |

### Datos básicos del evento

| Campo en el DOCX | Origen |
|------------------|--------|
| Nombre del evento | `event.titulo` |
| Fecha tentativa | `event.fechaTentativa` → formateada (ej. "17 de octubre de 2025") |
| Área solicitante | `event.areaSolicitante` |
| Usuario solicitante | `event.usuarioSolicitante` |
| Referente del evento | `event.usuarioSolicitante`; si no hay, se busca en propuestas **OTRO** texto como "referente: …" en la descripción |
| Requiere | `event.tipoEvento` (Producción, Institucionales, Cobertura) partido por comas |
| Público | `event.publico` → "Externo" / "Interno" / "Mixto" |

### Sentido estratégico del evento

| Campo en el DOCX | Origen |
|------------------|--------|
| Párrafo de descripción | `event.descripcion` |

### Funcionarios clave

| Campo en el DOCX | Origen |
|------------------|--------|
| Referente operativo | Mismo que "Referente del evento" |
| Programa | Fijo: "Por confirmar" |

### Participación del público

| Campo en el DOCX | Origen |
|------------------|--------|
| Párrafo | `event.publico` + "Por confirmar" |

### Imagen buscada sugerida

| Campo en el DOCX | Origen |
|------------------|--------|
| Texto | Fijo: "Por confirmar" |

### Definiciones aprobadas por área

Cada **categoría** (Logística, Catering, Técnica, Agenda, Producción, Otro) que tenga al menos una propuesta **APPROVED** se lista. Para cada propuesta se escribe:

- **Texto**: `propuesta.titulo` + (opcional) `(Proyecto: propuesta.nombreProyecto)` + ": " + `propuesta.descripcion`

### Cronograma del evento

Tabla con columnas **Horario**, **Dinámica**, **Orador**:

| Columna | Origen |
|---------|--------|
| Horario | Propuestas **AGENDA** → `datosExtra.horario` o `datosExtra.fechaEspecifica` |
| Dinámica | Propuestas **AGENDA** → `titulo` + ": " + `descripcion` |
| Orador | Fijo: "Por confirmar" |

Si no hay propuestas AGENDA, una fila con "Por confirmar" en las tres columnas.

### BRIEF PRODUCCIÓN (tabla Ítem / Estado–Detalle)

Cada fila se rellena a partir de propuestas **TECNICA**, **CATERING** y **PRODUCCION** aprobadas:

| Ítem en el DOCX | Cómo se define |
|-----------------|----------------|
| Técnica - Pantalla LED | Busca en propuestas TECNICA si en descripción o `equipamiento`/`equipamientoNecesario`/`requerimientosTecnicos` aparece "pantalla led", "led", "pantalla". Si hay match → "Sí. [detalle]"; si no → "No definido" |
| Técnica - Proyector | Igual con "proyector", "proyección", "cañón" |
| Técnica - Sonido | Igual con "sonido", "audio", "parlantes", "amplificador" |
| Técnica - Micrófonos | Igual con "micrófono"; cantidad desde texto tipo "3 micrófonos" o "micrófonos: 3" |
| Catering - Tipo | Propuestas CATERING: en descripción/restricciones se buscan "desayuno", "almuerzo", "cena", "coffee break"/"break"/"refrigerio" → se listan los que apliquen |
| Catering - Cantidad | Propuestas CATERING → `datosExtra.cantidadPersonas`; si no, se intenta extraer número de la descripción (ej. "50 personas") |
| Catering - Restricciones | Propuestas CATERING → `datosExtra.restriccionesAlimentarias` concatenadas |
| Listado de materiales | Si en propuestas PRODUCCION/OTRO aparece "material", "arte", "gráfica", "pieza", "banner", "folleto" → "Sí (según propuestas aprobadas)"; si no → "No definido" |
| Artes gráficas | Misma lógica que Listado de materiales |
| Pedidos especiales | Si en propuestas aparece "pedido especial", "especial", "particular", "específico" → "Sí (según propuestas aprobadas)"; si no → "No definido" |

### PEDIDO DE PIEZAS DE COMUNICACIÓN

Las 5 preguntas (qué pieza, para qué medio, mensaje clave, restricciones de diseño, plazo) van todas con el texto fijo **"Por confirmar."** por ahora.

---

### Resumen: de dónde sale cada tipo de dato

- **Evento**: título, descripción, fecha, área solicitante, usuario solicitante, público, requiere (tipoEvento).
- **Propuestas aprobadas**:
  - **LOGISTICA**: lugar, horarioMontaje → usados en reglas (ej. lugar en prosa); en el DOCX aparecen en "Definiciones aprobadas" como título + descripción.
  - **CATERING**: cantidadPersonas, restriccionesAlimentarias → tabla BRIEF PRODUCCIÓN (tipo, cantidad, restricciones).
  - **TECNICA**: equipamiento, equipamientoNecesario, requerimientosTecnicos → tabla (pantalla LED, proyector, sonido, micrófonos) por coincidencia de palabras clave.
  - **AGENDA**: horario, fechaEspecifica, duracionEstimada → tabla Cronograma (horario, dinámica).
  - **PRODUCCION**: horarioCitacion, lugar, cantidadPersonas, equipamiento → "Definiciones aprobadas" y evidencia de materiales/pedidos especiales.
  - **OTRO**: solo en "Definiciones aprobadas" y para intentar extraer "referente" desde la descripción.

Los **datos extra** de cada propuesta se guardan en el campo `datosExtra` (JSON) según la categoría; los nombres de las claves están definidos en `proposalCategoryFields` en el frontend y en los schemas del `brief-generator`.

---

## Uso de esta descripción

Esta descripción puede pasarse a ChatGPT (u otro modelo) con la siguiente consigna:

**"Armame un prompt para una IA que genere briefs institucionales. La IA recibirá como entrada: 1) la información del evento (título, descripción, requiere, área, usuario, público, fecha) y 2) la lista de propuestas aprobadas con sus categorías, títulos, descripciones y datos extra. El prompt debe instruir a la IA para que genere un brief siguiendo la plantilla descrita, en español, con tono formal, y sin inventar información que no esté en los datos de entrada."**
