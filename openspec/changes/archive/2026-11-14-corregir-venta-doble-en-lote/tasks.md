## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, pasar P-11 a «En curso» con este change, en el mismo commit que los artefactos.

## 2. Corrección

- [x] 2.1 En `PosStore.RegisterSaleBatch`, guardar con `db.SaveChanges()` después de aplicar cada línea, dentro de la transacción (D1).
- [x] 2.2 Quitar el `Skip` de `Dos_lineas_del_mismo_producto_no_venden_mas_de_lo_que_hay` y agregar en `PosStoreSaleTests` los escenarios de kilos, piezas y dos líneas que sí alcanzan de `specs/sales/spec.md`.
- [x] 2.3 Agregar en `ApiTests` la venta en lote de dos líneas del único bulto: `400`, mensaje y sin venta registrada. Además, `Registrar_una_venta_en_lote_baja_el_inventario` suponía cuál de los dos bultos de Maiz se vendía y falló una vez; ahora usa el producto de un solo bulto, y el orden arbitrario quedó como P-13.
- [x] 2.4 Correr `dotnet test` (sin omitidas) y `dotnet build`. `dotnet test` tres veces seguidas: 63 pasan, 0 omitidas, 0 fallan. `dotnet build backend-aba.csproj`: 0 advertencias.

## 3. Verificación y cierre

- [x] 3.1 QA: no cambia ninguna pantalla; correr `npm run test:e2e` para confirmar que la compra y el inventario siguen bien con el backend corregido. `npm run test:e2e`: 1 pasó, datos `PW_mwg1ra4d_*`.
- [x] 3.2 `openspec validate corregir-venta-doble-en-lote --strict`.
- [x] 3.3 En `docs/PENDIENTES.md`, cerrar P-11 con su evidencia. Se registró P-13.
