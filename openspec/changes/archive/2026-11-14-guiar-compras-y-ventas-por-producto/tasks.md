## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, en el mismo commit que los artefactos:
  - P-19 pasa a «En curso».
  - P-16, P-20 y P-21 quedan «En curso (parcial)», diciendo qué parte toma este change.
  - Registrar que la rama del front está apilada sobre `dev-feat-i18n-espanol` (quedó como P-28).

## 2. Reproducir primero (D9)

- [x] 2.1 Agregar a `e2e/support/catalogo.ts` lo que haga falta. Crear `e2e/compras-ventas-guiadas/` (locators y spec) con los escenarios de los dos defectos: el comedero en Ventas solo ofrece «Por pieza», y el ticket de una pieza dice «1 pieza». Correrla y anotar aquí cómo falla antes de corregir.
  - **Evidencia (2026-11-14, antes de corregir):** `npx playwright test e2e/compras-ventas-guiadas` → 2 fallan.
    «un comedero solo se vende por pieza»: el `<select>` de modo trae 4 opciones en lugar de solo «Por pieza».
    «el ticket de una pieza dice «1 pieza»»: la línea del ticket es «Comedero para pollo 3 kg1 bulto$75.00».
    El catálogo ya tenía el comedero; se agregó `comprarPiezas()` a `e2e/support/api.ts`.

## 3. Backend (`a.b.a-back`, commit propio)

- [x] 3.1 `ProductKind`, `ProductEntity.Kind`, `Product` con `Kind`, `ToModel` y `Seed` (D1). Migración `AddProductKind` con el `UPDATE` que llena los tipos. Comprobar con `aba.db` que el comedero queda `unit` y los alimentos `bag`.
  - **Evidencia:** `dotnet ef database update` sobre `aba.db` (respaldada antes): «Comedero para pollo 3 kg» y
    los `PW_*_vario` quedan `Kind = 1`; los alimentos, el maíz, el salvado y los `PW_*_bulto` quedan `0`.
    `AddProductKindMigrationTests` lo cubre sobre el esquema anterior, con un producto mixto que queda `bag`.
- [x] 3.2 Validación del tipo en `RegisterPurchase`/`FindOrCreateProduct` y del modo en `QuoteSaleUnsafe` y `RegisterSaleBatch`. Agregar el `try/catch` de `SalesController.Quote` (D2).
- [x] 3.3 `GetPurchaseDefaults` y `GET /api/products/purchase-defaults` (D3).
- [x] 3.4 Pruebas en `tests/BackendAba.Tests`: el tipo al crear, la compra con otro tipo (`400`), la venta y la cotización con un modo que no corresponde (`400`), `purchase-defaults` toma el último lote, y la API por HTTP para el contrato nuevo (`kind`, `purchase-defaults`). `dotnet build` y `dotnet test`.
  - **Evidencia:** `dotnet build` sin advertencias, `dotnet test` 76/76. Se ajustaron dos pruebas cuyo caso
    cambió de significado: cotizar por pieza un producto de bulto ya no es «sin inventario» sino un modo que no
    corresponde (pruebas nuevas), y la venta sin inventario de `ApiTests` pasó a pedir 1000 kg.
    Commit del back `7d8ee6c`.
- [x] 3.5 `README.md` del back si describe los productos o los endpoints.

## 4. Avisos (front)

- [x] 4.1 `core/notify/`: `Notifier` (clase abstracta), `SwalNotifier` y su `*.spec.ts`; proveerlo en `main.ts`. Estilos en `src/assets/layout/_notifications.scss` con las variables de `_variables.scss`, y textos en `notifications.*` de `es.json` (D7).
- [x] 4.2 `connection.interceptor.ts` con `withInterceptors` en `main.ts` y su `*.spec.ts`: un solo aviso aunque fallen varias peticiones (D8).
- [x] 4.3 Compras y gastos: quitar `message()`, `expenseMessage()` y sus `.notice`, y avisar con `Notifier` (éxito o error con el mensaje del backend). Quitar las claves huérfanas de `es.json`.

## 5. Modelos y Compras (front)

- [x] 5.1 `core/pos.models.ts` (`Product.kind`, `ProductPurchaseDefaults`) y `PosApiService.getPurchaseDefaults()` con su prueba.
- [x] 5.2 Store de Compras con `purchaseDefaults` (acciones, efecto, reducer, selector, fachada) y sus pruebas.
- [x] 5.3 Autollenado de la línea con `kind` fijo (D4) en `purchases-page.component.ts` y su `*.spec.ts`: un producto existente llena tipo, categoría, kg y precios sin tocar la cantidad ni el costo; uno nuevo deja la línea editable. `features/purchases/README.md`.

## 6. Ventas (front)

- [x] 6.1 Store de Ventas con `inventory`; la fachada expone `productKind(id)` y `stock(id)` (D5), con pruebas.
- [x] 6.2 Modos según el tipo y existencia a la vista en `sales-page.component.ts`, con su `*.spec.ts`. Hace pasar el escenario del comedero de la tarea 2.1.
- [x] 6.3 Ticket e Historial con la unidad real y el plural, y el vendedor en el ticket (D6), con claves en `es.json`. Actualizar `history-page.component.ts` y los `*.spec.ts`. Hace pasar el escenario del ticket de la tarea 2.1.
  - El mapa de unidades vive en `core/sale-quantity.ts` (`saleQuantityKey()`), compartido por el ticket y el
    Historial. `sales.quantity.piece` pasó de «pieza(s)» a «pieza», con `bags` y `pieces` para el plural.
- [x] 6.4 Diálogos propios: el guard pide el ID con `notifier.prompt` y avisa el rechazo con `notifier.error`. El fin de venta usa `notifier.choice` («Ver ticket» o «Nueva venta») y el borrado de un ticket usa `notifier.confirm`. Actualizar `sales-auth.guard.spec.ts`, `sales-page.component.spec.ts`, `features/sales/README.md` y `features/history/README.md`.

## 7. QA y reglas

- [x] 7.1 `e2e/support/avisos.ts` para los diálogos de SweetAlert2 (D10). Adaptar `e2e/ventas/` y `e2e/i18n/`, y completar `e2e/compras-ventas-guiadas/` con los escenarios de las specs `sales`, `purchases` y `notifications`. La de sin conexión cubre la petición caída con `page.route(..., route => route.abort())`.
- [x] 7.2 QA con la skill `qa-playwright`. Detener antes el backend que esté corriendo para que Playwright levante el de esta rama. Correr `npm run test:e2e` completo y anotar aquí la evidencia (suites, resultado y marca de los datos). Revisar también que imprimir el ticket siga sacando solo el ticket.
  - **Evidencia (2026-11-14):** backend de esta rama levantado por Playwright en `:5028` (el `backend-aba.exe`
    de `dev` se detuvo antes) y front en `:4200`, contra `aba.db`. `npm run test:e2e`: **30 pasan** (suites
    `compras-inventario`, `compras-ventas-guiadas` 14, `i18n` 10, `ventas` 5). Datos: «Comedero para pollo 3 kg»
    y «Alimento pollo de engorda Malta Cleyton 40 kg» y «… Purina 40 kg».
  - La primera corrida dio 28/30: `darIdDeVendedor` esperaba a que se ocultara la ventana, y con un ID rechazado
    el error ocupa la misma ventana. Prueba frágil; se espera al campo del ID.
  - Impresión, revisada con una prueba temporal en `emulateMedia({ media: 'print' })`: sale solo el ticket, con
    «1 pieza» y el vendedor. De paso se vio que la regla `body *` del `@media print` nunca aplica por la
    encapsulación de Angular, y que imprimir con Ctrl+P con un aviso abierto sale en blanco: anteriores o
    marginales, registrados en P-30.
- [x] 7.3 Actualizar `e2e/README.md` y la receta de diálogos de la skill `qa-playwright`: el ID de vendedor ya no es `window.prompt`.
  - La receta de la skill también cubre los avisos que tapan la pantalla, el aviso que sigue a otro, la espera
    del autollenado y el aviso de sin conexión.

## 8. Cierre

- [x] 8.1 `npm run build` (con `logs:check` e `i18n:check`), `npm test`, `npx tsc -p e2e/tsconfig.json`, `dotnet build` y `dotnet test`. Revisar que no queden huérfanos en los dos repos: `message()`, `.notice` sin uso, claves de `es.json`, `window.prompt`, `window.confirm` y `window.alert`.
  - **Evidencia (2026-11-14):** `npm run build` sin advertencias (`logs:check` 53 archivos, `i18n:check` 186
    claves); `npm test` 31 archivos y 194 pruebas; `npx tsc -p e2e/tsconfig.json` sin errores; `dotnet build`
    sin advertencias y `dotnet test` 76. En `src/` y `e2e/` no quedan `window.prompt|confirm|alert`, `message()`,
    `expenseMessage`, `.notice`, `askTicket` ni `page.on('dialog')`; `sales.messages.askTicket` se quitó de
    `es.json`.
- [x] 8.2 `openspec validate guiar-compras-y-ventas-por-producto --strict`.
  - **Evidencia:** «Change 'guiar-compras-y-ventas-por-producto' is valid».
- [x] 8.3 En `docs/PENDIENTES.md`, cerrar P-19 con su evidencia, dejar en P-16, P-20 y P-21 solo lo que no se hizo, y registrar lo que haya aparecido.
  - Hecho: P-19 cerrado; P-16, P-20 y P-21 abiertos con lo que queda; nuevos P-29 a P-34.
