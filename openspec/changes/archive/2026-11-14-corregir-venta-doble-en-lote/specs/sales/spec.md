## ADDED Requirements

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
