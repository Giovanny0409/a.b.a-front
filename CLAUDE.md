# Guía y Principios de Desarrollo — ABA Punto de Venta

> **Este archivo es la fuente única de verdad para el flujo de trabajo y los principios de desarrollo del proyecto.**
> Claude debe **leer y aplicar este documento ANTES de**:
> - Realizar cualquier cambio en el código.
> - Generar o modificar artefactos de OpenSpec (`proposal.md`, `design.md`, `tasks.md`, `spec.md`).
>
> Si un cambio contradice algún principio de aquí, primero avísalo y propón cómo alinearlo.

---

## Contexto del proyecto

- Sistema de punto de venta para **Alimentos Balanceados Alonso** (forrajería): ventas, compras, inventario, tablero y gastos.
- Este repositorio (`aba-punto-venta`) es el **frontend**. El backend vive por separado en
  `C:\Users\carte\OneDrive\Desktop\backend aba` (ASP.NET Core 9 + EF Core + SQLite), corriendo en
  `http://localhost:5028`. Ambos se arrancan juntos con `npm start` (`scripts/start-with-backend.ps1`).
- Cambios que requieran datos o endpoints nuevos casi siempre implican tocar **ambos** repos: valida el contrato
  (forma del JSON, nombres de propiedades) contra los controladores y modelos reales del backend, no solo contra
  lo que el frontend espera.

## Stack del proyecto

- **Angular 21** con **componentes standalone** (patrón `standalone-architecture`, sin `NgModule` por feature).
- **NgRx** (store por feature: `actions`, `effects`, `reducer`, `selectors`).
- **PrimeNG** para UI.
- **ngx-translate** para internacionalización — **solo español** (ver Principio 1).
- **OpenSpec** (`schema: spec-driven`) para gestionar cambios en `openspec/`.
- Pruebas de componentes con specs (`*.spec.ts`).

---

## Flujo de trabajo Git

### Nomenclatura de ramas

- Formato: `dev-<tipo>-<descripcion-en-kebab-case>`
- `<tipo>`: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `style`.
- Ejemplos:
  - `dev-feat-alerta-stock-bajo`
  - `dev-refactor-limpieza-compras`
  - `dev-fix-formato-kilos-abiertos`

**IMPORTANTE — Comportamiento de Claude:**
- **NO crear ramas automáticamente.**
- Solo **generar en el chat el nombre de la rama** para que el usuario lo copie y pegue.

### Mensajes de commit (formato commitlint / Conventional Commits)

- Formato: `tipo(scope): descripción en minúscula`
- `tipo`: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `style`, `build`, `ci`.
- `scope`: área o feature afectada (ej. `ventas`, `compras`, `inventario`, `tablero`, `gastos`, `notificaciones`, `codigo-barras`).
- Ejemplos:
  - `feat(notificaciones): enviar alerta al encargado cuando el stock llega al minimo`
  - `refactor(compras): eliminar kilos reales y costo real huerfanos`
  - `chore(inventario): limpiar codigo muerto de la tabla de inventario neto`

**IMPORTANTE — Comportamiento de Claude:**
- **NO hacer commits automáticamente.**
- Solo **generar en el chat el mensaje de commit** para que el usuario lo copie y pegue.
- Siempre deben de ir en **inglés**.

### Formato de Pull Request

- **Título**: mismo formato que el commit — `tipo(scope): descripción en minúscula`.
  - Ejemplo: `feat(inventario): umbral minimo editable desde compras e inventario`
- **Descripción**, en español, con las siguientes secciones (usar las que apliquen, en este orden):
  1. `## Resumen` — 1-2 frases explicando qué resuelve el cambio y, si aplica, con qué endpoint/objeto de API interactúa.
  2. `## Cambios` — lista con viñetas; cada viñeta inicia con una **etiqueta corta en negrita** (área o capa afectada) seguida de `:` y la descripción.
  3. `## Pruebas` — comandos ejecutados (build, lint, tests) y su resultado; QA manual realizado (dispositivo/navegador, escenarios cubiertos).
  4. `## Nota / deuda` — *(opcional)* caveats, deuda técnica conocida o seguimientos pendientes antes de producción. Omitir la sección si no aplica.

**IMPORTANTE — Comportamiento de Claude:**
- **NO crear el PR automáticamente** (ni con `gh pr create` ni de otra forma) salvo que el usuario lo pida explícitamente.
- Solo **generar en el chat el título y la descripción** para que el usuario los copie y pegue.

---

## Principios de desarrollo (obligatorios)

### 1. Sin textos hardcodeados → siempre i18n
- Todo texto visible al usuario se agrega en el diccionario `src/assets/i18n/es.json` (**único idioma: español**,
  no existe `en.json` ni se planea agregar).
- En plantillas/código se usa la clave de traducción (`| translate` / `TranslateService`), nunca el literal.
- **Esta regla aplica de forma retroactiva**: todo el texto que hoy está embebido directo en los templates
  (la mayoría del código existente) debe migrarse a `es.json` a medida que se toca cada componente, y todo
  componente nuevo se escribe usando claves desde el inicio. No es opcional para código nuevo ni para código
  legado que se esté modificando.

### 2. Principios SOLID
- Aplicar SOLID siempre:
  - **S**: responsabilidad única por componente/servicio/clase.
  - **O**: extender sin modificar lo existente cuando sea posible.
  - **L**: sustitución sin romper contratos.
  - **I**: interfaces pequeñas y específicas.
  - **D**: depender de abstracciones (inyección de dependencias de Angular).

### 3. Estructura de código estandarizada y coherente
- Al **crear o actualizar** cualquier componente, mantener la misma estructura que los componentes existentes para conservar estandarización y coherencia.
- Estructura de referencia de un feature (ver `src/app/features/inventory/` o `src/app/features/sales/` como ejemplo real en este repo):
  ```text
  <feature>/
  ├── <feature>-page.component.ts   (standalone, incluye template/estilos inline salvo que crezcan demasiado)
  ├── <feature>.store.ts            (fachada de NgRx para el componente)
  ├── README.md
  └── store/{<feature>.actions,<feature>.effects,<feature>.reducer,<feature>.selectors}.ts
  ```
- Convenciones: componentes standalone, view-model en camelCase, contrato de API (cable) en snake_case cuando aplique (el backend en .NET serializa en camelCase, validar contra los `record` reales antes de asumir el shape).
- Modelos y servicios compartidos por todos los features viven en `src/app/core/` (`pos.models.ts`, `pos-api.service.ts`); no dupliques ahí un modelo o llamada que ya exista.

### 4. Reutilizar estilos estandarizados
- Usar los estilos ya definidos en `src/assets/layout/` (`_base`, `_buttons`, `_forms`, `_cards`, `_tables`, `_badges`, `_primeng`, `_variables`).
- **No crear estilos nuevos si ya existen** equivalentes en `src/assets/layout/`.
- Solo agregar estilos nuevos cuando no exista uno reutilizable; hacerlo de forma coherente con las variables existentes en `_variables.scss`.

### 5. Sin código basura ni elementos huérfanos
- No dejar código muerto, imports sin usar, comentarios de scaffolding ni logs de depuración.
- No dejar componentes, métodos, servicios, actions/effects/selectors ni claves i18n huérfanas (sin uso).
- Al eliminar una funcionalidad, limpiar todas sus referencias — **incluyendo el backend** cuando el campo o endpoint ya no se use desde el frontend (por ejemplo, campos que el frontend dejó de usar pero siguen vivos en los `record` de `backend aba`).

### 6. Documentación `.md` por componente
- En cada **creación o cambio** de un componente, **crear o actualizar** su `README.md`.
- Este repo aún no tiene ningún `README.md` de feature — al crear el primero, usar las secciones estándar de abajo como plantilla de referencia para los siguientes.
- Secciones estándar del README (usar las que apliquen, en este orden):
  1. `# <Nombre del feature>`
  2. `## Descripción`
  3. `## Responsabilidades y alcance`
  4. `## Estructura de archivos`
  5. `## Componentes`
  6. `## Modelos y contratos`
  7. `## Estado NgRx`
  8. `## Efectos y flujo de datos`
  9. `## Servicios y endpoints`
  10. `## Rutas e integración`
  11. `## Permisos y guards`
  12. `## UI/UX`
  13. `## Internacionalización`
  14. `## Manejo de errores y observabilidad`
  15. `## Pruebas`
  16. `## Dependencias`
  17. `## Limitaciones y trabajo pendiente`
  18. `## Notas de mantenimiento`

---

## Principios para OpenSpec

Al generar o actualizar artefactos en `openspec/changes/<id>/` (`proposal.md`, `design.md`, `tasks.md`, `spec.md`):

- **Alinear las tareas con los 6 principios de arriba.** En particular, las `tasks.md` deben incluir explícitamente (cuando apliquen):
  - Agregar/actualizar claves i18n en `src/assets/i18n/es.json` (Principio 1) — recordar que es el único diccionario, no hay `en.json`.
  - Respetar la estructura estándar del feature y NgRx (Principios 2 y 3).
  - Reutilizar estilos de `src/assets/layout/` (Principio 4).
  - Verificar que no queden elementos huérfanos ni `NgModule` residual, tanto en el frontend como en `backend aba` cuando aplique (Principio 5).
  - Crear/actualizar el `README.md` del feature con el formato estándar (Principio 6).
  - Crear/actualizar el `*.spec.ts` correspondiente.
- Reutilizar servicios/catálogos existentes en lugar de duplicarlos.
- Confirmar rutas, permisos (`Permits`), menú y guards afectados.
- Cuando el cambio requiera datos o comportamiento nuevo del lado del servidor, dejar explícito en `design.md` qué controlador/`record` de `backend aba` se toca o se crea.
- Mantener el estilo y granularidad de tareas de los cambios ya archivados en `openspec/changes/archive/` como referencia (a medida que existan).

---

## Recordatorio de comportamiento de Claude

- Antes de cualquier cambio o de generar tareas OpenSpec: **consultar este archivo**.
- Ramas, commits y Pull Requests: **solo generar el texto para copiar/pegar**, nunca ejecutarlos.
