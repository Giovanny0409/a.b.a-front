## Why

Hoy nada prueba la app como la usa una persona: `npm test` solo corre pruebas unitarias de Karma, y un
cambio que rompe el flujo de compra → inventario (contrato del backend, formulario, store) solo se nota al
usarla a mano. D-05 de `docs/PENDIENTES.md` decidió que los cambios que tocan pantallas se prueben en la
app con Playwright antes del PR, y este change resuelve P-07: no hay ni la herramienta ni una primera suite.

## What Changes

- Se instala `@playwright/test` (solo Chromium) como dependencia de desarrollo del front, con los scripts
  `test:e2e` y `test:e2e:ui`.
- Nuevo `playwright.config.ts`: un solo worker, ventana de escritorio, y `webServer` que reutiliza
  `npm start` (front `:4200` + backend `:5028`) o lo arranca si no está corriendo. Sin login que
  sembrar: la app no tiene autenticación, salvo el ID de vendedor de Ventas.
- Las pruebas corren contra el backend normal y `aba.db`, que hasta la entrega solo tiene datos de prueba
  (D-06). Aislarlas en su propia base y puerto queda en P-08, antes de entregar.
- Nueva carpeta `e2e/` con su `README.md`, helpers en `e2e/support/` (nombres con prefijo `PW_` y marca
  de tiempo) y una suite piloto `e2e/compras-inventario/`: registrar una compra de bultos y una de
  productos varios de productos nuevos, y verificar el cuerpo que se manda, la respuesta del backend y lo
  que muestra Inventario.
- Nueva skill `qa-playwright` (`.claude/skills/qa-playwright/SKILL.md`): cuándo correr la QA, cómo elegir
  suites, cómo escribir la suite de un change, cómo clasificar cada falla y cómo dejar evidencia en
  `tasks.md`.
- `CLAUDE.md` y `openspec/config.yaml` agregan la tarea de QA con Playwright a las tareas de todo change
  que toque una pantalla.

## Capabilities

### New Capabilities
- `e2e-qa`: batería de pruebas de punta a punta con Playwright contra la app local, su forma de correrla y
  la suite piloto del flujo compra → inventario.

### Modified Capabilities
_(ninguna: el comportamiento de compras e inventario no cambia; la suite piloto prueba los requisitos que
ya existen en `purchases` e `inventory`)_

## Impact

- Front (`a.b.a-front`): `package.json` / `package-lock.json` (dependencia y scripts), nuevo
  `playwright.config.ts`, nueva carpeta `e2e/`, `.gitignore` (`test-results/`, `playwright-report/`,
  `playwright/.cache/`), nueva skill `.claude/skills/qa-playwright/`, `CLAUDE.md`, `openspec/config.yaml`,
  `docs/PENDIENTES.md`.
- Back (`a.b.a-back`): no se toca. La suite usa `POST /api/purchases` y `GET /api/inventory` tal como
  están.
- Datos: cada corrida deja en `aba.db` productos, proveedor y compras `PW_<marca>`, porque el backend no
  tiene endpoints de borrado. Se limpian con P-08.
- Rama: `dev-test-qa-playwright`, apilada sobre `dev-chore-forma-de-trabajo` (P-06).
