# e2e-qa Specification

## Purpose

Cubre la batería de pruebas de punta a punta con Playwright: cómo se corre contra la app local, cómo se
nombran y verifican sus datos, las suites que recorren la app como la usa una persona, y la QA de cada
change que toca una pantalla.

## Requirements
### Requirement: Correr la batería E2E contra la app local
El proyecto SHALL tener una batería de pruebas de punta a punta con Playwright que se corre con
`npm run test:e2e` contra el front local (`http://127.0.0.1:4200`) y el backend local
(`http://localhost:5028`), en Chromium y con un solo worker. Cómo se reutiliza o se arranca cada
servidor lo define «La batería E2E espera al front y al backend».

#### Scenario: Corrida de la batería
- **WHEN** se ejecuta `npm run test:e2e` con el front y el backend respondiendo
- **THEN** Playwright corre las suites de `e2e/` en Chromium, una a la vez, contra los dos

### Requirement: Separar la batería E2E de las pruebas unitarias
Las suites E2E SHALL vivir en `e2e/`, fuera de `src/`, y `npm test` (Karma) SHALL seguir corriendo solo
las pruebas unitarias de `src/**/*.spec.ts`. `npm run build` SHALL seguir compilando sin incluir nada de
`e2e/`.

#### Scenario: Pruebas unitarias sin las E2E
- **WHEN** se ejecuta `npm test`
- **THEN** Karma no carga ningún archivo de `e2e/`

### Requirement: QA con Playwright en el flujo de cada change
Todo change que toque una pantalla SHALL incluir en su `tasks.md` una tarea de QA con la skill
`qa-playwright`: correr las suites de las pantallas que toca, escribir o actualizar la suite de lo nuevo
con los escenarios de sus specs, y dejar como evidencia en la tarea las suites corridas y su resultado.
Una falla anterior al change SHALL registrarse en `docs/PENDIENTES.md` y no corregirse en ese change.

#### Scenario: Change que toca una pantalla
- **WHEN** se generan las tareas de un change que modifica `src/app/features/<pantalla>/`
- **THEN** `tasks.md` incluye la tarea de QA con `qa-playwright` antes del PR

#### Scenario: Change sin pantalla
- **WHEN** el change solo toca documentación, scripts o el backend sin cambiar lo que ve la persona
- **THEN** la tarea de QA se marca como no aplicable, diciendo por qué

### Requirement: La batería E2E espera al front y al backend
La batería SHALL comprobar por separado que respondan el front (`http://127.0.0.1:4200`) y el backend
(`http://localhost:5028/api/products`) antes de correr las suites. SHALL reutilizar el que ya responda y
arrancar solo el que falte (`ng serve` para el front, `dotnet run` en el repo del backend), y al terminar
SHALL cerrar solo lo que arrancó.

#### Scenario: Front vivo sin backend
- **WHEN** responde `:4200` pero no `:5028` y se ejecuta `npm run test:e2e`
- **THEN** Playwright reutiliza el front, arranca el backend, espera a que responda y las suites corren contra los dos

#### Scenario: Backend vivo sin front
- **WHEN** responde `:5028` pero no `:4200` y se ejecuta `npm run test:e2e`
- **THEN** Playwright reutiliza el backend, arranca `ng serve` y las suites corren contra los dos

#### Scenario: Nada corriendo
- **WHEN** no responde ninguno de los dos y se ejecuta `npm run test:e2e`
- **THEN** Playwright arranca los dos, corre las suites y al terminar no queda ninguno escuchando

### Requirement: Datos de prueba con nombres reales
Las suites SHALL crear sus datos con los productos y proveedores del catálogo `e2e/support/catalogo.ts`,
con nombres como los que maneja la forrajería. Como los nombres se repiten entre corridas, toda
verificación de inventario SHALL compararse contra lo que había antes de la prueba, leído por la API, y
nunca contra un valor absoluto.

#### Scenario: Dos corridas seguidas
- **WHEN** la suite de compras corre dos veces seguidas contra la misma `aba.db`
- **THEN** las dos pasan, y después de la segunda cada producto del catálogo tiene el inventario de las dos compras sumado

### Requirement: Compras de la misma mercancía con dos proveedores
La batería SHALL incluir la suite `e2e/compras-inventario/`, que registra desde Compras una compra por
proveedor: alimento para pollo de engorda de una marca a su proveedor, el mismo alimento de otra marca a
otro proveedor, y un accesorio por pieza a un tercero. SHALL verificar el cuerpo y la respuesta de cada
`POST /api/purchases`, que en Inventario cada producto sube exactamente lo comprado, y que la API registra
cada compra con su proveedor.

#### Scenario: Pollo de engorda de dos marcas
- **WHEN** se compran 3 bultos del alimento de una marca a su proveedor y 2 bultos del de la otra marca a otro proveedor
- **THEN** Inventario muestra dos productos distintos, uno con 3 bultos sellados más y otro con 2 más, y cada compra queda con el nombre y teléfono de su proveedor

#### Scenario: Accesorio por pieza
- **WHEN** se compran 5 piezas del accesorio a su proveedor
- **THEN** Inventario muestra 5 piezas más de ese producto

