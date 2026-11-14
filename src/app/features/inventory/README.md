# Inventario

## Descripción

Pantalla de consulta (ruta `/inventario`) del inventario neto de cada producto: bultos sellados, kilos
abiertos y piezas, con su mínimo y si conviene comprar.

## Responsabilidades y alcance

- Listar cada producto con su categoría, existencia neta, bultos sellados, kg abiertos, piezas y mínimo.
- Marcar «Compra sugerida» o «Cubierto» según `needsRestock`, que calcula el backend.
- Filtrar por nombre de producto, sin importar mayúsculas ni espacios.
- No cubre: registrar compras (ver `features/purchases`) ni editar mínimos (hoy se capturan en el
  Tablero, P-17 y P-23).

## Estructura de archivos

```text
inventory/
├── inventory-page.component.ts
├── inventory.store.ts
├── README.md
└── store/
    ├── inventory.actions.ts
    ├── inventory.effects.ts
    ├── inventory.reducer.ts
    └── inventory.selectors.ts
```

## Componentes

- `InventoryPageComponent` (`aba-inventory-page`): filtro y tabla de inventario neto.
  `inventoryTotalLabel()` arma «3 bultos / 12.5 kg abiertos» o «Sin existencia».

## Modelos y contratos

`InventoryItem` (`core/pos.models.ts`): `product`, `sealedBags`, `openKg`, `quantityTotal` y
`needsRestock`.

## Estado NgRx

`InventoryState { inventory, lots, products, loading, error }`, expuesto por `InventoryStore` con signals
(`inventory()`, `lots()`, `products()`).

## Efectos y flujo de datos

- `load$`: inventario, lotes y productos. Si falla, `loadFailure` guarda el mensaje del backend o la clave
  `inventory.errors.load`.

## Servicios y endpoints

Vía `core/pos-api.service.ts`: `GET /api/inventory`, `GET /api/inventory/lots` y `GET /api/products`.

## Rutas e integración

Ruta `/inventario` (`app.routes.ts`); también se llega desde «Revisar inventario» del Tablero.

## Permisos y guards

Sin guard.

## UI/UX

Reutiliza `.panel`, `.field`, `.table-wrap` y `.badge` de `src/assets/layout/`. El filtro usa un
`datalist` con los nombres de producto.

## Internacionalización

Todos los textos salen de `es.json`, en `inventory.*` y `common.*`. `inventoryTotalLabel()` arma el texto
con `TranslateService.instant()` y las cantidades de `common.units.*` (los kilos con el formato `es-MX`);
el estado elige entre `inventory.status.restock` e `inventory.status.covered`.

## Manejo de errores y observabilidad

El error de carga queda en `InventoryState.error`, pero la pantalla todavía no lo muestra (P-16).

## Pruebas

- Unitarias (Vitest, `npm test`): `inventory-page.component.spec.ts` (filtro, inventario neto y textos del
  diccionario), `inventory.store.spec.ts` y `store/inventory.*.spec.ts`. Los textos se comparan con `t()`.
- E2E (Playwright, `npm run test:e2e`): `e2e/compras-inventario/` verifica en esta pantalla lo que registra
  una compra.

## Dependencias

NgRx (`@ngrx/store`, `@ngrx/effects`), `@ngx-translate/core`, `core/pos-api.service.ts`.

## Limitaciones y trabajo pendiente

- El mínimo es solo de bultos sellados y no coincide con los mínimos del Tablero (P-17).
- Sin orden, filtros por categoría o estado, valor del inventario ni ajustes por merma (P-23).
- `InventoryStore.productName` y `lots` no se usan (P-10).

## Notas de mantenimiento

Las claves se escriben completas en el código para que `npm run i18n:check` las encuentre.
