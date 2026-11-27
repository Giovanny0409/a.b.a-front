## Why

Las pruebas E2E llenan la base con productos y proveedores como `PW_mwg23e0p_bulto`, que no se parecen a
lo que vende la forrajería y vuelven la app inútil para revisarla a mano o enseñarla. Además no prueban un
caso real del negocio: el mismo alimento (pollo de engorda) se compra en dos marcas a dos proveedores, y
cada uno debe quedar como producto aparte con su proveedor.

## What Changes

- Nuevo catálogo de prueba `e2e/support/catalogo.ts` con productos y proveedores reales: alimento para pollo
  de engorda de dos marcas, cada una de su proveedor, y un accesorio vendido por pieza.
- Los nombres son fijos: cada corrida suma inventario a los mismos productos, así que las pruebas verifican
  por diferencia (lo que había antes contra lo que hay después), leyendo el antes por la API.
- La suite `e2e/compras-inventario/` registra tres compras, una por proveedor, y verifica que los dos
  alimentos de engorda quedan como productos distintos, cada uno con su proveedor y su inventario.
- Se quita `e2e/support/test-data.ts` (`PW_<marca>`), y se actualizan `e2e/README.md`, la skill
  `qa-playwright` y los registros que lo mencionan.

## Capabilities

### New Capabilities
_(ninguna)_

### Modified Capabilities
- `e2e-qa`: los datos de prueba usan nombres reales fijos y las verificaciones son por diferencia; la
  suite de compras cubre la misma mercancía de dos marcas y proveedores.

## Impact

- Front (`a.b.a-front`): `e2e/support/`, `e2e/compras-inventario/`, `e2e/README.md`,
  `.claude/skills/qa-playwright/SKILL.md`, `docs/PENDIENTES.md`.
- Datos: `aba.db` acumula compras de los mismos productos reales en cada corrida; sigue siendo de prueba
  hasta la entrega (D-06) y se limpia en P-08.
- Rama: `dev-test-nombres-reales-e2e`, apilada sobre `dev-fix-e2e-esperar-backend` (P-06).
