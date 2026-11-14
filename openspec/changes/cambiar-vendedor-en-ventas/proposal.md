## Why

En Ventas, el primer vendedor que entra se queda activo toda la sesión (P-14, reportado por el usuario):
al salir y volver a Ventas no se vuelve a pedir el ID, la pantalla no dice quién está cobrando, y la única
forma de pasar de Aurelio a Ana es recargar el navegador, que además borra los tickets guardados. Si Ana
cobra, la venta queda a nombre de Aurelio. Ninguna prueba lo detectó: las unitarias prueban el guard
aislado y no había suite E2E de Ventas.

## What Changes

- Ventas muestra el vendedor activo («Vendedor: Aurelio») y un botón «Cambiar vendedor», que quita al
  vendedor activo y vuelve a pedir el ID con el mismo guard, sin recargar ni perder los tickets guardados.
- Nueva acción `[Sales] Clear Seller` y `SalesStore.changeSeller()`.
- Nueva suite E2E `e2e/ventas/`, escrita primero para que falle con el defecto: un ID desconocido no
  entra; cada vendedor cobra a su nombre; salir y volver conserva al vendedor; «Cambiar vendedor» permite
  pasar al otro y las ventas siguientes quedan a su nombre.
- Pruebas unitarias del reducer, la fachada y el componente para el cambio de vendedor.
- Regla nueva en `CLAUDE.md` y en la skill `qa-playwright`: todo defecto reportado se reproduce primero con
  una prueba automática que falla, y la corrección es lo que la hace pasar.

## Capabilities

### New Capabilities
_(ninguna)_

### Modified Capabilities
- `sales`: el vendedor activo se ve en la pantalla y se puede cambiar sin recargar.

## Impact

- Front (`a.b.a-front`): `features/sales/store/sales.actions.ts`, `sales.reducer.ts`, `sales.store.ts`,
  `sales-page.component.ts` y sus `*.spec.ts`; `features/sales/README.md`; nueva `e2e/ventas/`;
  `e2e/support/api.ts`; `e2e/README.md`; `.claude/skills/qa-playwright/SKILL.md`; `CLAUDE.md`;
  `docs/PENDIENTES.md`.
- Back: no se toca; `POST /api/sellers/authorize` y el vendedor de cada venta ya funcionan.
- Textos nuevos en la plantilla sin clave i18n, porque `ngx-translate` no está instalado (P-01).
- Rama: `dev-fix-cambiar-vendedor`, apilada sobre `dev-test-nombres-reales-e2e` (P-06).
