# purchases Specification

## Purpose

Cubre cómo se registra en el backend la compra de bultos y de productos varios (correas, vitaminas, comederos, bebederos, jaulas, etc.) para una forrajería, incluyendo dar de alta un producto nuevo desde el propio formulario de compra y conservar el contacto del proveedor.

## Requirements

### Requirement: Registrar compra de bultos
El sistema SHALL permitir registrar una línea de compra de tipo bulto (`kind: bag`) indicando kilos marcados, costo de compra, y precio de venta por bulto y por kilo. Si el producto indicado por nombre no existe todavía en el catálogo, el sistema SHALL crearlo como parte del mismo registro de compra, usando el nombre y la categoría capturados en la línea.

#### Scenario: Compra de bultos de un producto existente
- **WHEN** se registra una compra con una línea `kind: bag` cuyo `productName` coincide con un producto ya existente
- **THEN** se crea un nuevo lote (`BagLot`) asociado a ese producto, sin duplicar el producto en el catálogo

#### Scenario: Compra de bultos de un producto nuevo
- **WHEN** se registra una compra con una línea `kind: bag` cuyo `productName` no existe en el catálogo
- **THEN** el sistema crea el producto con el nombre y categoría indicados y registra el lote de bultos contra ese producto nuevo

### Requirement: Registrar compra de productos varios
El sistema SHALL permitir registrar una línea de compra de tipo producto vario (`kind: unit`) indicando cantidad de piezas, costo de compra y precio de venta por pieza, sin exigir kilos marcados. Igual que con bultos, si el producto no existe se crea al vuelo.

#### Scenario: Compra de productos varios de un producto nuevo
- **WHEN** se registra una compra con una línea `kind: unit`, cantidad de piezas y precio de venta por pieza, para un producto que no existe en el catálogo
- **THEN** el sistema crea el producto y suma la cantidad comprada al inventario de piezas de ese producto

### Requirement: Persistir proveedor con nombre y teléfono
El sistema SHALL guardar el proveedor (nombre y teléfono) capturado al registrar una compra, y SHALL reutilizar el proveedor existente cuando el nombre ya está registrado en vez de crear un duplicado.

#### Scenario: Alta de un proveedor nuevo al registrar una compra
- **WHEN** se registra una compra con un nombre de proveedor que no existe todavía
- **THEN** el sistema guarda un nuevo proveedor con ese nombre y teléfono, y la compra queda asociada a él

#### Scenario: Reutilizar un proveedor ya registrado
- **WHEN** se registra una compra con un nombre de proveedor que ya existe en el catálogo de proveedores
- **THEN** el sistema asocia la compra al proveedor existente y no crea un registro duplicado
