# sales Specification

## Purpose

Cubre únicamente la venta de productos varios por pieza (correas, comederos, bebederos, jaulas, etc.); la venta existente por bulto y por kilo no cambia con este change y no se redocumenta aquí.

## Requirements

### Requirement: Vender un producto vario por pieza
El sistema SHALL permitir registrar una línea de venta por pieza (`unit: piece`) para un producto vario, descontando la cantidad vendida del inventario de piezas disponible de ese producto.

#### Scenario: Venta de piezas con inventario suficiente
- **WHEN** se registra una venta con una línea `unit: piece` y una cantidad menor o igual a las piezas disponibles del producto
- **THEN** el sistema registra la línea de venta con su costo y ganancia, y el inventario de piezas de ese producto baja en la cantidad vendida

#### Scenario: Venta de piezas sin inventario suficiente
- **WHEN** se intenta registrar una venta con una línea `unit: piece` cuya cantidad supera las piezas disponibles del producto
- **THEN** el sistema rechaza la venta sin registrar ninguna línea ni descontar inventario
