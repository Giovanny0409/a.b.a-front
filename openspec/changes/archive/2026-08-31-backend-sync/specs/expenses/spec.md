## Purpose

Cubre el registro y consulta de gastos de insumos (renta, luz, bolsas, comida, etc.) etiquetados por apartado, como base para que el tablero descuente estos gastos de las ganancias.

## ADDED Requirements

### Requirement: Registrar un gasto
El sistema SHALL permitir registrar un gasto con concepto, categoría, apartado (`general`, `guardadito` o `camioneta`), monto y notas opcionales, y SHALL devolver el gasto creado con su fecha de registro.

#### Scenario: Registrar un gasto válido
- **WHEN** se envía un gasto con concepto, categoría, apartado y un monto mayor a cero
- **THEN** el sistema guarda el gasto y lo devuelve con un identificador y fecha de registro

#### Scenario: Rechazar un gasto sin monto válido
- **WHEN** se envía un gasto con monto igual o menor a cero, o sin concepto
- **THEN** el sistema rechaza la solicitud sin registrar el gasto

### Requirement: Consultar gastos registrados
El sistema SHALL exponer la lista completa de gastos registrados para que el tablero y el historial puedan calcular el total gastado por periodo y por apartado.

#### Scenario: Listar gastos existentes
- **WHEN** se consultan los gastos registrados
- **THEN** el sistema devuelve todos los gastos guardados, incluyendo su apartado y monto
