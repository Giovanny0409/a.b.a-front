# Tablero

## Descripción

Pantalla de inicio (ruta `/tablero`) con el resumen del negocio: existencia en bultos, gastos registrados,
corte de caja del día por turno, resumen de la semana en curso, accesos rápidos y los niveles de
importancia (mínimos) de cada producto.

## Responsabilidades y alcance

- Mostrar bultos totales, sellados y abiertos, y el total de gastos registrados.
- Cortar la caja de hoy en «Mañana» (antes de las 14:00), «Tarde» y «Total día», con ventas, total,
  gastos y ganancia.
- Resumir la semana de lunes a domingo: ingreso, ganancia neta, gastos y número de ventas.
- Ofrecer accesos a Ventas, Compras e Inventario.
- Capturar mínimos por producto (bultos y kg abiertos, o piezas) y marcar cada producto «Cubierto» o
  «Revisar».
- No cubre: registrar ventas, compras ni gastos (ver `features/sales` y `features/purchases`).

## Estructura de archivos

```text
dashboard/
├── dashboard-page.component.ts
├── dashboard.store.ts
├── README.md
└── store/
    ├── dashboard.actions.ts
    ├── dashboard.effects.ts
    ├── dashboard.reducer.ts
    └── dashboard.selectors.ts
```

## Componentes

- `DashboardPageComponent` (`aba-dashboard-page`): métricas, corte de caja, semana actual, trabajo rápido
  y niveles de importancia. Calcula el corte y la semana a partir de las ventas y gastos del store.

## Modelos y contratos

Usa `InventoryItem`, `SaleRecord`, `ExpenseRecord`, `BagLot`, `PurchaseRecord` y `DashboardSummary` de
`core/pos.models.ts`. `ProductImportance` (`store/dashboard.actions.ts`) guarda los mínimos de un producto
(`minBags`, `minOpenKg`, `minPieces`). El estado de cada producto es un código, `'covered' | 'review'`, que
la plantilla traduce.

## Estado NgRx

`DashboardState { inventory, lots, purchases, sales, expenses, importance, loading, error }`, expuesto por
`DashboardStore` con signals (`inventory()`, `sales()`, `expenses()`, `importance()`, `summary()`…).
`selectDashboardSummary` calcula las métricas de arriba.

## Efectos y flujo de datos

- `load$`: `forkJoin` de inventario, lotes, compras, ventas y gastos (si los gastos fallan, se toman
  vacíos). Si falla, `loadFailure` guarda el mensaje del backend o la clave `dashboard.errors.load`.
- `setImportance` solo cambia el estado en memoria (no hay efecto ni endpoint).

## Servicios y endpoints

Vía `core/pos-api.service.ts`: `GET /api/inventory`, `GET /api/inventory/lots`, `GET /api/purchases`,
`GET /api/sales` y `GET /api/expenses`.

## Rutas e integración

Ruta `/tablero` (`app.routes.ts`), también la ruta por omisión y el destino del guard de Ventas cuando
se rechaza o se cancela el ID de vendedor.

## Permisos y guards

Sin guard.

## UI/UX

Reutiliza `.metric`, `.panel`, `.table-wrap`, `.btn` y `.badge` de `src/assets/layout/`. Los importes
salen con el formato `es-MX` («$1,250.00»).

## Internacionalización

Todos los textos salen de `es.json`, en `dashboard.*` y en `common.*` (`common.units.bagsCount`,
`common.units.bagsAndOpenKg`, `common.units.piecesCount`, `common.fields.*`, `common.actions.save`). Los
turnos del corte devuelven su clave (`labelKey`) y el estado se traduce con `statusLabels`.

## Manejo de errores y observabilidad

El error de carga queda en `DashboardState.error`, pero la pantalla todavía no lo muestra: con el backend
caído se ven ceros (P-16).

## Pruebas

Unitarias (Vitest, `npm test`): `dashboard-page.component.spec.ts` (corte por turno, semana, separación
de bultos y piezas, estados, textos del diccionario y «$» sin «MX$»), `dashboard.store.spec.ts` y
`store/dashboard.*.spec.ts`. Los textos se comparan con `t()` de `src/app/testing/translate.ts`. No hay
suite E2E propia (P-15); `e2e/i18n/` recorre sus textos.

## Dependencias

NgRx (`@ngrx/store`, `@ngrx/effects`), `@ngx-translate/core`, `core/pos-api.service.ts`.

## Limitaciones y trabajo pendiente

- Los mínimos solo viven en memoria y no coinciden con el mínimo que usa Inventario (P-17).
- El corte entre mañana y tarde está fijo a las 14:00, y `productsToReview()` no se muestra (P-24).
- `DashboardStore.fallbackSummary` y `lots` no se usan (P-10).

## Notas de mantenimiento

Las claves se escriben completas en el código (`'dashboard.cashCut.morning'`), nunca concatenadas, para
que `npm run i18n:check` las encuentre.
