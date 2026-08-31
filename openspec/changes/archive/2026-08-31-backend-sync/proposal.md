## Why

El frontend (`aba-punto-venta`) ya asume un contrato que el backend (`backend aba`, ASP.NET Core 9 + EF Core + SQLite en `C:\Users\carte\OneDrive\Desktop\backend aba`) no cumple: el teléfono del proveedor que se captura en compras nunca se guarda, no existe forma de registrar "productos varios" (correas, vitaminas, comederos, etc.) ni de dar de alta un producto nuevo desde el formulario de compra, y no existe ningún endpoint de gastos aunque el frontend ya llama a `GET/POST /api/expenses`. Además el backend sigue arrastrando campos que el frontend ya no usa (`RealKg`, `RealKgTotal`), y el inventario de piezas (`quantityTotal`) que la pantalla de inventario necesita no tiene equivalente en el backend. Adicionalmente, aunque una compra pueda dejar registrados productos varios en el inventario, hoy no existe ninguna forma de venderlos (`SaleUnit` solo entiende `Bag`/`Kg`, tanto en el backend como en `sales-page.component.ts`) — sin eso, el inventario de piezas nunca bajaría y la futura alerta de stock mínimo para esos productos no tendría sentido. Hay que cerrar esta brecha antes de construir encima (umbral mínimo editable, alerta de stock bajo, gastos de insumos) porque todas dependen de que compras, ventas, inventario y gastos respondan con datos reales y completos.

## What Changes

- **BREAKING** (contrato del backend, consumido solo por este frontend): `RegisterPurchaseRequest` deja de aceptar únicamente bultos de un producto existente; soporta líneas de compra de tipo `bag` o `unit`, con `productName`/`category` de texto libre para dar de alta el producto si no existe todavía.
- Se agrega persistencia de `Supplier` (nombre + teléfono) en vez del string libre actual; las compras referencian un proveedor guardado.
- Se agrega `ExpensesController` (`GET/POST /api/expenses`) respaldado por `ExpenseRecord` con su `area` (`general`/`guardadito`/`camioneta`), tal como ya lo espera `pos-api.service.ts`.
- Se elimina `RealKg` de `BagLot` y `PurchaseRecord`, y `RealKgTotal` de `InventoryItem` (huérfanos: el frontend ya no los tiene).
- `InventoryItem` incorpora `QuantityTotal` (piezas) para productos que se venden por unidad, no por bulto/kg.
- `SaleUnit` agrega un tercer valor (`piece`) para vender productos varios por pieza, descontando del inventario de piezas igual que una venta de bulto/kg descuenta de un lote.
- El formulario de venta (`sales-page.component.ts`) agrega el modo "Por pieza" junto a los existentes ("Por bulto", "Por kilo", "Por pesos").
- Se limpia `PosStore.cs` y cualquier lógica que dependa de los campos removidos.

_Nota: se confirmó que `dashboard-page.component.ts` calcula su resumen en el cliente a partir de inventario/lotes/ventas/gastos (`dashboard.selectors.ts`) y no consume `DashboardController`/`DashboardSummary` del backend. Ese endpoint queda fuera de alcance de este change; una vez que `expenses` exista, el tablero funcionará correcto sin tocar el backend de tablero._

## Capabilities

### New Capabilities
- `purchases`: registrar compras de bultos y de productos varios, dar de alta un producto nuevo desde el formulario de compra, y persistir proveedor (nombre + teléfono).
- `expenses`: registrar y consultar gastos de insumos por área (general/guardadito/camioneta), como base para descontarlos de las ganancias.
- `inventory`: forma correcta y sin campos huérfanos del inventario neto, incluyendo piezas de productos varios.
- `sales`: venta de productos varios por pieza, descontando del inventario correspondiente.

### Modified Capabilities
_(ninguna — es el primer change de este repo, no hay specs previos que modificar)_

## Impact

- Backend (`backend aba`): `Models/DomainModels.cs`, `Models/Requests.cs`, `Controllers/PurchasesController.cs`, `Controllers/SalesController.cs`, nuevo `Controllers/ExpensesController.cs`, `Services/PosStore.cs`, `Data/AppDbContext.cs` (nuevas tablas `Supplier` y `UnitLot`, migración de EF Core).
- Frontend (`aba-punto-venta`): `core/pos.models.ts` / `core/pos-api.service.ts` (nuevo `SaleUnit: 'piece'`), `features/purchases/**` (persistencia real del proveedor), `features/sales/**` (modo "Por pieza").
- No afecta tablero ni autenticación de vendedores — quedan fuera de alcance de este change (el tablero ya calcula todo en el cliente a partir de los endpoints existentes, y `AuthorizeSeller` no cambia).
