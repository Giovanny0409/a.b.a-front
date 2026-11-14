## Context

- **Tipo del producto:** `ProductEntity` (`Data/AppDbContext.cs`) solo tiene `Name`, `Category` y `MinBags`.
  Que un producto sea de bulto o de pieza se deduce de sus lotes (`BagLots` o `UnitLots`).
- **Cotización:** `PosStore.QuoteSaleUnsafe` devuelve `null` cuando el modo no tiene lote, y la pantalla
  muestra «No disponible» sin decir por qué.
- **Modos en Ventas:** `SalesPageComponent` ofrece los cuatro modos a cualquier producto.
- **Ticket e Historial:** escriben `line.unit === 'kg' ? 'kg' : 'bulto'`, así que una pieza sale como
  «bulto» (P-19).
- **Compras:** cada línea se captura completa. `FindOrCreateProduct` busca el producto por nombre sin
  importar mayúsculas y, si existe, ignora la categoría y el tipo que llegan.
- **Datos de la última compra:** `GET /api/purchases` (`PurchaseRecord`) no trae precios de venta; los
  precios viven en `BagLotEntity` (`SalePriceBag`, `SalePriceKg`, `MarkedKg`) y en `UnitLotEntity`
  (`SalePricePiece`).
- **Avisos:** son un `<p class="notice">` verde (`message()`, `expenseMessage()`), también para errores.
  El vendedor se pide con `window.prompt`, el ticket con `window.confirm`, y los errores de carga no se
  muestran (P-16).
- **Dependencias:** `sweetalert2` 11.26 está en `package.json` y nadie lo usa.
- **Contrato JSON:** el backend serializa en camelCase y los enums como texto camelCase
  (`JsonStringEnumConverter`): `PurchaseKind.Unit` → `"unit"`.

## Goals / Non-Goals

**Goals:**
- Un tipo de producto (`bag` | `unit`) guardado en el backend, que es la única fuente para Ventas y Compras.
- Compras autollena una línea de un producto existente.
- Ventas ofrece solo los modos del tipo y muestra la existencia.
- El ticket y el Historial dicen la unidad real.
- Avisos y diálogos de la app con un solo servicio, y el aviso de sin conexión.

**Non-Goals:**
- **Resto de P-20:** buscador de producto, botones de billetes, atajos de teclado, ocultar costo y
  ganancia, editar y juntar líneas del carrito.
- **Resto de P-21:** costo unitario, ganancia esperada por línea, alta de proveedor desde el mismo campo y
  resumen antes de guardar.
- **Resto de P-16:** indicadores de carga.
- **Otras pantallas:** Historial con varias líneas, filtros (P-25) y mínimos (P-17).
- **Otras unidades:** un producto que se venda a la vez por bulto y por pieza no existe hoy y no se
  contempla.

## Decisions

### D1. `ProductKind` en el backend, llenado por migración
- **Entidad:** `ProductEntity.Kind` (`enum ProductKind { Bag, Unit }`, como `int`, por omisión `Bag`).
- **Contrato:** `Product` (record) gana `Kind`, y en JSON va `"kind": "bag" | "unit"`.
- **Migración `AddProductKind`:** agrega la columna y ejecuta
  `UPDATE Products SET Kind = 1 WHERE Id IN (SELECT ProductId FROM UnitLots) AND Id NOT IN (SELECT ProductId FROM BagLots)`.
- **Datos iniciales:** `PosStore.Seed` fija el tipo de los productos de siembra.
- **Alternativa descartada:** deducir el tipo en el front por la existencia. Un producto sin existencia
  queda sin tipo, y la regla se repetiría en cada pantalla (decisión del usuario).

### D2. El backend valida el tipo en compras y ventas
- **Compras:** `FindOrCreateProduct` recibe el `PurchaseKind` de la línea. Un producto nuevo toma ese
  tipo. Uno existente con otro tipo hace que `RegisterPurchase` lance `InvalidOperationException` con
  «El producto {nombre} es de piezas» (o «de bultos»). `PurchasesController` ya responde `400` con
  `{ message }` para esa excepción; se confirma en la tarea.
- **Ventas:** `QuoteSaleUnsafe` y `RegisterSaleBatch` rechazan `Piece` para un producto `Bag`, y
  `Bag`/`Kg` para uno `Unit`, lanzando `InvalidOperationException` con «{nombre} se vende por pieza» (o
  «por bulto o por kilo»). `SalesController.Quote` gana el mismo `try/catch` que `RegisterBatch` y responde
  `400` con `{ message }`. La falta de inventario sigue respondiendo `404` («No hay inventario
  suficiente.»).
- **Mensajes:** son textos del backend; el front los muestra tal cual (spec `i18n`).

### D3. `GET /api/products/purchase-defaults`
- **Respuesta:** `ProductPurchaseDefaults(Guid ProductId, string Name, ProductKind Kind, string Category,
  decimal? MarkedKg, decimal SalePriceBag, decimal? SalePriceKg)` para cada producto con al menos una
  compra.
- **Origen de los valores:** el lote más reciente (`PurchasedAt` descendente). Para `bag` sale de
  `BagLots`; para `unit`, `SalePriceBag` lleva el `SalePricePiece` de `UnitLots`, igual que el formulario,
  donde «Venta bulto/u.» es el precio de la pieza.
- **Ruta:** va en `ProductsController` porque describe productos.
- **Alternativa descartada:** agregar precios a `Product`. `Product` lo usan todas las pantallas y los
  precios solo le sirven a Compras.

### D4. Autollenado en Compras
- **Carga:** `PurchasesEffects.loadProducts$` también pide `purchase-defaults`, y el estado guarda
  `purchaseDefaults`.
- **Al escribir el nombre:** el `valueChanges` del `productName` de cada línea (con `debounceTime`) busca
  la coincidencia exacta sin mayúsculas ni espacios extremos. Si existe, aplica `patchValue` a `kind`,
  `category`, `markedKg`, `salePriceBag` y `salePriceKg`, y deshabilita `kind`. Si no existe, habilita
  `kind` y no toca el resto.
- **Al guardar:** se usa `getRawValue()` para que viaje el `kind` deshabilitado.
- **Costo y cantidad:** nunca se tocan. El costo cambia con cada proveedor.

### D5. Modos y existencia en Ventas
- **Datos:** `SalesEffects.load$` también pide `GET /api/inventory`; el estado guarda `inventory` y la
  fachada expone `productKind(id)` y `stock(id)`.
- **Modos:** `modesFor(kind)` da los modos (`unit` → `['piece']`; `bag` → `['bag', 'kg', 'money']`) y el
  `<select>` de modo los recorre. Al cambiar de producto, si el modo actual no está en la lista, se pone
  el primero.
- **Existencia:** se muestra con `common.units.*` junto al producto.

### D6. Ticket e Historial con la unidad real
- **Claves por unidad:** un mapa `bag | kg | piece` → clave de `sales.quantity.*`, usado por el ticket y
  por el Historial. Reemplaza el ternario.
- **Plural:** se agregan `sales.quantity.bags` («{{quantity}} bultos») y `sales.quantity.pieces`, y se
  elige singular o plural según `quantity === 1`.
- **Vendedor en el ticket:** el `SaleRecord` no trae el vendedor por separado (va dentro de `customer`),
  así que el ticket muestra el vendedor activo al cobrar, que se guarda en `TicketPreview`.

### D7. `NotificationService` sobre SweetAlert2
- **Abstracción:** `core/notify/notification.service.ts` define la clase abstracta `Notifier` con
  `success(text)`, `error(text)`, `confirm({ title, confirm, cancel })`, `prompt({ title, secret })` y
  `choice({ title, text, confirm, deny })`. `SwalNotifier` la implementa y se provee en `main.ts`. Los
  componentes y el guard dependen de `Notifier` (D de SOLID) y las pruebas la sustituyen.
- **Comportamiento de cada aviso:**
  - Éxito: icono `success`, `timer: 2500`, sin botón.
  - Error: icono `error`, con botón «Cerrar».
  - Confirmación: `showCancelButton`.
  - Pedir el ID: `input: 'password'`.
  - Elegir: `showDenyButton`.
- **Textos y colores:** los textos de los botones salen de `es.json` (`notifications.*`); los colores, de
  las variables de `_variables.scss` (`--brand`, `--danger`) vía `customClass` y un bloque en
  `src/assets/layout/_notifications.scss`, porque no hay estilo previo para SweetAlert2 (Principio 4).
- **Lo que reemplaza:**
  - `message()` y `expenseMessage()` desaparecen junto con su `.notice`.
  - El guard pasa de `window.prompt` y `window.alert` a `notifier.prompt` y `notifier.error`, envueltos
    en `from()`.
  - El fin de venta pasa de `window.confirm` a `notifier.choice` («Ver ticket» y «Nueva venta»).
  - Borrar un ticket pasa a `notifier.confirm`.

### D8. Interceptor de conexión
- **Detección:** `core/notify/connection.interceptor.ts` (`HttpInterceptorFn`, registrado con
  `withInterceptors` en `main.ts`) detecta `HttpErrorResponse.status === 0`.
- **Aviso:** llama una vez a `notifier.choice` con «Sin conexión con el servidor» y «Reintentar» →
  `location.reload()`. Una bandera evita repetirlo mientras el aviso está abierto.
- **El error sigue su camino:** los effects siguen guardando su error como hoy.

### D9. Primero las pruebas que reproducen
Según `CLAUDE.md`, los defectos (Ventas ofrece «Por bulto» para un comedero y el ticket de una pieza dice
«bulto») se reproducen primero en `e2e/compras-ventas-guiadas/` y se ven fallar antes de corregir.

### D10. E2E con los diálogos de SweetAlert2
- **Ya no hay diálogos del navegador:** las suites `ventas` e `i18n` interactúan con `.swal2-popup`
  (`.swal2-input` para el ID, y `.swal2-confirm`, `.swal2-deny` y `.swal2-cancel`), con ayudas en
  `e2e/support/avisos.ts`.
- **Los textos siguen saliendo de `t()`.**

## Risks / Trade-offs

- **Un producto existente con lotes de los dos tipos (dato raro) queda `bag`.**
  → **Mitigación:** la migración lo deja `bag`, y Ventas sigue ofreciendo bulto, kilo y pesos. Se revisa
  en la QA con `aba.db`.
- **Los éxitos que se cierran solos pueden pasar desapercibidos.**
  → **Mitigación:** 2.5 s y un icono grande. Los errores no se cierran solos.
- **SweetAlert2 mete su propio DOM y sus estilos.**
  → **Mitigación:** los colores se ajustan en `_notifications.scss` y el aviso del ticket vive fuera del
  `@media print` del ticket. Se revisa en la QA que imprimir siga sacando solo el ticket.
- **La suite `ventas` cambia mucho por los diálogos.**
  → **Mitigación:** las ayudas de `e2e/support/avisos.ts` se escriben una vez y la suite conserva sus
  escenarios.
- **La rama del front está apilada sobre `dev-feat-i18n-espanol`.**
  → **Mitigación:** se anota en PENDIENTES. Su PR va después del de i18n.

## Migration Plan

1. **Back primero:** la migración `AddProductKind` se aplica sola al arrancar (`db.Database.Migrate()`) y
   llena los tipos.
2. **Después el front:** un front viejo ignora `kind`, así que el orden entre repos no rompe nada.
3. **Revertir:** `dotnet ef database update InitialSchema` quita la columna; la rama del front se revierte
   con sus commits.

## Open Questions

_(ninguna)_
