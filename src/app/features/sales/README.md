# Ventas

## Descripción

Pantalla de punto de venta (ruta `/ventas`, protegida por autorización de vendedor) para cobrar productos por bulto, por kilo, por pieza o por importe en pesos, generar el carrito de la venta, imprimir/guardar el ticket y consultar tickets guardados de la sesión.

## Responsabilidades y alcance

- Cotizar y agregar líneas de venta en cuatro modos: `bag` (por bulto), `kg` (por kilo), `piece` (por pieza, para productos varios) y `money` (por importe en pesos, convertido internamente a kilos).
- Calcular total, dinero recibido y cambio a entregar.
- Registrar la venta completa como un solo `SaleRecord` con varias `SaleLine`.
- Generar, imprimir y guardar tickets (los guardados viven solo en el estado de NgRx de la sesión, no se persisten en el backend ni en `localStorage`).
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

Usa los modelos compartidos en `core/pos.models.ts`: `Product`, `SaleUnit` (`'bag' | 'kg' | 'piece'`), `SaleLine`, `SaleRecord`, `Seller`, `SellerAuthorization`. `SalesEntryMode` (`sales.store.ts`) extiende `SaleUnit` con el modo de captura `'money'`, exclusivo de la UI (no se envía tal cual al backend: se convierte a una venta por kilo equivalente antes de llamar a la API).

## Estado NgRx

`SalesState { products, sales, activeSeller, savedTickets, error }`, expuesto vía `SalesStore` (fachada con signals `products()`, `sales()`, `activeSeller()`, `savedTickets()`).

- `activeSeller` se fija con `authorizeSellerSuccess` y vuelve a `null` con `authorizeSellerFailure` o con `clearSeller`. `SalesStore.changeSeller()` despacha `clearSeller` y navega a `/ventas` con `onSameUrlNavigation: 'reload'` para que el guard vuelva a pedir el ID; `savedTickets` no se toca.

## Efectos y flujo de datos

- `load$`: `forkJoin` de `products` y `sales`.
- `authorizeSeller$`: valida el ID de vendedor capturado por `core/sales-auth.guard.ts` antes de dejar entrar a la ruta.
- `registerSaleBatch$`: envía todas las líneas del carrito en un solo `POST /api/sales/batch`; el backend descuenta inventario por línea (bultos sellados, kilos de un lote abierto, o piezas de un producto vario) y calcula costo/ganancia por línea.

## Servicios y endpoints

Vía `core/pos-api.service.ts` contra el backend (`backend aba`, `http://localhost:5028/api`):
- `GET /api/products`, `GET /api/sales`.
- `GET /api/sales/quote` (cotización antes de agregar la línea al carrito).
- `POST /api/sales/batch` (cobro final de todo el carrito).
- `POST /api/sellers/authorize` (autorización de vendedor, vía el guard).

## Rutas e integración

Ruta `/ventas` (`app.routes.ts`), con `canMatch: [salesAuthorizationGuard]` — exige un ID de vendedor autorizado antes de entrar.

## Permisos y guards

`salesAuthorizationGuard` (`core/sales-auth.guard.ts`): pide el ID de vendedor por `window.prompt`, lo valida contra el backend y redirige a `/tablero` si no está autorizado o si se cancela. Con un vendedor activo deja pasar sin preguntar; para cambiarlo se usa «Cambiar vendedor».

## UI/UX

Reutiliza estilos de `src/assets/layout/`. La barra superior muestra el vendedor activo («Vendedor: Aurelio», `.badge.ok`), el botón «Cambiar vendedor» y «Tickets guardados». El ticket imprimible usa estilos `@media print` dedicados dentro del propio componente para aislar solo el ticket al imprimir.

## Internacionalización

Pendiente: todo el texto sigue embebido en español directo en el template (aún no migrado a `ngx-translate`/`es.json`, ver `CLAUDE.md` Principio 1). Se migrará cuando se toque este componente para un cambio funcional futuro.

## Manejo de errores y observabilidad

Errores de red o de negocio (ej. dinero recibido insuficiente, inventario insuficiente) se muestran en `message()` (signal), tomando `error?.error?.message` cuando el backend responde `400 BadRequest`.

## Pruebas

- Unitarias (Vitest, `npm test`): `sales-page.component.spec.ts` (etiquetas por modo, carrito, total y cambio,
  cobro insuficiente, venta con y sin ticket, error, tickets guardados), `sales.store.spec.ts` (cotización por
  bulto, kilo, pieza y pesos; venta en lote por `requestId`; venta sin vendedor), `store/sales.reducer.spec.ts` y
  `store/sales.effects.spec.ts`. El guard de vendedor se prueba en `core/sales-auth.guard.spec.ts`.
- E2E (Playwright, `npm run test:e2e`): `e2e/ventas/` recorre el vendedor activo como lo usa una persona: ID desconocido, cobro a nombre del vendedor, salir y volver, cambiar de vendedor conservando los tickets, y cancelar el cambio.

## Dependencias

`@angular/forms` (Reactive Forms), NgRx (`@ngrx/store`, `@ngrx/effects`), `core/pos-api.service.ts`, `core/sales-auth.guard.ts`.

## Limitaciones y trabajo pendiente

- Los tickets guardados no sobreviven a un refresh de página (estado en memoria de NgRx, no persistido).
- El modo "Por pieza" vende contra un solo lote de piezas por producto (`UnitLot` en el backend); no hay UI para elegir un lote específico si un producto tuviera varios con distinto costo.
- La alerta de stock bajo al vender (WhatsApp/correo al encargado) todavía no existe — queda para un change posterior de la hoja de ruta.

## Notas de mantenimiento

`toBackendLine` en `sales.store.ts` es el único lugar que traduce `SalesEntryMode` (incluyendo `'money'`) a un `SaleUnit` real antes de llamar al backend; cualquier modo de venta nuevo debe pasar por ahí.
