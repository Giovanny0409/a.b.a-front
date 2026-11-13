## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, pasar P-07 a «En curso» con el nombre de este change, en el mismo commit que los artefactos (`proposal.md`, `design.md`, `specs/e2e-qa/spec.md`, `tasks.md`).

## 2. Instalación y configuración

- [x] 2.1 Instalar `@playwright/test@^1.63.0` como dependencia de desarrollo y Chromium (`npx playwright install chromium`). Agregar a `package.json` los scripts `test:e2e` (`playwright test`) y `test:e2e:ui` (`playwright test --ui`). Verificar con `npx playwright --version`. Instalada la 1.65.0 (cumple `^1.63.0`; `package.json` quedó en `^1.65.0`).
- [x] 2.2 Crear `playwright.config.ts` en la raíz según D1 y D2: `testDir: './e2e'`, `workers: 1`, `fullyParallel: false`, `baseURL` y `webServer` en `http://127.0.0.1:4200` con `command: 'npm start'`, `reuseExistingServer: true` y `timeout: 180_000`, un proyecto `chromium` con `viewport` 1440×900 después del spread de `devices['Desktop Chrome']`, `trace: 'retain-on-failure'` y `reporter` `list` + `html` sin abrir.
- [x] 2.3 Crear `e2e/tsconfig.json` según D3 y agregar a `.gitignore` `/test-results/`, `/playwright-report/` y `/playwright/.cache/`. El `tsconfig.json` raíz fija `rootDir: ./src`, así que el de `e2e/` lo cambia a `..`.
- [x] 2.4 Verificar que `npm test` no carga nada de `e2e/` (el conteo de pruebas de Karma es el mismo que antes de este change) y que `npm run build` pasa (incluye `logs:check`). Antes y después del change `npm test` falla igual, con `TS18003: No inputs were found` en `tsconfig.spec.json` (`src/**/*.spec.ts`): el repo no tiene ninguna prueba unitaria. Es anterior al change y quedó como P-09. Karma no toma nada de `e2e/`. `npm run build` pasa.

## 3. Soporte y suite piloto

- [x] 3.1 Crear `e2e/support/test-data.ts` con `marcaDeCorrida()` y `nombrePrueba(marca, sufijo)` → `PW_<marca>_<sufijo>` (D4). Recibe la marca para que todos los nombres de una prueba compartan la misma.
- [x] 3.2 Crear `e2e/compras-inventario/compras-inventario.locators.ts` con los locators de Compras (campo «Proveedor», filas de línea, `select` de tipo, campos de cantidad, kg, costos y precios, botón «Producto» para agregar línea, «Guardar compra», `.notice`) y de Inventario (filtro por producto, fila por nombre, columnas «Bultos sellados» y «Piezas»).
- [x] 3.3 Crear `e2e/compras-inventario/compras-inventario.spec.ts` con el escenario «Compra de bultos y varios de productos nuevos» de `specs/e2e-qa/spec.md`: proveedor `PW_<marca>_prov`, una línea «Bultos» de 3 bultos y una «Varios» de 5 piezas de productos `PW_<marca>_*`; verificar el cuerpo de `POST /api/purchases` (`waitForRequest` + `postDataJSON()`), la respuesta `200` (`waitForResponse`), el aviso de compra registrada, y en `/inventario` 3 bultos sellados y 5 piezas. La primera corrida falló por la prueba, no por el producto: el nombre accesible del botón empieza con el glifo de PrimeIcons y `exact: true` no lo encontraba; se usa `/Producto$/` y quedó como receta en la skill.
- [x] 3.4 Correr `npm run test:e2e` dos veces seguidas, una con la app ya levantada y otra sin ella, y confirmar que pasa las dos (escenarios «La app ya está corriendo», «La app no está corriendo» y «Dos corridas seguidas»). Con la app arriba: 1 pasó (2.1 s). Con los puertos `:4200` y `:5028` libres: Playwright levantó `npm start` y pasó 1 (17.2 s); al terminar cerró front y backend (los dos puertos quedaron libres), así que D1 se corrigió: el backend no queda vivo.

## 4. Skill y reglas del flujo

- [x] 4.1 Crear `.claude/skills/qa-playwright/SKILL.md`: cuándo correrla (al terminar un change que toque `src/app/features/<pantalla>/`, antes del PR) y cuándo no aplica; cómo elegir suites; cómo escribir la suite de un change (tres capas, `PW_<marca>`, `mode: 'serial'` para flujos que cruzan pantallas, locators en `<suite>.locators.ts`); la tabla para clasificar fallas (defecto del change, prueba vieja, prueba frágil, defecto anterior → `docs/PENDIENTES.md`); nunca debilitar una aserción; cómo dejar evidencia en `tasks.md`; y las recetas que apliquen aquí (`window.prompt` de Ventas con `page.on('dialog')`, `datalist`, `select` nativo).
- [x] 4.2 En `CLAUDE.md` (sección «Principios para OpenSpec») y en `openspec/config.yaml` (`rules.tasks`), agregar la tarea de QA con la skill `qa-playwright` para todo change que toque una pantalla, antes del PR, con su evidencia; y en `CLAUDE.md` mencionar `npm run test:e2e` junto a las compuertas. También se agregó Playwright al stack de `CLAUDE.md`.

## 5. Documentación

- [x] 5.1 Crear `e2e/README.md` con las secciones del Principio 6 que apliquen: Descripción, Alcance, Estructura de archivos, Cómo correr (`npm run test:e2e`, `test:e2e:ui`, una sola carpeta), Datos de prueba (`PW_<marca>`, sin borrado, D-06 y P-08), Pruebas, Limitaciones (sin CI, solo Chromium, base compartida) y Notas de mantenimiento (locators atados al texto hasta P-01). El backend no queda vivo (ver 3.4), así que esa limitación no aplica.

## 6. Verificación y cierre

- [x] 6.1 Revisar que no queden archivos, imports ni helpers sin uso en `e2e/` ni en la configuración (Principio 5), y correr `npx tsc -p e2e/tsconfig.json --noEmit`. Sin huérfanos; `tsc` pasa sin errores.
- [x] 6.2 QA con la skill `qa-playwright` (su primera corrida): `npm run test:e2e` completo, y dejar aquí como evidencia las suites, el resultado (`N pasaron`), el ambiente (front `:4200`, backend `:5028`, `aba.db`) y la marca de los datos creados. Evidencia (2026-11-12): suite `compras-inventario`, 1 pasó · 0 fallaron (15.3 s, app levantada por Playwright), front `:4200` de `dev-test-qa-playwright` contra backend `:5028` y `aba.db`, datos `PW_mwebed8h_*` (más los de las corridas de 3.3 y 3.4).
- [x] 6.3 Correr `openspec validate agregar-qa-playwright --strict`.
- [x] 6.4 En `docs/PENDIENTES.md`, cerrar P-07 con su evidencia (versión de Playwright, resultado de 6.2) y registrar lo que se haya encontrado fuera de alcance. Se registró P-09 (sin pruebas unitarias; `npm test` falla).
