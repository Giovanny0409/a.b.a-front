## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, pasar P-07 a «En curso» con el nombre de este change, en el mismo commit que los artefactos (`proposal.md`, `design.md`, `specs/e2e-qa/spec.md`, `tasks.md`).

## 2. Instalación y configuración

- [ ] 2.1 Instalar `@playwright/test@^1.63.0` como dependencia de desarrollo y Chromium (`npx playwright install chromium`). Agregar a `package.json` los scripts `test:e2e` (`playwright test`) y `test:e2e:ui` (`playwright test --ui`). Verificar con `npx playwright --version`.
- [ ] 2.2 Crear `playwright.config.ts` en la raíz según D1 y D2: `testDir: './e2e'`, `workers: 1`, `fullyParallel: false`, `baseURL` y `webServer` en `http://127.0.0.1:4200` con `command: 'npm start'`, `reuseExistingServer: true` y `timeout: 180_000`, un proyecto `chromium` con `viewport` 1440×900 después del spread de `devices['Desktop Chrome']`, `trace: 'retain-on-failure'` y `reporter` `list` + `html` sin abrir.
- [ ] 2.3 Crear `e2e/tsconfig.json` según D3 y agregar a `.gitignore` `/test-results/`, `/playwright-report/` y `/playwright/.cache/`.
- [ ] 2.4 Verificar que `npm test` no carga nada de `e2e/` (el conteo de pruebas de Karma es el mismo que antes de este change) y que `npm run build` pasa (incluye `logs:check`).

## 3. Soporte y suite piloto

- [ ] 3.1 Crear `e2e/support/test-data.ts` con `marcaDeCorrida()` y `nombrePrueba(sufijo)` → `PW_<marca>_<sufijo>` (D4).
- [ ] 3.2 Crear `e2e/compras-inventario/compras-inventario.locators.ts` con los locators de Compras (campo «Proveedor», filas de línea, `select` de tipo, campos de cantidad, kg, costos y precios, «Agregar producto», «Guardar compra», `.notice`) y de Inventario (filtro por producto, fila por nombre, columnas «Bultos sellados» y «Piezas»).
- [ ] 3.3 Crear `e2e/compras-inventario/compras-inventario.spec.ts` con el escenario «Compra de bultos y varios de productos nuevos» de `specs/e2e-qa/spec.md`: proveedor `PW_<marca>_prov`, una línea «Bultos» de 3 bultos y una «Varios» de 5 piezas de productos `PW_<marca>_*`; verificar el cuerpo de `POST /api/purchases` (`waitForRequest` + `postDataJSON()`), la respuesta `200` (`waitForResponse`), el aviso de compra registrada, y en `/inventario` 3 bultos sellados y 5 piezas.
- [ ] 3.4 Correr `npm run test:e2e` dos veces seguidas, una con la app ya levantada y otra sin ella, y confirmar que pasa las dos (escenarios «La app ya está corriendo», «La app no está corriendo» y «Dos corridas seguidas»).

## 4. Skill y reglas del flujo

- [ ] 4.1 Crear `.claude/skills/qa-playwright/SKILL.md`: cuándo correrla (al terminar un change que toque `src/app/features/<pantalla>/`, antes del PR) y cuándo no aplica; cómo elegir suites; cómo escribir la suite de un change (tres capas, `PW_<marca>`, `mode: 'serial'` para flujos que cruzan pantallas, locators en `<suite>.locators.ts`); la tabla para clasificar fallas (defecto del change, prueba vieja, prueba frágil, defecto anterior → `docs/PENDIENTES.md`); nunca debilitar una aserción; cómo dejar evidencia en `tasks.md`; y las recetas que apliquen aquí (`window.prompt` de Ventas con `page.on('dialog')`, `datalist`, `select` nativo).
- [ ] 4.2 En `CLAUDE.md` (sección «Principios para OpenSpec») y en `openspec/config.yaml` (`rules.tasks`), agregar la tarea de QA con la skill `qa-playwright` para todo change que toque una pantalla, antes del PR, con su evidencia; y en `CLAUDE.md` mencionar `npm run test:e2e` junto a las compuertas.

## 5. Documentación

- [ ] 5.1 Crear `e2e/README.md` con las secciones del Principio 6 que apliquen: Descripción, Alcance, Estructura de archivos, Cómo correr (`npm run test:e2e`, `test:e2e:ui`, una sola carpeta), Datos de prueba (`PW_<marca>`, sin borrado, D-06 y P-08), Pruebas, Limitaciones (backend oculto que queda vivo, sin CI, solo Chromium) y Notas de mantenimiento (locators atados al texto hasta P-01).

## 6. Verificación y cierre

- [ ] 6.1 Revisar que no queden archivos, imports ni helpers sin uso en `e2e/` ni en la configuración (Principio 5), y correr `npx tsc -p e2e/tsconfig.json --noEmit`.
- [ ] 6.2 QA con la skill `qa-playwright` (su primera corrida): `npm run test:e2e` completo, y dejar aquí como evidencia las suites, el resultado (`N pasaron`), el ambiente (front `:4200`, backend `:5028`, `aba.db`) y la marca de los datos creados.
- [ ] 6.3 Correr `openspec validate agregar-qa-playwright --strict`.
- [ ] 6.4 En `docs/PENDIENTES.md`, cerrar P-07 con su evidencia (versión de Playwright, resultado de 6.2) y registrar lo que se haya encontrado fuera de alcance.
