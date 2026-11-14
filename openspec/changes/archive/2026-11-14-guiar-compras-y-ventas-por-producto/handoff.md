# Handoff — guiar-compras-y-ventas-por-producto

## Estado

Aprobada el 2026-11-14. Implementación sin empezar: solo está hecha la tarea 1.1 (registros en
`docs/PENDIENTES.md`).

## Por qué

La persona reportó que Compras y Ventas no la guían:
- **Compras:** al escribir un producto existente hay que recapturar categoría, tipo y precios.
- **Avisos:** «Compra registrada…» es un renglón verde que casi no se ve, y los errores también salen en
  verde.
- **Ventas:** ofrece «Por bulto» para un comedero, y el ticket de una pieza dice «1 bulto» (P-19).

La causa es que el producto no guarda si es de bulto o de pieza. Lo deciden la propuesta, las specs
(`sales`, `purchases`, `notifications`) y el `design.md` (D1–D10); este archivo resume lo necesario para
aplicar sin volver a explorar.

## Qué se construye y dónde

### Back (`../a.b.a-back`, commit propio)

- **`Models/DomainModels.cs`:**
  - Nuevo `enum ProductKind { Bag, Unit }`.
  - `Product(Guid Id, string Name, string Category, int MinBags)` gana `ProductKind Kind`.
  - Nuevo `record ProductPurchaseDefaults(Guid ProductId, string Name, ProductKind Kind, string Category, decimal? MarkedKg, decimal SalePriceBag, decimal? SalePriceKg)`.
- **`Data/AppDbContext.cs`:** `ProductEntity` gana `public ProductKind Kind { get; set; }`.
- **Migración nueva `AddProductKind`** (`dotnet ef migrations add AddProductKind`):
  - La columna `Kind` es `int`, no nula, con valor por omisión `0` (`Bag`).
  - En `Up`, después del `AddColumn`, va
    `migrationBuilder.Sql("UPDATE Products SET Kind = 1 WHERE Id IN (SELECT ProductId FROM UnitLots) AND Id NOT IN (SELECT ProductId FROM BagLots)")`.
  - Revisar en el `*.Designer.cs` generado los nombres reales de tabla y columna (`Products`, `UnitLots`,
    `BagLots`, `ProductId`) antes de confiar en el SQL.
- **`Services/PosStore.cs`:**
  - `ToModel(ProductEntity)` (línea ~493) pasa `Kind`.
  - `Seed` (línea ~451) fija `Kind` en los productos de siembra.
  - `FindOrCreateProduct(string productName, string? category)` (línea ~425) recibe el `PurchaseKind`
    de la línea. Un producto nuevo toma `Unit` si la línea es `Unit`, `Bag` si no. Uno existente con otro
    tipo lanza `InvalidOperationException("El producto {nombre} es de piezas.")` (o «de bultos»).
  - `QuoteSaleUnsafe` (línea ~322) y la validación de `RegisterSaleBatch` (línea ~209) lanzan
    `InvalidOperationException("{nombre} se vende por pieza.")` para `Bag`/`Kg` sobre un `Unit`, y
    «{nombre} se vende por bulto o por kilo.» para `Piece` sobre un `Bag`. Así se distingue del «no hay
    inventario» (que sigue siendo `null`).
  - Nuevo `GetPurchaseDefaults()`: por producto, el lote más reciente por `PurchasedAt`. Si es `Bag`, sale
    de `BagLots` (`MarkedKg`, `SalePriceBag`, `SalePriceKg`). Si es `Unit`, sale de `UnitLots`
    (`SalePriceBag` = `SalePricePiece`, sin kg). Solo productos con al menos un lote.
- **`Controllers/SalesController.cs`:** `Quote` gana el `try/catch (InvalidOperationException)` →
  `BadRequest(new { message })`, como ya tiene `RegisterBatch`. El `null` sigue respondiendo
  `NotFound(new { message = "No hay inventario suficiente." })`.
- **`Controllers/ProductsController.cs`:** `[HttpGet("purchase-defaults")]` → `store.GetPurchaseDefaults()`.
- **`PurchasesController.Register`:** ya convierte `InvalidOperationException` en `400 { message }`; no
  cambia.
- **Pruebas en `tests/BackendAba.Tests`:**
  - `Services/PosStorePurchaseTests.cs`: el tipo al crear y la compra con otro tipo.
  - `Services/PosStoreSaleTests.cs`: modo que no corresponde, en la cotización y en el lote.
  - `Services/PosStoreCatalogTests.cs`: `GetPurchaseDefaults` toma el lote más reciente.
  - `Api/ApiTests.cs`: `kind` en `GET /api/products`, `GET /api/products/purchase-defaults`, y el `400`
    de quote y de purchases.

### Front (`a.b.a-front`)

- **`core/pos.models.ts`:** `Product` gana `kind: 'bag' | 'unit'`, y hay una interfaz nueva
  `ProductPurchaseDefaults`.
- **`core/pos-api.service.ts`:** nuevo `getPurchaseDefaults()`, con su prueba en `pos-api.service.spec.ts`.
- **Nuevo `core/notify/`:**
  - `notification.service.ts`: la clase abstracta `Notifier` (`success`, `error`, `confirm`, `prompt`,
    `choice`, que devuelven `Promise`) y `SwalNotifier`.
  - `connection.interceptor.ts`: un `HttpInterceptorFn` que con `status === 0` avisa una sola vez,
    controlado por una bandera.
  - Sus `*.spec.ts`.
- **`main.ts`:** `provideHttpClient(withInterceptors([connectionInterceptor]))` y
  `{ provide: Notifier, useClass: SwalNotifier }`.
- **Estilos:** nuevo `src/assets/layout/_notifications.scss` (colores de SweetAlert2 con `--brand` y
  `--danger`), importado donde se importan los demás parciales de `layout/`, más
  `@import 'sweetalert2/dist/sweetalert2.css'` o su equivalente en `angular.json` `styles`.
- **`features/purchases/`:**
  - `store/purchases.effects.ts`: `loadProducts$` suma `purchaseDefaults: this.api.getPurchaseDefaults()`
    a su `forkJoin`.
  - Acciones, reducer, selectors y `purchases.store.ts` exponen `purchaseDefaults()`.
  - `purchases-page.component.ts`:
    - El autollenado se dispara en el `valueChanges` del `productName` de cada línea (suscribir en
      `createLine()` o al agregar la línea) y aplica `patchValue` más `kind.disable()`.
    - `save()` ya usa `getRawValue()`; verificar que `kind` viaje.
    - Se quitan `message()`, `expenseMessage()` y sus `<p class="notice">`, y se avisa con `Notifier`.
- **`features/sales/`:**
  - `store/sales.effects.ts`: `load$` suma `inventory: this.api.getInventory()`.
  - El estado y la fachada exponen `productKind(id)` y `stock(id)`.
  - `sales-page.component.ts`:
    - `modesFor(kind)`, y el `<select formControlName="mode">` recorre esos modos.
    - Al cambiar `productId`, corrige el modo si ya no aplica.
    - La existencia se muestra con `common.units.*`.
    - El ticket muestra la unidad con un mapa `bag | kg | piece` → `sales.quantity.*`, con plural.
    - `TicketPreview` gana `seller`.
    - `message()` se reemplaza por avisos; el `window.confirm` por `notifier.choice` («Ver ticket» y
      «Nueva venta»); el borrado de un ticket por `notifier.confirm`.
- **`core/sales-auth.guard.ts`:**
  - `window.prompt` → `from(notifier.prompt({ title, secret: true }))`.
  - `window.alert` → `notifier.error(...)`.
  - Sigue devolviendo `Observable<boolean | UrlTree>`.
- **`features/history/history-page.component.ts`:** la cantidad vendida usa el mismo mapa de unidades;
  hoy es un ternario `'kg' ? … : 'bulto'`.
- **`es.json`:** claves nuevas en `notifications.*`, `sales.quantity.bags`/`pieces` y `sales.stock.*`, y
  se quitan las que queden huérfanas (`sales.messages.*` que ya no se usen). `npm run i18n:check` lo
  vigila.
- **README:** `features/purchases`, `features/sales`, `features/history` y `e2e/README.md`, más la receta
  de diálogos de `.claude/skills/qa-playwright/SKILL.md`.
- **E2E:**
  - Nueva `e2e/compras-ventas-guiadas/`, que se escribe **primero** y se ve fallar (tarea 2.1). Usa el
    «Comedero para pollo 3 kg» de `PROVEEDORES.accesoriosBajio` en `e2e/support/catalogo.ts`.
  - Nueva `e2e/support/avisos.ts`.
  - Adaptar `e2e/ventas/` (hoy contesta `window.prompt`/`confirm` con `page.on('dialog')`) y `e2e/i18n/`.

## Contrato (JSON camelCase; enums como texto camelCase por `JsonStringEnumConverter`)

```json
GET /api/products
[{ "id": "…", "name": "Comedero para pollo 3 kg", "category": "Comedero", "minBags": 0, "kind": "unit" }]

GET /api/products/purchase-defaults
[{ "productId": "…", "name": "Alimento pollo de engorda Malta Cleyton 40 kg", "kind": "bag",
   "category": "Alimento", "markedKg": 40, "salePriceBag": 650, "salePriceKg": 17.5 },
 { "productId": "…", "name": "Comedero para pollo 3 kg", "kind": "unit",
   "category": "Comedero", "markedKg": null, "salePriceBag": 75, "salePriceKg": null }]

GET /api/sales/quote?productId=<comedero>&unit=bag&quantity=1
400 { "message": "Comedero para pollo 3 kg se vende por pieza." }

POST /api/purchases  (línea kind "bag" para un producto "unit")
400 { "message": "El producto Comedero para pollo 3 kg es de piezas." }
```

## Decisiones y trampas

- **Así está hoy el back:**
  - Vender un comedero por bulto ya falla: `FindSaleLot` no encuentra lote y `quote` responde `404`
    («No hay inventario suficiente.»). El defecto visible es que la pantalla ofrece el modo.
  - `FindOrCreateProduct` ignora la categoría de un producto existente; con el tipo pasa igual.
- **«Venta bulto/u.»:** en Compras es el precio de la pieza para `unit`, y se envía como `salePriceBag`
  (y `salePriceKg` igual). `purchase-defaults` lo devuelve en `salePriceBag`.
- **El vendedor en el ticket:** el backend lo guarda dentro de `customer` («… | Vendedor: Ana»). El
  ticket debe mostrar el vendedor activo guardado en `TicketPreview`, no partir ese texto.
- **SweetAlert2 11.26** está en `package.json` sin usarse. Su CSS debe cargarse; sin él los diálogos
  salen sin estilo.
- **Impresión del ticket:** el `@media print` de `sales-page.component.ts` oculta todo menos
  `.ticket-overlay`. Hay que revisar que el contenedor de SweetAlert2 no se imprima.
- **i18n:** todo texto nuevo va a `es.json`. Las etiquetas devuelven la clave; los textos con datos se
  traducen con `instant()`; los mensajes del backend se muestran tal cual. Las pruebas comparan con
  `t()`, y los componentes y el guard agregan `provideI18n()` a su `TestBed`.
- **Pruebas unitarias:** sustituyen `Notifier` con un doble (`{ provide: Notifier, useValue: … }`). Nada
  de `window.prompt`/`confirm` en las pruebas nuevas.
- **QA:** al empezar puede haber un `dotnet run` del back con el código de `dev` en `:5028`. Detenlo
  antes de la QA para que Playwright levante el de esta rama, o la QA prueba el código viejo.
- **Datos:** `aba.db` es de prueba (D-06). La migración se aplica sola al arrancar (`db.Database.Migrate()`
  en `Program.cs`).

## Compuertas

- **Front:** `npm run build` (incluye `logs:check` e `i18n:check`), `npm test` y
  `npx tsc -p e2e/tsconfig.json`.
- **Back:** `dotnet build` y `dotnet test`, dentro de `../a.b.a-back`.
- **E2E:** `npm run test:e2e` con la skill `qa-playwright` (tarea 7.2).
- **OpenSpec:** `openspec validate guiar-compras-y-ventas-por-producto --strict`. Ojo, por P-26,
  `openspec` no lee `openspec/config.yaml`. Las reglas de tareas están en `CLAUDE.md`.
- **`docs/PENDIENTES.md`:** cerrar P-19, dejar en P-16, P-20 y P-21 solo lo pendiente, y registrar lo que
  aparezca.

## Rama y flujo

- **Ramas:**
  - Front: `dev-feat-compras-ventas-guiadas`, apilada sobre `dev-feat-i18n-espanol` (P-28; su PR va
    después del de i18n).
  - Back: `dev-feat-compras-ventas-guiadas`, desde `origin/dev`.
- **Implementar:** `/opsx:apply` sobre `openspec/changes/guiar-compras-y-ventas-por-producto/`, con un
  commit por repo por unidad de trabajo.
- **Cerrar:** `/opsx:archive` antes del PR. Pregunta antes de hacer push o abrir PR (`gh` no está
  instalado en esta laptop: el PR se abre desde el enlace de GitHub).

## Fuera de alcance

- **Resto de P-20:** buscador de producto, botones de billetes, atajos de teclado, ocultar costo y
  ganancia, editar y juntar líneas del carrito.
- **Resto de P-21:** costo unitario, ganancia esperada, proveedor nuevo desde el campo y resumen antes de
  guardar.
- **Resto de P-16:** indicadores de carga.
- **Otras pantallas:** Historial con varias líneas y filtros (P-25), mínimos (P-17) y gastos en su propio
  menú (P-22).
- **Otros pendientes:** P-26 (YAML de `config.yaml`) y P-27 (ortografía de los datos guardados).
