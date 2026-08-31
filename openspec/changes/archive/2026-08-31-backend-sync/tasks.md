## 1. Base de datos: proveedor persistente y limpieza de campos huérfanos

- [x] 1.1 Agregar `SupplierEntity {Id, Name, Phone}` con su `DbSet` y configuración en `AppDbContext`, y verificar que `dotnet build` compila sin errores.
- [x] 1.2 Quitar `RealKg` de `BagLot`/`BagLotEntity`/`PurchaseRecord`/`PurchaseEntity` y `RealKgTotal` de `InventoryItem`, junto con su configuración en `AppDbContext`; en `QuoteSaleUnsafe`, cambiar `costPerKg = lot.PurchaseCost / lot.RealKg` por `lot.MarkedKg`. Verificar que `dotnet build` compila y que no queda ninguna referencia a `RealKg`/`RealKgTotal` en el proyecto (`grep -ri realkg`).

## 2. Compras: proveedor, bultos y productos varios

- [x] 2.1 Reemplazar `RegisterPurchaseRequest`/`PurchaseBagRequest` en `Requests.cs` por `{ Supplier: {Name, Phone}, Lines: PurchaseLineRequest[] }`, donde cada línea tiene `Kind (bag|unit)`, `ProductName`, `Category`, `Quantity`, `MarkedKg?`, `PurchaseCost`, `SalePriceBag`, `SalePriceKg?`. Verificar que `dotnet build` compila.
- [x] 2.2 En `PosStore.RegisterPurchase`: resolver o crear el `Supplier` por nombre (trim, case-insensitive), resolver o crear el `Product` por nombre igual, y crear `BagLotEntity` para líneas `kind: bag` o `UnitLotEntity` (ver tarea 3.1) para líneas `kind: unit`. Verificado con `curl` (backend real corriendo) registrando una compra con una línea de bulto de producto nuevo y una línea de producto vario nuevo en el mismo request: ambos productos y el proveedor se crearon correctamente, y devolvió un `PurchaseRecord` por línea.
- [x] 2.3 Ajustar `PurchasesController` a la nueva forma del request si cambia la firma del método. `POST /api/purchases` responde 200 con el nuevo shape (arreglo de `PurchaseRecord`).
- [x] 2.4 Confirmar que `purchases.effects.ts`/`pos-api.service.ts` ya envían exactamente esta forma (no requieren cambio) registrando una compra real desde la UI (`ng serve`) contra el backend actualizado y verificando que no hay error 400/415. Confirmado por el usuario probando en el navegador.

## 3. Inventario de piezas y venta por pieza

- [x] 3.1 Agregar `UnitLotEntity {Id, ProductId, Supplier, PurchasedAt, Quantity, PurchaseCost, SalePricePiece, RemainingQuantity}` con su `DbSet` y configuración en `AppDbContext`, replicando el patrón de `BagLotEntity`. Verificar que `dotnet build` compila.
- [x] 3.2 Agregar `Piece` al enum `SaleUnit` (backend) y `'piece'` al tipo `SaleUnit` en `pos.models.ts` (frontend). Verificado: `GET /api/sales/quote?...&unit=piece&...` acepta y devuelve `"unit":"piece"` en el JSON.
- [x] 3.3 Extender `FindSaleLot`, `ApplySaleToInventory` y `QuoteSaleUnsafe` en `PosStore` con una rama para `Unit == Piece` que opera sobre `UnitLots` en vez de `BagLots`. Verificado con `curl`: venta de 3 piezas de un producto vario devolvió costo/ganancia correctos (costo por pieza = costo de compra del lote / cantidad del lote) y descontó `RemainingQuantity`.
- [x] 3.4 Actualizar `PosStore.GetInventory` para incluir `QuantityTotal` (suma de `RemainingQuantity` de los `UnitLots` del producto) en vez de `RealKgTotal`. Verificado: `GET /api/inventory` muestra `quantityTotal` correcto antes y después de la venta de piezas (20 → 17 tras vender 3).
- [x] 3.5 En `sales-page.component.ts`: agregar la opción `<option value="piece">Por pieza</option>` al selector de modo de venta, y la rama correspondiente en `amountLabel()`, `modeLabel()` y `quoteDetail()` (etiqueta "Piezas" / "Por pieza"). Confirmado por el usuario probando en el navegador.

## 4. Gastos de insumos

- [x] 4.1 Agregar `ExpenseEntity {Id, ExpenseAt, Concept, Category, Area, Amount, Notes?}` con su `DbSet` y configuración en `AppDbContext` (igual forma que `ExpenseRecord`). Verificar que `dotnet build` compila.
- [x] 4.2 Crear `Controllers/ExpensesController.cs` con `GET /api/expenses` y `POST /api/expenses`, devolviendo/aceptando exactamente lo que `pos-api.service.ts` ya llama. Verificado con `curl`: `POST` crea el gasto y `GET` lo lista, con la forma exacta de `ExpenseRecord`.
- [x] 4.3 Verificar manualmente en la app corriendo (`npm start`): registrar un gasto desde el panel "Compra de insumos y gastos" ya no falla, y el tablero refleja el gasto en "Gastos registrados" y en la ganancia semanal. Confirmado por el usuario probando en el navegador.

## 5. Migraciones de EF Core

- [x] 5.1 Verificar que `dotnet-ef` está instalado (`dotnet ef --version`); si no, instalarlo con `dotnet tool install --global dotnet-ef`. Agregar el paquete `Microsoft.EntityFrameworkCore.Design` al proyecto si falta.
- [x] 5.2 Con todos los cambios de modelo de las secciones 1-4 ya implementados, generar la migración base: `dotnet ef migrations add InitialSchema`. Verificar que se crean los archivos bajo `Migrations/`.
- [x] 5.3 Reemplazar `db.Database.EnsureCreated()` por `db.Database.Migrate()` en `Program.cs`. Verificar que `dotnet build` compila.
- [x] 5.4 Borrar el `aba.db` actual (solo datos de prueba, confirmado) y arrancar el backend. Verificar en el log que aplica la migración, recrea el esquema, y `PosStore.Seed` repuebla los 3 productos de demo.

## 6. Documentación (Principio 6 de CLAUDE.md)

- [x] 6.1 Crear `src/app/features/purchases/README.md` siguiendo las secciones estándar de `CLAUDE.md`, documentando la persistencia de proveedor y la compra de bultos/productos varios.
- [x] 6.2 Crear `src/app/features/sales/README.md` siguiendo las mismas secciones, documentando el nuevo modo de venta "Por pieza".

## 7. Verificación end-to-end

- [x] 7.1 Con `npm start` (backend + frontend juntos), recorrer manualmente: registrar una compra con un producto de bulto nuevo, un producto vario nuevo y un proveedor nuevo; vender una pieza del producto vario; registrar un gasto; confirmar que el tablero refleja el gasto en la ganancia y que el inventario de piezas bajó. Confirmado por el usuario ("parece funcionar").
- [x] 7.2 Ejecutar `dotnet build` (backend) y `ng build` (frontend) y verificar que ambos terminan sin errores.

## Nota de bloqueo (sesión 2026-08-31, resuelta)

El backend no arrancaba (`dotnet run` fallaba con `System.IO.FileLoadException` por una directiva de Control de aplicaciones) porque **Windows Smart App Control** bloqueaba el `.dll` recién compilado por no tener reputación conocida (confirmado en el visor de eventos, `Microsoft-Windows-CodeIntegrity/Operational`, ids 3077/3118). El usuario apagó Smart App Control y el backend arrancó correctamente: aplicó la migración `InitialSchema` sobre un `aba.db` limpio, repobló los 3 productos de demo, y todas las verificaciones en ejecución pendientes (compra de bulto + producto vario + proveedor nuevo, venta por pieza, registro de gasto, inventario) se probaron exitosamente por `curl` contra el backend real. Solo falta el recorrido manual en el navegador (tareas 2.4, 3.5, 4.3, 7.1) porque esta sesión no tiene herramienta de navegador disponible.
