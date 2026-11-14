## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, en el mismo commit que los artefactos:
  - P-19 pasa a «En curso».
  - P-16, P-20 y P-21 quedan «En curso (parcial)», diciendo qué parte toma este change.
  - Registrar que la rama del front está apilada sobre `dev-feat-i18n-espanol` (quedó como P-28).

## 2. Reproducir primero (D9)

- [ ] 2.1 Agregar a `e2e/support/catalogo.ts` lo que haga falta. Crear `e2e/compras-ventas-guiadas/` (locators y spec) con los escenarios de los dos defectos: el comedero en Ventas solo ofrece «Por pieza», y el ticket de una pieza dice «1 pieza». Correrla y anotar aquí cómo falla antes de corregir.

## 3. Backend (`a.b.a-back`, commit propio)

- [ ] 3.1 `ProductKind`, `ProductEntity.Kind`, `Product` con `Kind`, `ToModel` y `Seed` (D1). Migración `AddProductKind` con el `UPDATE` que llena los tipos. Comprobar con `aba.db` que el comedero queda `unit` y los alimentos `bag`.
- [ ] 3.2 Validación del tipo en `RegisterPurchase`/`FindOrCreateProduct` y del modo en `QuoteSaleUnsafe` y `RegisterSaleBatch`. Agregar el `try/catch` de `SalesController.Quote` (D2).
- [ ] 3.3 `GetPurchaseDefaults` y `GET /api/products/purchase-defaults` (D3).
- [ ] 3.4 Pruebas en `tests/BackendAba.Tests`: el tipo al crear, la compra con otro tipo (`400`), la venta y la cotización con un modo que no corresponde (`400`), `purchase-defaults` toma el último lote, y la API por HTTP para el contrato nuevo (`kind`, `purchase-defaults`). `dotnet build` y `dotnet test`.
- [ ] 3.5 `README.md` del back si describe los productos o los endpoints.

## 4. Avisos (front)

- [ ] 4.1 `core/notify/`: `Notifier` (clase abstracta), `SwalNotifier` y su `*.spec.ts`; proveerlo en `main.ts`. Estilos en `src/assets/layout/_notifications.scss` con las variables de `_variables.scss`, y textos en `notifications.*` de `es.json` (D7).
- [ ] 4.2 `connection.interceptor.ts` con `withInterceptors` en `main.ts` y su `*.spec.ts`: un solo aviso aunque fallen varias peticiones (D8).
- [ ] 4.3 Compras y gastos: quitar `message()`, `expenseMessage()` y sus `.notice`, y avisar con `Notifier` (éxito o error con el mensaje del backend). Quitar las claves huérfanas de `es.json`.

## 5. Modelos y Compras (front)

- [ ] 5.1 `core/pos.models.ts` (`Product.kind`, `ProductPurchaseDefaults`) y `PosApiService.getPurchaseDefaults()` con su prueba.
- [ ] 5.2 Store de Compras con `purchaseDefaults` (acciones, efecto, reducer, selector, fachada) y sus pruebas.
- [ ] 5.3 Autollenado de la línea con `kind` fijo (D4) en `purchases-page.component.ts` y su `*.spec.ts`: un producto existente llena tipo, categoría, kg y precios sin tocar la cantidad ni el costo; uno nuevo deja la línea editable. `features/purchases/README.md`.

## 6. Ventas (front)

- [ ] 6.1 Store de Ventas con `inventory`; la fachada expone `productKind(id)` y `stock(id)` (D5), con pruebas.
- [ ] 6.2 Modos según el tipo y existencia a la vista en `sales-page.component.ts`, con su `*.spec.ts`. Hace pasar el escenario del comedero de la tarea 2.1.
- [ ] 6.3 Ticket e Historial con la unidad real y el plural, y el vendedor en el ticket (D6), con claves en `es.json`. Actualizar `history-page.component.ts` y los `*.spec.ts`. Hace pasar el escenario del ticket de la tarea 2.1.
- [ ] 6.4 Diálogos propios: el guard pide el ID con `notifier.prompt` y avisa el rechazo con `notifier.error`. El fin de venta usa `notifier.choice` («Ver ticket» o «Nueva venta») y el borrado de un ticket usa `notifier.confirm`. Actualizar `sales-auth.guard.spec.ts`, `sales-page.component.spec.ts`, `features/sales/README.md` y `features/history/README.md`.

## 7. QA y reglas

- [ ] 7.1 `e2e/support/avisos.ts` para los diálogos de SweetAlert2 (D10). Adaptar `e2e/ventas/` y `e2e/i18n/`, y completar `e2e/compras-ventas-guiadas/` con los escenarios de las specs `sales`, `purchases` y `notifications`. La de sin conexión cubre la petición caída con `page.route(..., route => route.abort())`.
- [ ] 7.2 QA con la skill `qa-playwright`. Detener antes el backend que esté corriendo para que Playwright levante el de esta rama. Correr `npm run test:e2e` completo y anotar aquí la evidencia (suites, resultado y marca de los datos). Revisar también que imprimir el ticket siga sacando solo el ticket.
- [ ] 7.3 Actualizar `e2e/README.md` y la receta de diálogos de la skill `qa-playwright`: el ID de vendedor ya no es `window.prompt`.

## 8. Cierre

- [ ] 8.1 `npm run build` (con `logs:check` e `i18n:check`), `npm test`, `npx tsc -p e2e/tsconfig.json`, `dotnet build` y `dotnet test`. Revisar que no queden huérfanos en los dos repos: `message()`, `.notice` sin uso, claves de `es.json`, `window.prompt`, `window.confirm` y `window.alert`.
- [ ] 8.2 `openspec validate guiar-compras-y-ventas-por-producto --strict`.
- [ ] 8.3 En `docs/PENDIENTES.md`, cerrar P-19 con su evidencia, dejar en P-16, P-20 y P-21 solo lo que no se hizo, y registrar lo que haya aparecido.
