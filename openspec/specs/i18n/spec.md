# i18n Specification

## Purpose

Cubre de dónde salen los textos visibles de la app: el diccionario único en español `src/assets/i18n/es.json`, su ortografía, el formato regional `es-MX` de importes, números y fechas, la revisión automática de claves faltantes o huérfanas, y cómo las pruebas comparan contra el diccionario.
## Requirements
### Requirement: Textos visibles desde es.json
La app SHALL tomar todo texto visible para la persona de una clave de `src/assets/i18n/es.json`, que es
el único diccionario de la app: menú, barra superior, títulos, etiquetas, encabezados de tabla, botones,
marcadores de posición, estados, avisos y los diálogos `prompt`/`alert`/`confirm`. Las plantillas y el
código SHALL usar la clave, nunca el literal. Los mensajes que manda el backend SHALL mostrarse tal cual
llegan. Los textos SHALL verse desde la primera pantalla, sin mostrar la clave mientras cargan.

#### Scenario: Las pantallas muestran sus textos
- **WHEN** la persona abre Tablero, Ventas, Compras, Inventario e Historial
- **THEN** cada pantalla muestra sus títulos, botones y encabezados en español, como los define `es.json`, y en ninguna aparece una clave (por ejemplo `dashboard.title`)

#### Scenario: Diálogos del vendedor
- **WHEN** la persona entra a Ventas sin vendedor activo y escribe un ID desconocido
- **THEN** el sistema pide el ID y avisa el rechazo con los textos de `es.json`

#### Scenario: Mensaje del backend
- **WHEN** el backend rechaza una venta con un mensaje propio
- **THEN** Ventas muestra ese mensaje tal como llegó del backend

### Requirement: Ortografía correcta
Los textos de `es.json` SHALL escribirse con la ortografía del español: acentos («Trabajo rápido»,
«Inversión», «Categoría», «Total día», «Mínimo») y signos de apertura en preguntas («¿Requiere ticket?»).

#### Scenario: Textos corregidos en la app
- **WHEN** la persona abre el Tablero, Compras e Inventario
- **THEN** ve «Trabajo rápido», «Inversión», «Categoría», «Total día» y «Mínimo» con acento

#### Scenario: Pregunta al cobrar
- **WHEN** se finaliza una venta
- **THEN** el sistema pregunta «Venta finalizada. ¿Requiere ticket?»

### Requirement: Formato regional es-MX
Los importes, números y fechas SHALL mostrarse con el formato regional `es-MX`. Los importes en pesos
SHALL verse con el símbolo «$» y no con «MX$».

#### Scenario: Importes en pesos
- **WHEN** la persona abre el Tablero y el Historial
- **THEN** los importes se ven con «$» y separador de miles (por ejemplo «$1,250.00»), y en ninguna parte aparece «MX$»

### Requirement: Diccionario sin claves faltantes ni huérfanas
El proyecto SHALL tener `npm run i18n:check`, que corre antes de `npm run build` y de `npm test` y falla
cuando una clave usada en `src/app` no existe en `es.json`, o cuando una clave de `es.json` no se usa en
ninguna parte de `src/app`.

#### Scenario: Clave faltante
- **WHEN** una plantilla usa una clave que no está en `es.json`
- **THEN** `npm run i18n:check` falla y nombra la clave y el archivo

#### Scenario: Clave huérfana
- **WHEN** `es.json` tiene una clave que ningún archivo de `src/app` usa
- **THEN** `npm run i18n:check` falla y nombra la clave

#### Scenario: Diccionario al día
- **WHEN** todas las claves usadas existen y todas las de `es.json` se usan
- **THEN** `npm run i18n:check` termina sin error y `npm run build` continúa

### Requirement: Pruebas con los textos del diccionario
Las pruebas unitarias y E2E que comprueban un texto SHALL tomarlo de `es.json` en lugar de repetir el
literal, para que cambiar una redacción solo toque el diccionario.

#### Scenario: Cambiar una redacción
- **WHEN** se cambia en `es.json` el texto de un botón que una prueba E2E usa para encontrarlo
- **THEN** la prueba sigue encontrando el botón sin editar su archivo de locators
