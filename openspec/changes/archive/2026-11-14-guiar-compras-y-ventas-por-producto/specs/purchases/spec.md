## ADDED Requirements

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
