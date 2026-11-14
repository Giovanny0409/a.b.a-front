## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, registrar el defecto como P-14 «En curso» con este change, en el mismo commit que los artefactos.

## 2. Reproducir primero

- [x] 2.1 Crear `e2e/ventas/ventas.locators.ts` y `e2e/ventas/ventas.spec.ts` con los cinco escenarios de `specs/sales/spec.md`, preparando existencia por la API con el catálogo (D3).
- [x] 2.2 Correr la suite antes de corregir y dejar aquí qué escenarios fallan (debe fallar «Cambiar de vendedor»). Antes de corregir: «un ID desconocido no entra» pasó (ya funcionaba); fallaron los otros 4: no existe `.sales-toolbar .badge` con el vendedor y no existe el botón «Cambiar vendedor». La primera corrida falló también en «ID desconocido» por la prueba (empieza en el tablero y no esperaba el aviso); se corrigió con `expect.poll`.

## 3. Corrección

- [x] 3.1 `SalesActions.clearSeller`, su caso en `sales.reducer.ts` y `SalesStore.changeSeller()` (D1).
- [x] 3.2 Vendedor activo y «Cambiar vendedor» en la barra de `sales-page.component.ts` (D2), reutilizando `_badges.scss` y `_buttons.scss`. `.sales-toolbar` solo sumó `align-items` y `gap`; el vendedor usa `.badge.ok`. `onSameUrlNavigation: 'reload'` sí vuelve a correr el `canMatch` (lo comprueban «Cambiar de vendedor» y «Cancelar el cambio»). Los textos nuevos quedan sin i18n por P-01.
- [x] 3.3 Pruebas unitarias: `sales.reducer.spec.ts` (`clearSeller`), `sales.store.spec.ts` (`changeSeller`) y `sales-page.component.spec.ts` (muestra al vendedor y el botón cambia de vendedor). `npm test`: 25 archivos, 144 pruebas (4 nuevas).

## 4. QA y reglas

- [x] 4.1 QA con `qa-playwright`: `npm run test:e2e` completo (`compras-inventario` y `ventas`) y evidencia aquí. `npm run test:e2e`: 6 pasan, 0 fallan, 0 inestables (34 s): `compras-inventario` y los 5 de `ventas`, front `:4200` y backend `:5028` arrancados por Playwright, contra `aba.db`, con Alimento pollo de engorda Malta Cleyton 40 kg.
- [x] 4.2 `CLAUDE.md` y `.claude/skills/qa-playwright/SKILL.md`: todo defecto reportado se reproduce primero con una prueba automática que falla. `features/sales/README.md` (UI/UX, Estado NgRx, Pruebas) y `e2e/README.md` (Alcance, Estructura). También en `openspec/config.yaml` (`rules.tasks`).

## 5. Cierre

- [x] 5.1 `npm test`, `npm run build`, `npx tsc -p e2e/tsconfig.json`, y revisar que no queden huérfanos. `npm run build` pasa; `tsc` de `e2e/` sin errores; sin imports ni locators sin uso.
- [x] 5.2 `openspec validate cambiar-vendedor-en-ventas --strict`.
- [x] 5.3 En `docs/PENDIENTES.md`, cerrar P-14 con su evidencia. Se registraron P-15 (Gastos, Historial y Tablero sin E2E) y DT-01 (`*ngIf`/`*ngFor` deprecados).
