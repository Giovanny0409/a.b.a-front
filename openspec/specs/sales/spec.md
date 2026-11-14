# sales Specification

## Purpose

Cubre la venta de productos varios por pieza (correas, comederos, bebederos, jaulas, etc.), que una venta en lote no venda más inventario del que hay, el vendedor activo con el que se cobra, los modos de venta según el tipo del producto, la existencia a la vista, el ticket con la unidad real y el vendedor, y los diálogos propios para el ID y el fin de venta. La venta por bulto y por kilo en sí aún no está documentada aquí.
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

### Requirement: Modos de venta según el tipo del producto
Ventas SHALL ofrecer solo los modos que corresponden al tipo del producto elegido: un producto `unit`
(pieza) solo «Por pieza»; un producto `bag` (bulto) «Por bulto», «Por kilo» y «Por pesos». Al cambiar de
producto, el modo SHALL pasar al primero que le corresponde. El backend SHALL rechazar una cotización o una
venta cuyo modo no corresponde al tipo del producto, con un mensaje que lo diga.

#### Scenario: Un comedero solo se vende por pieza
- **WHEN** se elige en Ventas el «Comedero para pollo 3 kg» (tipo `unit`)
- **THEN** el modo de venta solo ofrece «Por pieza» y ya está seleccionado

#### Scenario: Un alimento se vende por bulto, kilo o pesos
- **WHEN** se elige un alimento de 40 kg (tipo `bag`)
- **THEN** el modo de venta ofrece «Por bulto», «Por kilo» y «Por pesos», y no «Por pieza»

#### Scenario: El backend rechaza un modo que no corresponde
- **WHEN** se pide al backend vender un producto `unit` por bulto
- **THEN** responde `400` con un mensaje que dice que ese producto se vende por pieza, y no registra la venta

### Requirement: Existencia del producto a la vista
Ventas SHALL mostrar la existencia del producto elegido antes de cotizar: bultos sellados y kg abiertos para
un producto `bag`, piezas para uno `unit`.

#### Scenario: Ver la existencia al elegir
- **WHEN** se elige un producto con 3 piezas en existencia
- **THEN** Ventas muestra «3 piezas» junto al producto

### Requirement: Ticket con la unidad y el vendedor
El ticket de una venta SHALL mostrar cada línea con su unidad real («1 pieza», «2 bultos», «2.5 kg») y el
nombre del vendedor que la cobró. El Historial SHALL mostrar la cantidad vendida con la misma unidad.

#### Scenario: Ticket de una pieza
- **WHEN** se cobra 1 «Comedero para pollo 3 kg» por pieza y se abre el ticket
- **THEN** la línea dice «1 pieza» y no «bulto», y el ticket muestra al vendedor

#### Scenario: Historial de una venta por pieza
- **WHEN** se abre el Historial después de esa venta
- **THEN** su cantidad dice «1 pieza»

### Requirement: Fin de venta y vendedor con diálogos propios
El ID de vendedor SHALL pedirse en un diálogo propio de la app, con el campo oculto mientras se escribe.
Al cobrar, la app SHALL avisar «Venta cobrada» con el total y el cambio, y ofrecer «Ver ticket» y «Nueva
venta» en el mismo aviso, en lugar de preguntar con un diálogo del navegador.

#### Scenario: Pedir el ID de vendedor
- **WHEN** se entra a Ventas sin vendedor activo
- **THEN** aparece el diálogo de la app con el campo del ID oculto, y al aceptar un ID válido entra a Ventas

#### Scenario: Cobrar y ver el ticket
- **WHEN** se cobra una venta y se elige «Ver ticket»
- **THEN** se abre el ticket de esa venta

#### Scenario: Cobrar sin ticket
- **WHEN** se cobra una venta y se elige «Nueva venta»
- **THEN** el carrito queda vacío y no se abre el ticket
