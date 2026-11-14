## Context

`PosStore.RegisterSaleBatch` abre una transacción, y por cada línea llama `QuoteSaleUnsafe` y
`ApplySaleToInventory`; solo al final hace `SaveChanges` y `Commit`. `FindSaleLot` y `FindUnitLot`
filtran en SQL (`Status == Sealed`, `RemainingKg >= quantity`, `RemainingQuantity >= quantity`), así que
la segunda línea ve en la base el lote sin descontar. EF devuelve la instancia ya rastreada, con el
descuento en memoria, y la vuelve a descontar (`Math.Max(0, …)` oculta que no alcanzaba).

## Goals / Non-Goals

**Goals:** que las líneas de un lote se apliquen sobre el inventario ya descontado, y que una venta que no
alcanza se rechace completa.

**Non-Goals:** qué bulto se abre al vender por kilo cuando hay varios (hoy `FirstOrDefault` sin orden);
cambiar el carrito del front para unir líneas del mismo producto.

## Decisions

**D1. `SaveChanges` por línea dentro de la transacción existente.** Después de `ApplySaleToInventory` se
llama `db.SaveChanges()`. Las consultas de la siguiente línea ven el inventario descontado, y como todo
ocurre dentro de `BeginTransaction`, una excepción en una línea posterior sale del `using` sin `Commit`, y
SQLite revierte todo. Alternativa descartada: llevar en memoria lo ya descontado por producto y restarlo
en las búsquedas; duplica la lógica de selección de lote y es más fácil de romper.

**D2. Pruebas.** Se quita el `Skip` de la prueba de P-11 y se agregan los escenarios de kilos, piezas y
«sí alcanza» en `PosStoreSaleTests`, más uno por HTTP en `ApiTests` (`400` y sin venta registrada).

## Risks / Trade-offs

- [El contexto queda con cambios guardados de una transacción revertida] → el contexto es *scoped* por
  petición y se descarta con ella; el controlador responde `400` sin volver a usarlo.
