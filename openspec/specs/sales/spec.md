# sales Specification

## Purpose

Cubre la venta de productos varios por pieza (correas, comederos, bebederos, jaulas, etc.), que una venta en lote no venda más inventario del que hay, y el vendedor activo con el que se cobra. La venta por bulto y por kilo aún no está documentada aquí.
## Requirements
### Requirement: Vender un producto vario por pieza
El sistema SHALL permitir registrar una línea de venta por pieza (`unit: piece`) para un producto vario, descontando la cantidad vendida del inventario de piezas disponible de ese producto.

#### Scenario: Venta de piezas con inventario suficiente
- **WHEN** se registra una venta con una línea `unit: piece` y una cantidad menor o igual a las piezas disponibles del producto
- **THEN** el sistema registra la línea de venta con su costo y ganancia, y el inventario de piezas de ese producto baja en la cantidad vendida

#### Scenario: Venta de piezas sin inventario suficiente
- **WHEN** se intenta registrar una venta con una línea `unit: piece` cuya cantidad supera las piezas disponibles del producto
- **THEN** el sistema rechaza la venta sin registrar ninguna línea ni descontar inventario

### Requirement: Una venta en lote no vende más inventario del que hay
El sistema SHALL aplicar las líneas de una venta en lote una tras otra sobre el inventario ya descontado
por las anteriores, de modo que la suma de las líneas de un mismo producto nunca exceda sus bultos, kilos
o piezas disponibles. Si alguna línea no alcanza, el sistema SHALL rechazar la venta completa sin
registrar ninguna línea ni descontar inventario.

#### Scenario: Dos líneas de un bulto con un solo bulto en existencia
- **WHEN** se registra una venta con dos líneas `unit: bag` de 1 bulto del mismo producto y solo hay un bulto sellado
- **THEN** el sistema rechaza la venta con «No hay inventario suficiente para esta venta.», no registra la venta y el bulto sigue sellado

#### Scenario: Dos líneas de kilos que exceden el bulto
- **WHEN** se registra una venta con dos líneas `unit: kg` de 30 kg del mismo producto y solo hay un bulto de 40 kg
- **THEN** el sistema rechaza la venta y el bulto conserva sus 40 kg

#### Scenario: Dos líneas de piezas que exceden las disponibles
- **WHEN** se registra una venta con dos líneas `unit: piece` de 6 piezas del mismo producto y hay 10 piezas
- **THEN** el sistema rechaza la venta y siguen las 10 piezas

#### Scenario: Dos líneas del mismo producto que sí alcanzan
- **WHEN** se registra una venta con dos líneas `unit: bag` de 1 bulto del mismo producto y hay dos bultos sellados
- **THEN** el sistema registra la venta con las dos líneas, cada una sobre un bulto distinto, y no quedan bultos sellados

### Requirement: Vendedor activo visible y cambiable
Para entrar a Ventas el sistema SHALL pedir el ID de vendedor y validarlo con el backend; con un ID
desconocido SHALL avisar y regresar al Tablero. Mientras haya un vendedor activo, Ventas SHALL mostrar su
nombre y no SHALL volver a pedir el ID al salir y volver a la pantalla. Ventas SHALL ofrecer «Cambiar
vendedor», que quita al vendedor activo y vuelve a pedir el ID sin recargar la aplicación ni perder los
tickets guardados. Toda venta SHALL registrarse a nombre del vendedor activo al momento de cobrar.

#### Scenario: ID desconocido
- **WHEN** se entra a Ventas y se escribe un ID que no es de ningún vendedor
- **THEN** el sistema avisa «ID de vendedor no autorizado.» y regresa al Tablero

#### Scenario: El vendedor cobra a su nombre
- **WHEN** Aurelio entra con su ID y cobra una venta
- **THEN** Ventas muestra «Vendedor: Aurelio» y la venta queda registrada a nombre de Aurelio

#### Scenario: Salir y volver conserva al vendedor
- **WHEN** el vendedor activo sale de Ventas y vuelve a entrar
- **THEN** el sistema no vuelve a pedir el ID y sigue mostrando al mismo vendedor

#### Scenario: Cambiar de vendedor
- **WHEN** con Aurelio activo se pulsa «Cambiar vendedor» y se escribe el ID de Ana
- **THEN** Ventas muestra «Vendedor: Ana», conserva los tickets guardados, y la siguiente venta queda a nombre de Ana

#### Scenario: Cancelar el cambio de vendedor
- **WHEN** se pulsa «Cambiar vendedor» y se cancela el ID
- **THEN** el sistema regresa al Tablero sin vendedor activo, y al volver a Ventas pide el ID

