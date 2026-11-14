## Why

Una venta en lote con dos líneas del mismo producto vende el mismo inventario dos veces (P-11): con un solo
bulto en existencia, dos líneas «1 bulto» se cobran las dos; con un bulto de 40 kg, dos líneas de 30 kg
venden 60 kg. El carrito de Ventas deja agregar el mismo producto varias veces, así que pasa en el uso
normal y descuadra inventario, costo y ganancia.

## What Changes

- `PosStore.RegisterSaleBatch` guarda el inventario después de aplicar cada línea, dentro de la transacción
  que ya abre, para que la siguiente línea cotice y busque lote sobre el inventario ya descontado. Si una
  línea no alcanza, la transacción se revierte y no se registra nada.
- Se activa la prueba omitida `Dos_lineas_del_mismo_producto_no_venden_mas_de_lo_que_hay` y se agregan las
  de kilos y piezas, y la de dos líneas que sí alcanzan.
- Sin cambios de contrato ni del front: la venta que antes se cobraba de más ahora responde `400` con
  «No hay inventario suficiente para esta venta.», mensaje que Ventas ya muestra.

## Capabilities

### New Capabilities
_(ninguna)_

### Modified Capabilities
- `sales`: una venta en lote no puede vender en total más inventario del que hay, aunque varias líneas
  sean del mismo producto.

## Impact

- Back (`a.b.a-back`): `Services/PosStore.cs` (`RegisterSaleBatch`),
  `tests/BackendAba.Tests/Services/PosStoreSaleTests.cs`, `tests/BackendAba.Tests/Api/ApiTests.cs`.
- Front (`a.b.a-front`): solo `docs/PENDIENTES.md` y estos artefactos.
- Ramas: `dev-fix-venta-doble-en-lote` en los dos repos, apiladas sobre `dev-test-pruebas-unitarias` (P-06).
