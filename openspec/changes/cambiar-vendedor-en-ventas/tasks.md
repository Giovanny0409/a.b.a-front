## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, registrar el defecto como P-14 «En curso» con este change, en el mismo commit que los artefactos.

## 2. Reproducir primero

- [ ] 2.1 Crear `e2e/ventas/ventas.locators.ts` y `e2e/ventas/ventas.spec.ts` con los cinco escenarios de `specs/sales/spec.md`, preparando existencia por la API con el catálogo (D3).
- [ ] 2.2 Correr la suite antes de corregir y dejar aquí qué escenarios fallan (debe fallar «Cambiar de vendedor»).

## 3. Corrección

- [ ] 3.1 `SalesActions.clearSeller`, su caso en `sales.reducer.ts` y `SalesStore.changeSeller()` (D1).
- [ ] 3.2 Vendedor activo y «Cambiar vendedor» en la barra de `sales-page.component.ts` (D2), reutilizando `_badges.scss` y `_buttons.scss`.
- [ ] 3.3 Pruebas unitarias: `sales.reducer.spec.ts` (`clearSeller`), `sales.store.spec.ts` (`changeSeller`) y `sales-page.component.spec.ts` (muestra al vendedor y el botón cambia de vendedor).

## 4. QA y reglas

- [ ] 4.1 QA con `qa-playwright`: `npm run test:e2e` completo (`compras-inventario` y `ventas`) y evidencia aquí.
- [ ] 4.2 `CLAUDE.md` y `.claude/skills/qa-playwright/SKILL.md`: todo defecto reportado se reproduce primero con una prueba automática que falla. `features/sales/README.md` (UI/UX, Estado NgRx, Pruebas) y `e2e/README.md` (Alcance, Estructura).

## 5. Cierre

- [ ] 5.1 `npm test`, `npm run build`, `npx tsc -p e2e/tsconfig.json`, y revisar que no queden huérfanos.
- [ ] 5.2 `openspec validate cambiar-vendedor-en-ventas --strict`.
- [ ] 5.3 En `docs/PENDIENTES.md`, cerrar P-14 con su evidencia.
