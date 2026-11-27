# inventory Specification

## Purpose

Cubre la forma correcta del inventario neto de la forrajería: bultos sellados, kilos abiertos (de un bulto abierto para vender por kilo) y piezas de productos varios, sin campos que el frontend ya no usa.

## Requirements

### Requirement: Inventario reporta piezas de productos varios
El sistema SHALL incluir en cada elemento de inventario la cantidad total de piezas disponibles (`quantityTotal`) para productos que se compran y venden por unidad (correas, comederos, bebederos, jaulas, etc.), no solo para productos que se venden por bulto o kilo.

#### Scenario: Inventario de un producto vario
- **WHEN** se consulta el inventario de un producto registrado como `unit` (productos varios)
- **THEN** el elemento de inventario devuelto incluye la cantidad total de piezas disponibles

### Requirement: Inventario distingue bultos sellados de kilos abiertos
El sistema SHALL reportar por separado, para cada producto que se vende por bulto, cuántos bultos sellados quedan y cuántos kilos quedan del bulto que se abrió para vender por kilo.

#### Scenario: Inventario de un producto de bulto con un lote abierto
- **WHEN** un producto tiene bultos sellados y además un lote abierto del que se vende por kilo
- **THEN** el inventario devuelve el conteo de bultos sellados y los kilos restantes del lote abierto como valores separados
