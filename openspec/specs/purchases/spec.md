# purchases Specification

## Purpose

Cubre cómo se registra en el backend la compra de bultos y de productos varios (correas, vitaminas, comederos, bebederos, jaulas, etc.) para una forrajería, incluyendo dar de alta un producto nuevo desde el propio formulario de compra, conservar el contacto del proveedor, el tipo fijo del producto (bulto o pieza) y el autollenado de la línea con la última compra.

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

### Requirement: El producto tiene un tipo fijo
Cada producto SHALL tener un tipo: `bag` (bulto) o `unit` (pieza). El tipo SHALL fijarse en la primera
compra del producto, y el backend SHALL rechazar una compra que registre un producto existente con otro
tipo. Los productos que ya existían SHALL quedar con el tipo de sus lotes: `unit` si solo tienen lotes de
piezas, `bag` en otro caso.

#### Scenario: Primera compra fija el tipo
- **WHEN** se compra por primera vez un producto como «Varios»
- **THEN** el producto queda con tipo `unit` y `GET /api/products` lo devuelve así

#### Scenario: Compra con otro tipo
- **WHEN** se registra como «Bultos» un producto que es `unit`
- **THEN** el backend responde `400` con un mensaje que dice que ese producto es de piezas, y no registra la compra

#### Scenario: Productos existentes
- **WHEN** se aplica la migración sobre una base donde el comedero solo tiene lotes de piezas y el alimento lotes de bulto
- **THEN** el comedero queda `unit` y el alimento `bag`

### Requirement: Autollenado de la línea con la última compra
Compras SHALL autollenar la línea de un producto existente: al escribir su nombre (sin importar
mayúsculas), la línea se llena con su tipo, que queda fijo, su categoría, sus kg por bulto y sus últimos precios de venta
(por bulto o unidad y por kilo), tomados de `GET /api/products/purchase-defaults`. La cantidad y el costo
SHALL quedarse como los capture la persona. Un nombre nuevo SHALL dejar la línea editable y sin cambios.

#### Scenario: Producto existente
- **WHEN** se escribe «comedero para pollo 3 kg» en una línea
- **THEN** el tipo queda en «Varios» sin poder cambiarse, la categoría y el precio de venta se llenan con los de su última compra, y la cantidad y el costo no cambian

#### Scenario: Producto nuevo
- **WHEN** se escribe un nombre que no existe
- **THEN** el tipo se puede elegir y la categoría y los precios no se llenan
