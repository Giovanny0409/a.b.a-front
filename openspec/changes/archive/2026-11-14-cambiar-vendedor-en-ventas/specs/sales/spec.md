## ADDED Requirements

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
