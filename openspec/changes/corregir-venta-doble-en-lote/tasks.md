## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, pasar P-11 a «En curso» con este change, en el mismo commit que los artefactos.

## 2. Corrección

- [ ] 2.1 En `PosStore.RegisterSaleBatch`, guardar con `db.SaveChanges()` después de aplicar cada línea, dentro de la transacción (D1).
- [ ] 2.2 Quitar el `Skip` de `Dos_lineas_del_mismo_producto_no_venden_mas_de_lo_que_hay` y agregar en `PosStoreSaleTests` los escenarios de kilos, piezas y dos líneas que sí alcanzan de `specs/sales/spec.md`.
- [ ] 2.3 Agregar en `ApiTests` la venta en lote de dos líneas del único bulto: `400`, mensaje y sin venta registrada.
- [ ] 2.4 Correr `dotnet test` (sin omitidas) y `dotnet build`.

## 3. Verificación y cierre

- [ ] 3.1 QA: no cambia ninguna pantalla; correr `npm run test:e2e` para confirmar que la compra y el inventario siguen bien con el backend corregido.
- [ ] 3.2 `openspec validate corregir-venta-doble-en-lote --strict`.
- [ ] 3.3 En `docs/PENDIENTES.md`, cerrar P-11 con su evidencia.
