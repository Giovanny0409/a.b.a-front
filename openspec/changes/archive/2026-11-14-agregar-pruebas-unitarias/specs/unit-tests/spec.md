## ADDED Requirements

### Requirement: Pruebas unitarias del front con un comando
El front SHALL correr sus pruebas unitarias con `npm test`, usando Vitest con jsdom a través del builder
`@angular/build:unit-test`, sin abrir un navegador. `npm test` SHALL correr una sola vez y terminar con
código distinto de cero si alguna prueba falla. Las suites de `e2e/` SHALL quedar fuera.

#### Scenario: Corrida de las pruebas del front
- **WHEN** se ejecuta `npm test` en `a.b.a-front`
- **THEN** se ejecutan todos los `src/**/*.spec.ts`, ninguno de `e2e/`, y el proceso termina con código 0 si todas pasan

#### Scenario: Una prueba del front falla
- **WHEN** una aserción de un `*.spec.ts` no se cumple
- **THEN** `npm test` termina con código distinto de cero y dice qué prueba falló

### Requirement: Cobertura de la lógica del front
Cada archivo de `src/app` con lógica en uso SHALL tener su `*.spec.ts` al lado: reducers, selectors,
efectos, fachadas, `pos-api.service.ts`, `sales-auth.guard.ts` y los componentes de página. Las pruebas
SHALL verificar el comportamiento observable (estado resultante, acciones emitidas, peticiones HTTP,
valores calculados), no detalles internos.

#### Scenario: Resumen del tablero
- **WHEN** el estado del tablero tiene inventario, lotes, compras, ventas y gastos
- **THEN** el selector del resumen devuelve bultos sellados y abiertos, inversión, ingreso, gastos, ganancia neta de gastos y productos por surtir calculados a partir de ese estado

#### Scenario: Efecto que falla
- **WHEN** la API responde con error a una acción de carga o registro
- **THEN** el efecto emite la acción de falla con el mensaje del backend o el mensaje por omisión

#### Scenario: Guard de ventas
- **WHEN** no hay vendedor activo y la persona cancela el prompt o escribe un ID no autorizado
- **THEN** el guard redirige a `/tablero`; con un ID autorizado, permite la navegación

### Requirement: Pruebas del back con un comando
El back SHALL tener un proyecto de pruebas xUnit en `tests/BackendAba.Tests` incluido en
`backend-aba.sln`, y `dotnet test` desde la raíz del repo SHALL compilar y correr todas las pruebas. Las
pruebas SHALL usar una base SQLite en memoria propia, nunca `aba.db`.

#### Scenario: Corrida de las pruebas del back
- **WHEN** se ejecuta `dotnet test` en `a.b.a-back`
- **THEN** se ejecutan todas las pruebas sin tocar `aba.db`, y el proceso termina con código 0 si todas pasan

#### Scenario: El proyecto web no compila las pruebas
- **WHEN** se ejecuta `dotnet build backend-aba.csproj` o `dotnet run`
- **THEN** los archivos de `tests/` no forman parte del ensamblado de la API

### Requirement: Cobertura de la lógica del back
Las pruebas del back SHALL cubrir `PosStore` (compras de bultos y de piezas con alta de producto y
proveedor, reutilización por nombre, inventario, cotización y registro de ventas por bulto, kilo y pieza
con su costo y ganancia, ventas sin inventario o con vendedor no autorizado, gastos, resumen y siembra) y
la API por HTTP (rutas, códigos de respuesta y nombres de propiedades en camelCase que espera el front).

#### Scenario: Venta por kilo de un bulto
- **WHEN** se vende por kilo parte de un bulto sellado
- **THEN** el bulto queda abierto con los kilos restantes, y el costo de la venta es el costo por kilo del lote por los kilos vendidos

#### Scenario: Venta sin inventario
- **WHEN** se intenta registrar una venta de un producto sin bultos ni piezas disponibles
- **THEN** `POST /api/sales/batch` responde `400` con un `message` y no se registra ninguna venta

#### Scenario: Contrato de compras
- **WHEN** se hace `POST /api/purchases` con el cuerpo que manda el front
- **THEN** responde `200` con un arreglo de compras cuyas propiedades están en camelCase (`productName`, `supplierName`, `investment`)

### Requirement: Pruebas automáticas en el flujo de cada change
Todo change SHALL dejar pasando `npm test` en el front y `dotnet test` en el back cuando toca ese repo,
y SHALL agregar o actualizar las pruebas de lo que cambia. Una prueba que falla por algo anterior al
change SHALL registrarse en `docs/PENDIENTES.md`.

#### Scenario: Change que modifica un reducer
- **WHEN** un change modifica el comportamiento de un reducer del front
- **THEN** su `tasks.md` incluye actualizar el `*.reducer.spec.ts` y correr `npm test` antes del commit
