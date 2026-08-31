## Context

Ver `proposal.md` - Why para la motivación. Detalles técnicos relevantes encontrados al explorar `backend aba`:

- El backend usa `db.Database.EnsureCreated()` en `Program.cs`, no migraciones de EF Core. `EnsureCreated()` no hace nada si el archivo de base de datos ya existe (`aba.db`), así que cualquier cambio de modelo sin migración real deja el esquema desincronizado y las queries truenan contra columnas que ya no coinciden.
- `aba.db` solo contiene datos de prueba/semilla (`PosStore.Seed`), confirmado con el usuario - no hay que preservar historial real.
- `RegisterPurchaseRequest` hoy exige un `ProductId` existente y solo registra bultos (`Bags[]`); el formulario de compra del frontend (`purchases-page.component.ts`) ya envía líneas con `kind: bag | unit`, `productName`/`category` de texto libre, y espera poder dar de alta el producto en el mismo request.
- `SaleUnit` (backend y frontend) solo tiene `Bag`/`Kg`; no existe ningún camino de venta para productos varios, aunque el frontend ya modela `PurchaseKind: 'unit'` para comprarlos.
- El patrón de inventario con costeo por lote (`BagLotEntity` + `FindSaleLot` + `QuoteSaleUnsafe`) es el único mecanismo de costeo/ganancia que existe hoy; no hay un camino alterno de "costo promedio" en ningún lado del sistema.
- No existe `ExpensesController`; `pos-api.service.ts` ya llama a `GET/POST /api/expenses` y el formulario de gasto en `purchases-page.component.ts` ya está completo y conectado a NgRx - hoy la llamada simplemente falla (`registerExpense$` recibe un error de red).

## Goals / Non-Goals

**Goals:**
- El contrato del backend coincide exactamente con lo que el frontend ya envía/espera en compras, gastos e inventario.
- Vender un producto vario por pieza funciona de punta a punta (compra -> inventario -> venta -> costo/ganancia), con el mismo patrón de costeo por lote que ya usan bultos y kilos.
- No quedan campos huérfanos (`RealKg`, `RealKgTotal`) en el backend.
- El backend pasa a usar migraciones reales de EF Core en vez de `EnsureCreated()`, para que los siguientes changes (código de barras, umbral mínimo, alertas) no vuelvan a pisar el esquema.

**Non-Goals:**
- No se toca el flujo de venta por bulto/kilo ya existente (sigue igual, solo se le agrega el modo pieza al lado).
- No se toca `DashboardController`/`DashboardSummary` del backend (confirmado que el frontend no lo consume).
- No se implementa código de barras, umbral mínimo editable ni alerta de stock bajo - quedan para los siguientes changes de la hoja de ruta.
- No hay migración de datos históricos reales (son datos de prueba, confirmado con el usuario).

## Decisions

1. **Forma de `RegisterPurchaseRequest`**: pasa de `{ProductId, Supplier, SalePriceBag, SalePriceKg, Bags[]}` a `{Supplier: {Name, Phone}, Lines[]}`, donde cada línea replica `PurchaseLineInput` del frontend (`kind`, `productName`, `category`, `quantity`, `markedKg?`, `purchaseCost`, `salePriceBag`, `salePriceKg?`). Este shape ya es exactamente lo que `purchases.effects.ts` envía hoy (`{ supplier: { name, phone }, lines: [...] }`) - **no requiere ningún cambio en el frontend**, solo que el backend deje de rechazarlo. Alternativa considerada: mantener `ProductId` y exigir un `POST /products` previo para altas - se rechaza porque duplicaría el viaje de red y rompería el formulario único de compra que ya existe en el frontend.

2. **Alta de producto al vuelo**: se busca el producto por nombre (trim, case-insensitive); si no existe, se crea con la categoría capturada y `MinBags: 0` (ajustable después, cuando exista el umbral mínimo editable). Alternativa: exigir coincidencia exacta de mayúsculas - se rechaza por ser demasiado frágil para captura manual en mostrador.

3. **Persistencia de proveedor**: nueva `SupplierEntity {Id, Name, Phone}`; se reutiliza por nombre (trim, case-insensitive) igual que los productos, ya que el formulario autocompleta el `datalist` de proveedores por nombre.

4. **Inventario de piezas con costeo por lote**: nueva `UnitLotEntity` (Id, ProductId, Supplier, PurchasedAt, Quantity, PurchaseCost, SalePricePiece, RemainingQuantity), replicando el patrón de `BagLotEntity`. `InventoryItem.QuantityTotal` suma `RemainingQuantity` de los lotes de pieza de un producto. Una venta `piece` consume del lote disponible más antiguo con suficiente `RemainingQuantity`, igual que `FindSaleLot` ya hace para bultos/kilos. Alternativa considerada: un contador simple `QuantityOnHand` + costo promedio directo en `ProductEntity`, sin lotes - más simple, pero se rechaza por romper la consistencia del sistema (sería el único tipo de inventario sin costeo por lote) y perder el historial de proveedor/costo por compra que los bultos ya tienen.

5. **`SaleUnit.Piece`**: se agrega un tercer valor al enum (serializa como `"piece"` con el `JsonStringEnumConverter` camelCase ya configurado). `RegisterSaleLineRequest`/`RegisterSaleBatchRequest` no cambian de forma - solo la lógica interna de `PosStore` (`FindSaleLot`, `ApplySaleToInventory`, `QuoteSaleUnsafe`) gana una tercera rama que apunta a `UnitLots` en vez de `BagLots` cuando `Unit == Piece`.

6. **Gastos**: `ExpenseEntity` replica `ExpenseRecord` (Id, ExpenseAt, Concept, Category, Area enum, Amount, Notes?). Nuevo `ExpensesController` con `GET`/`POST /api/expenses`, alineado exactamente con lo que `pos-api.service.ts` ya llama - no requiere ningún cambio de frontend, la UI ya existe y está conectada.

7. **Persistencia del esquema**: se reemplaza `EnsureCreated()` por migraciones reales de EF Core (`dotnet ef migrations add`, `Database.Migrate()` en el arranque). Como `aba.db` solo tiene datos de prueba (confirmado), se borra una vez y se deja que la primera migración regenere el esquema; de aquí en adelante todo cambio de esquema se entrega como una migración nueva. Alternativa: seguir con `EnsureCreated()` y pedir borrar `aba.db` a mano en cada change futuro - se rechaza por ser demasiado frágil según el sistema se acerque a uso real (alertas, código de barras, etc.).

8. **Eliminación de `RealKg`/`RealKgTotal`**: se quitan de `BagLot`, `PurchaseRecord`, `BagLotEntity`, `PurchaseEntity`, `InventoryItem` (records y entidades) y de su configuración en `AppDbContext`. Donde `RealKg` se usaba para costo por kilo (`QuoteSaleUnsafe`: `costPerKg = lot.PurchaseCost / lot.RealKg`), se usa `MarkedKg` en su lugar, que es el único peso que el frontend sigue capturando por lote.

## Risks / Trade-offs

- [Riesgo] Cambiar la forma de `RegisterPurchaseRequest` es un cambio de contrato incompatible → Mitigación: solo este frontend consume la API (sistema de un solo tenant, ambos repos se actualizan juntos en este mismo change).
- [Riesgo] Borrar `aba.db` pierde los datos actuales → Mitigación: confirmado con el usuario que son solo datos de prueba; `PosStore.Seed` repuebla productos de demo automáticamente contra el esquema nuevo.
- [Riesgo] El consumo de lotes de pieza no sigue un orden FIFO estrictamente garantizado (igual que hoy pasa con `FindSaleLot` para bultos) → Mitigación: aceptable para una forrajería pequeña con pocos lotes concurrentes; es una limitación ya existente en el patrón de bultos, no una regresión nueva.
- [Riesgo] Adoptar migraciones de EF Core requiere la herramienta `dotnet-ef` instalada en el entorno de desarrollo → Mitigación: se documenta el paso único `dotnet tool install --global dotnet-ef` en `tasks.md`.

## Migration Plan

1. Agregar el paquete `Microsoft.EntityFrameworkCore.Design` si no está ya referenciado (necesario para la herramienta `dotnet ef`).
2. Implementar los cambios de modelo/entidades descritos arriba.
3. Generar la migración base: `dotnet ef migrations add InitialSchema`.
4. Reemplazar `db.Database.EnsureCreated()` por `db.Database.Migrate()` en `Program.cs`.
5. Borrar el `aba.db` actual (solo datos de prueba, confirmado) para que la app arranque con el esquema migrado desde cero; `PosStore.Seed` repuebla los productos de demo.
6. No se requiere plan de rollback más allá de volver al commit anterior - no hay datos de producción que preservar en esta etapa.
