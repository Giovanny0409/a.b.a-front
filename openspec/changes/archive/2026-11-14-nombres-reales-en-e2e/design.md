## Context

`e2e/support/test-data.ts` genera `PW_<marca>_<sufijo>` para que cada corrida cree productos nuevos y la
suite pueda comparar valores absolutos (3 bultos, 5 piezas). El back busca productos y proveedores por
nombre (trim, sin mayúsculas) y los reutiliza, así que con nombres fijos cada corrida suma al mismo
producto. El formulario de Compras lleva un solo proveedor por compra.

## Goals / Non-Goals

**Goals:** datos con aspecto real; cubrir la misma mercancía de dos marcas y proveedores; pruebas que pasen
en cualquier corrida.

**Non-Goals:** limpiar la base (P-08); suites de otras pantallas.

## Decisions

**D1. Catálogo fijo.** `e2e/support/catalogo.ts` exporta `PROVEEDORES` (Malta Cleyton, Purina y
Accesorios Pecuarios del Bajío, con teléfono) y `PRODUCTOS` (Alimento pollo de engorda Malta Cleyton 40 kg,
Alimento pollo de engorda Purina 40 kg —ambos `Alimento`, 40 kg por bulto, con sus costos y precios— y
Comedero para pollo 3 kg, por pieza). La marca va en el nombre del producto porque el back identifica el
producto por nombre: así las dos marcas quedan como productos distintos.

**D2. Verificación por diferencia.** `e2e/support/api.ts` lee `GET /api/inventory` con `page.request` y
devuelve los bultos sellados y las piezas de un producto por nombre (0 si no existe). La prueba lee el
antes, compra, y espera `antes + comprado` en la tabla de Inventario. La compra se verifica también en
`GET /api/purchases`: el registro más reciente de cada producto trae su `supplierName` y `supplierPhone`.

**D3. Tres compras en serie en una sola prueba.** Una por proveedor, porque el formulario lleva un solo
proveedor; el formulario reinicia las líneas tras guardar, así que la misma página sirve para las tres.

## Risks / Trade-offs

- [Alguien compra a mano esos mismos productos durante la corrida] → la diferencia saldría distinta; con un
  solo worker y la base de prueba es improbable.
- [El inventario de esos productos crece con cada corrida] → aceptado (D-06); se limpia en P-08.
