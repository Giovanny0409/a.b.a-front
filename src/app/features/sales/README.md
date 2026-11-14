# Ventas

## Descripción

Pantalla de punto de venta (ruta `/ventas`, protegida por autorización de vendedor) para cobrar productos por bulto, por kilo, por pieza o por importe en pesos, generar el carrito de la venta, imprimir/guardar el ticket y consultar tickets guardados de la sesión.

## Responsabilidades y alcance

- Cotizar y agregar líneas de venta en cuatro modos: `bag` (por bulto), `kg` (por kilo), `piece` (por pieza, para productos varios) y `money` (por importe en pesos, convertido internamente a kilos). Solo se ofrecen los modos del tipo del producto elegido (`modesFor()`): `unit` solo `piece`; `bag` `bag`, `kg` y `money`. Al cambiar de producto, el modo pasa al primero que le corresponde.
- Mostrar la existencia del producto elegido antes de cotizar: piezas para `unit`; bultos sellados y kg abiertos para `bag`.
- Calcular total, dinero recibido y cambio a entregar.
- Registrar la venta completa como un solo `SaleRecord` con varias `SaleLine`.
- Generar, imprimir y guardar tickets con la unidad real de cada línea («1 pieza», «2 bultos», «2.5 kg») y el vendedor que cobró (los guardados viven solo en el estado de NgRx de la sesión, no se persisten en el backend ni en `localStorage`).
- No cubre: historial completo de ventas (ver `features/history`), autorización de vendedor en sí (ver `core/sales-auth.guard.ts`).

## Estructura de archivos

```text
sales/
├── sales-page.component.ts
├── sales.store.ts
├── README.md
└── store/
    ├── sales.actions.ts
    ├── sales.effects.ts
    ├── sales.reducer.ts
    └── sales.selectors.ts
```

## Componentes

- `SalesPageComponent` (`aba-sales-page`): formulario de captura de línea de venta, carrito, checkout, diálogo de tickets guardados y vista de ticket imprimible.

## Modelos y contratos

Usa los modelos compartidos en `core/pos.models.ts`: `Product` (con `kind`), `InventoryItem`, `SaleUnit` (`'bag' | 'kg' | 'piece'`), `SaleLine`, `SaleRecord`, `Seller`, `SellerAuthorization`. `SalesEntryMode` (`sales.store.ts`) extiende `SaleUnit` con el modo de captura `'money'`, exclusivo de la UI (no se envía tal cual al backend: se convierte a una venta por kilo equivalente antes de llamar a la API).

## Estado NgRx

`SalesState { products, sales, inventory, activeSeller, savedTickets, error }`, expuesto vía `SalesStore` (fachada con signals `products()`, `sales()`, `activeSeller()`, `savedTickets()`, y con `productKind(id)` y `stock(id)`).

- `SavedTicket` guarda también el `seller` activo al cobrar: el `SaleRecord` del backend lo trae dentro de `customer`, no por separado.

- `activeSeller` se fija con `authorizeSellerSuccess` y vuelve a `null` con `authorizeSellerFailure` o con `clearSeller`. `SalesStore.changeSeller()` despacha `clearSeller` y navega a `/ventas` con `onSameUrlNavigation: 'reload'` para que el guard vuelva a pedir el ID; `savedTickets` no se toca.

## Efectos y flujo de datos

- `load$`: `forkJoin` de `products`, `sales` e `inventory`. La pantalla lo vuelve a despachar después de cobrar, para que la existencia a la vista se actualice.
- `authorizeSeller$`: valida el ID de vendedor capturado por `core/sales-auth.guard.ts` antes de dejar entrar a la ruta.
- `registerSaleBatch$`: envía todas las líneas del carrito en un solo `POST /api/sales/batch`; el backend descuenta inventario por línea (bultos sellados, kilos de un lote abierto, o piezas de un producto vario) y calcula costo/ganancia por línea.

## Servicios y endpoints

Vía `core/pos-api.service.ts` contra el backend (`backend aba`, `http://localhost:5028/api`):
- `GET /api/products`, `GET /api/sales`, `GET /api/inventory`.
- `GET /api/sales/quote` (cotización antes de agregar la línea al carrito). Responde `404` sin inventario y `400 { message }` si el modo no corresponde al tipo del producto; la fachada toma los dos como «No disponible».
- `POST /api/sales/batch` (cobro final de todo el carrito).
- `POST /api/sellers/authorize` (autorización de vendedor, vía el guard).

## Rutas e integración

Ruta `/ventas` (`app.routes.ts`), con `canMatch: [salesAuthorizationGuard]` — exige un ID de vendedor autorizado antes de entrar.

## Permisos y guards

`salesAuthorizationGuard` (`core/sales-auth.guard.ts`): pide el ID de vendedor con `notifier.prompt({ secret: true })` (un diálogo de la app con el campo oculto), lo valida contra el backend y redirige a `/tablero` si se cancela, o si no está autorizado, avisándolo con `notifier.error`. Con un vendedor activo deja pasar sin preguntar; para cambiarlo se usa «Cambiar vendedor».

## UI/UX

Reutiliza estilos de `src/assets/layout/`. La barra superior muestra el vendedor activo («Vendedor: Aurelio», `.badge.ok`), el botón «Cambiar vendedor» y «Tickets guardados». La existencia va debajo del producto en un `.badge.ok.stock`. El ticket imprimible usa estilos `@media print` dedicados dentro del propio componente para aislar solo el ticket al imprimir (ver P-30).

- **Avisos** (`Notifier`, `core/notify/`): al cobrar, «Venta cobrada» con el total y el cambio, y los botones «Ver ticket» (abre el ticket) y «Nueva venta». Cerrarlo sin elegir equivale a «Nueva venta». Borrar un ticket guardado pide confirmar con «Eliminar» y «Cancelar». El pago insuficiente y los errores del backend se avisan como error; «Ticket guardado» como éxito. Ya no hay `window.confirm` ni `<p class="notice">`.

## Internacionalización

Todos los textos salen de `es.json`, en `sales.*`, `seller.*` (los diálogos del guard) y `common.*`.

- **Etiquetas:** `amountLabel()`, `modeLabel()` y `quantityKey()` devuelven la clave y la plantilla la
  traduce. `quantityKey()` usa `saleQuantityKey()` (`core/sale-quantity.ts`), compartido con Historial:
  `sales.quantity.bag`/`bags`, `piece`/`pieces` y `kg`, en singular solo con cantidad 1.
- **Textos con datos:** `quoteDetail()`, `lineDetail()`, `stockLabel()` y los textos de los avisos se
  traducen al armarlos con `TranslateService.instant()`. El cargador es síncrono, así que
  `instant()` siempre encuentra el diccionario.
- **Mensajes del backend:** `instant()` devuelve tal cual un texto que no es una clave. Por eso un mensaje
  del backend («No hay inventario suficiente…») se muestra sin cambios, y los respaldos de effects y de
  la fachada son claves (`sales.errors.*`, `seller.rejected`).
- **Datos que se guardan:** el cliente por omisión, «Publico general», se queda en el código porque se
  guarda como dato. Solo el marcador del campo («Público general») sale del diccionario.

## Manejo de errores y observabilidad

Errores de red o de negocio (ej. dinero recibido insuficiente, inventario insuficiente, modo que no corresponde) se avisan con `notifier.error()`, tomando `error?.error?.message` cuando el backend responde `400 BadRequest`. Si el backend no responde, `connectionInterceptor` muestra además el aviso de sin conexión. Después de una venta fallida, «Finalizar venta» queda deshabilitado (P-29).

## Pruebas

- Unitarias (Vitest, `npm test`): `sales-page.component.spec.ts` (modos según el tipo, existencia, etiquetas
  por modo, carrito, total y cambio, cobro insuficiente, «Ver ticket» y «Nueva venta», ticket con unidad y
  vendedor, error, tickets guardados y su borrado, con un doble de `Notifier`), `sales.store.spec.ts` (tipo y
  existencia; cotización por bulto, kilo, pieza y pesos; venta en lote por `requestId`; venta sin vendedor),
  `store/sales.reducer.spec.ts` y `store/sales.effects.spec.ts`. El guard de vendedor se prueba en `core/sales-auth.guard.spec.ts`.
- E2E (Playwright, `npm run test:e2e`): `e2e/ventas/` recorre el vendedor activo como lo usa una persona: ID desconocido, cobro a nombre del vendedor, salir y volver, cambiar de vendedor conservando los tickets, y cancelar el cambio. `e2e/compras-ventas-guiadas/` cubre los modos según el tipo, la existencia, el ticket de una pieza, «Nueva venta» y el borrado cancelado. Los diálogos se contestan con `e2e/support/avisos.ts`.
- Los textos se comparan con `t()` (`src/app/testing/translate.ts` en las unitarias, `e2e/support/textos.ts` en las E2E), nunca con literales; las pruebas de componente y del guard agregan `provideI18n()` a su `TestBed`.

## Dependencias

`@angular/forms` (Reactive Forms), NgRx (`@ngrx/store`, `@ngrx/effects`), `core/pos-api.service.ts`, `core/sales-auth.guard.ts`, `core/notify/` (SweetAlert2) y `core/sale-quantity.ts`.

## Limitaciones y trabajo pendiente

- Los tickets guardados no sobreviven a un refresh de página (estado en memoria de NgRx, no persistido).
- El modo "Por pieza" vende contra un solo lote de piezas por producto (`UnitLot` en el backend); no hay UI para elegir un lote específico si un producto tuviera varios con distinto costo.
- El ticket muestra al vendedor dos veces: dentro del cliente, como lo guarda el backend, y en su propia línea (P-34).
- Quedan de P-20 el buscador de producto, ocultar costo y ganancia, los billetes, los atajos y editar o juntar líneas.
- La alerta de stock bajo al vender (WhatsApp/correo al encargado) todavía no existe — queda para un change posterior de la hoja de ruta.

## Notas de mantenimiento

`toBackendLine` en `sales.store.ts` es el único lugar que traduce `SalesEntryMode` (incluyendo `'money'`) a un `SaleUnit` real antes de llamar al backend; cualquier modo de venta nuevo debe pasar por ahí.
