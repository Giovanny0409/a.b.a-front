## Why

Al usar la app, la persona reportó (2026-11-14) que Compras y Ventas no la guían:

- **Compras:** al escribir un producto que ya existe hay que volver a capturar su categoría, su tipo y sus
  precios (P-21). Un error de escritura crea un producto duplicado.
- **Avisos:** «Compra registrada en el backend…» es un renglón verde que casi no se ve, y un error se ve
  igual, también en verde (P-16).
- **Ventas por bulto de un comedero:** Ventas ofrece vender un comedero «Por bulto» (P-20), y el ticket de
  una venta por pieza dice «1 bulto» (P-19).

La causa de fondo es que **el producto no guarda si es de bulto o de pieza**. El backend lo deduce de sus
lotes, y la pantalla no lo sabe.

## What Changes

- **Tipo del producto:** el producto guarda su tipo, `bag` (bulto, se vende por bulto, kilo o pesos) o
  `unit` (pieza). Una migración lo llena según los lotes que ya tiene cada producto. Una compra no puede
  cambiar el tipo de un producto existente, y una venta no puede usar un modo que no corresponde al tipo.
- **Datos de la última compra:** nuevo `GET /api/products/purchase-defaults` con la categoría, el tipo,
  los kg por bulto y los últimos precios de venta de cada producto.
- **Compras:** al escribir el nombre de un producto existente, la línea se llena sola con su tipo (que
  queda fijo), su categoría, sus kg por bulto y sus últimos precios de venta. Solo el costo y la cantidad
  se capturan cada vez.
- **Ventas, modos y existencia:** solo ofrece los modos del tipo del producto (`unit` solo «Por pieza»,
  `bag` «Por bulto», «Por kilo» y «Por pesos») y muestra la existencia del producto elegido antes de
  cotizar.
- **Ventas, ticket:** el ticket (y el Historial) muestran la unidad correcta («1 pieza», «2 bultos»,
  «2.5 kg») y el vendedor. **Corrige P-19.**
- **Avisos con SweetAlert2:** éxito, error y confirmación en Compras, Gastos y Ventas, con un solo servicio.
  Los errores se ven como error y hay que cerrarlos. Los éxitos se cierran solos.
- **Sin conexión:** si el backend no responde, un aviso de «Sin conexión con el servidor» con
  «Reintentar», en lugar de mostrar ceros sin explicación.
- **Diálogos propios en lugar de los del navegador:** el ID de vendedor (campo oculto) y el fin de venta,
  con «Ver ticket» o «Nueva venta» en lugar de «¿Requiere ticket?».
- **E2E:** suites que reproducen primero los defectos (modo «Por bulto» para un comedero, «bulto» en el
  ticket de una pieza). Ventas e i18n se adaptan a los diálogos nuevos.

## Capabilities

### New Capabilities
- `notifications`: avisos de éxito, error y confirmación, y el aviso de sin conexión, con un solo
  servicio.

### Modified Capabilities
- `sales`: modos según el tipo del producto, existencia a la vista, ticket con la unidad y el vendedor,
  diálogos propios para el vendedor y el fin de venta.
- `purchases`: el producto tiene un tipo fijo y la línea se autollena con los datos de su última compra.

## Impact

- **Back (`a.b.a-back`):**
  - `ProductEntity.Kind` y su migración `AddProductKind`.
  - `Product` (record) con `Kind`.
  - `PosStore`: `RegisterPurchase` valida el tipo, `QuoteSaleUnsafe` y `RegisterSaleBatch` validan el modo,
    `Seed` y el nuevo `GetPurchaseDefaults`.
  - `ProductsController` (`GET purchase-defaults`) y sus pruebas en `tests/BackendAba.Tests`.
- **Front (`a.b.a-front`):**
  - `core/pos.models.ts`, `core/pos-api.service.ts`.
  - Nuevo `core/notify/` (servicio de avisos con SweetAlert2) y un interceptor HTTP de conexión.
  - `core/sales-auth.guard.ts`.
  - `features/sales/` (página, fachada, store), `features/purchases/` (página, fachada, store) y
    `features/history/` (unidad vendida).
  - `es.json`, sus `*.spec.ts` y los README.
  - `e2e/ventas/`, `e2e/i18n/` y la nueva `e2e/compras-ventas-guiadas/`.
  - `docs/PENDIENTES.md`.
- **Dependencias:** `sweetalert2` ya está en `package.json` y nadie lo usa.
- **Ramas:** front `dev-feat-compras-ventas-guiadas`, apilada sobre `dev-feat-i18n-espanol`, que aún no
  está en `dev`. Back `dev-feat-compras-ventas-guiadas`, desde `dev`. Un commit por repo por unidad de
  trabajo.

## Status

Aprobada — 2026-11-14. Lista para implementar (rama + `/opsx:apply`).
