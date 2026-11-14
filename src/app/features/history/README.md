# Historial

## Descripción

Pantalla de consulta (ruta `/historial`) de todo lo registrado: ventas, compras y gastos, con los totales
de inversión, ventas, gastos y ganancia.

## Responsabilidades y alcance

- Mostrar inversión registrada, ventas, gastos y ganancia acumulados.
- Listar ventas (fecha, cliente, producto, cantidad, total, costo y ganancia), compras (fecha, producto,
  proveedor, tipo, cantidad e inversión) y gastos (fecha, concepto, categoría, apartado, monto y notas).
- No cubre: registrar ni editar nada; filtrar por fecha, vendedor o cliente; exportar (P-25).

## Estructura de archivos

```text
history/
├── history-page.component.ts
├── history.store.ts
├── README.md
└── store/
    ├── history.actions.ts
    ├── history.effects.ts
    ├── history.reducer.ts
    └── history.selectors.ts
```

## Componentes

- `HistoryPageComponent` (`aba-history-page`): métricas y las tres tablas. `supplierLabel()` y
  `purchaseQuantityLabel()` arman el texto del proveedor y de la cantidad comprada;
  `expenseAreaLabel()` da la clave del apartado del gasto.

## Modelos y contratos

`SaleRecord`, `PurchaseRecord` y `ExpenseRecord` de `core/pos.models.ts`. El apartado del gasto
(`general`, `guardadito`, `camioneta`) es un dato que se traduce solo para mostrarlo.

## Estado NgRx

`HistoryState { sales, purchases, expenses, loading, error }`, expuesto por `HistoryStore` con signals
(`sales()`, `purchases()`, `expenses()`, `summary()`). `selectHistorySummary` calcula los totales.

## Efectos y flujo de datos

- `load$`: `forkJoin` de ventas, compras y gastos (si los gastos fallan, se toman vacíos). Si falla,
  `loadFailure` guarda el mensaje del backend o la clave `history.errors.load`.

## Servicios y endpoints

Vía `core/pos-api.service.ts`: `GET /api/sales`, `GET /api/purchases` y `GET /api/expenses`.

## Rutas e integración

Ruta `/historial` (`app.routes.ts`).

## Permisos y guards

Sin guard.

## UI/UX

Reutiliza `.metric`, `.panel` y `.table-wrap` de `src/assets/layout/`. Los importes salen con el formato
`es-MX` («$640.00»).

## Internacionalización

Los textos salen de `es.json`, en `history.*`, y comparte claves con otras pantallas:
`common.*`, `expenses.fields.*` y `expenses.areas.*` con el panel de gastos de Compras,
`purchases.lines.kind`, y `sales.quantity.*` para la cantidad vendida.

- **Textos con datos:** `supplierLabel()` y `purchaseQuantityLabel()` se traducen con `instant()`. El
  proveedor sin nombre se muestra como «Sin proveedor» (`history.purchases.noSupplier`), que aquí es
  solo un texto de pantalla.
- **Apartado del gasto:** `expenseAreaLabel()` devuelve la clave, o el apartado tal cual si no lo conoce.
  ngx-translate muestra sin cambios un texto que no es una clave.

## Manejo de errores y observabilidad

El error de carga queda en `HistoryState.error`, pero la pantalla todavía no lo muestra (P-16).

## Pruebas

Unitarias (Vitest, `npm test`): `history-page.component.spec.ts` (proveedor, cantidad comprada, apartado,
textos del diccionario y «$» sin «MX$»), `history.store.spec.ts` y `store/history.*.spec.ts`. Los
textos se comparan con `t()`. No hay suite E2E propia (P-15); `e2e/i18n/` recorre sus textos.

## Dependencias

NgRx (`@ngrx/store`, `@ngrx/effects`), `@ngx-translate/core`, `core/pos-api.service.ts`.

## Limitaciones y trabajo pendiente

- Una venta con varios productos muestra solo el primero (`sale.lines[0]`), y su cantidad sale como
  «bulto» si no es por kilo, igual que el ticket (P-19, P-25).
- Sin vendedor, filtros, pestañas, paginación ni exportación (P-25).

## Notas de mantenimiento

Las claves se escriben completas en el código para que `npm run i18n:check` las encuentre.
