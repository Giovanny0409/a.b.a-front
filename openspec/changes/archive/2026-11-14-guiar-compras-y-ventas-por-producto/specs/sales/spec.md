## ADDED Requirements

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
