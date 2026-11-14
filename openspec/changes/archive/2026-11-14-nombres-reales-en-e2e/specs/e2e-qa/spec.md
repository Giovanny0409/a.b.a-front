## REMOVED Requirements

### Requirement: Datos de prueba reconocibles y sin colisiones
**Reason**: los nombres `PW_<marca>` no se parecen a la mercancía real y llenan la base de datos sin sentido para el negocio.
**Migration**: las suites usan el catálogo de `e2e/support/catalogo.ts` y verifican por diferencia (ver «Datos de prueba con nombres reales»).

### Requirement: Suite piloto de compra a inventario
**Reason**: se reemplaza por una suite que cubre el caso real de la misma mercancía de dos marcas y proveedores.
**Migration**: ver «Compras de la misma mercancía con dos proveedores».

## ADDED Requirements

### Requirement: Datos de prueba con nombres reales
Las suites SHALL crear sus datos con los productos y proveedores del catálogo `e2e/support/catalogo.ts`,
con nombres como los que maneja la forrajería. Como los nombres se repiten entre corridas, toda
verificación de inventario SHALL compararse contra lo que había antes de la prueba, leído por la API, y
nunca contra un valor absoluto.

#### Scenario: Dos corridas seguidas
- **WHEN** la suite de compras corre dos veces seguidas contra la misma `aba.db`
- **THEN** las dos pasan, y después de la segunda cada producto del catálogo tiene el inventario de las dos compras sumado

### Requirement: Compras de la misma mercancía con dos proveedores
La batería SHALL incluir la suite `e2e/compras-inventario/`, que registra desde Compras una compra por
proveedor: alimento para pollo de engorda de una marca a su proveedor, el mismo alimento de otra marca a
otro proveedor, y un accesorio por pieza a un tercero. SHALL verificar el cuerpo y la respuesta de cada
`POST /api/purchases`, que en Inventario cada producto sube exactamente lo comprado, y que la API registra
cada compra con su proveedor.

#### Scenario: Pollo de engorda de dos marcas
- **WHEN** se compran 3 bultos del alimento de una marca a su proveedor y 2 bultos del de la otra marca a otro proveedor
- **THEN** Inventario muestra dos productos distintos, uno con 3 bultos sellados más y otro con 2 más, y cada compra queda con el nombre y teléfono de su proveedor

#### Scenario: Accesorio por pieza
- **WHEN** se compran 5 piezas del accesorio a su proveedor
- **THEN** Inventario muestra 5 piezas más de ese producto
