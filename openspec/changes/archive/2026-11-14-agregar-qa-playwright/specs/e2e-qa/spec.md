## ADDED Requirements

### Requirement: Correr la batería E2E contra la app local
El proyecto SHALL tener una batería de pruebas de punta a punta con Playwright que se corre con
`npm run test:e2e` contra el front local (`http://127.0.0.1:4200`) y el backend local
(`http://localhost:5028`), en Chromium y con un solo worker. Si la app no está corriendo, la batería
SHALL arrancarla con `npm start`; si ya está corriendo, SHALL reutilizarla sin levantar otra.

#### Scenario: La app ya está corriendo
- **WHEN** el front responde en `:4200` y se ejecuta `npm run test:e2e`
- **THEN** Playwright reutiliza esa instancia y corre las suites de `e2e/` sin arrancar otro servidor

#### Scenario: La app no está corriendo
- **WHEN** nada responde en `:4200` y se ejecuta `npm run test:e2e`
- **THEN** Playwright ejecuta `npm start`, espera a que el front responda y luego corre las suites

### Requirement: Separar la batería E2E de las pruebas unitarias
Las suites E2E SHALL vivir en `e2e/`, fuera de `src/`, y `npm test` (Karma) SHALL seguir corriendo solo
las pruebas unitarias de `src/**/*.spec.ts`. `npm run build` SHALL seguir compilando sin incluir nada de
`e2e/`.

#### Scenario: Pruebas unitarias sin las E2E
- **WHEN** se ejecuta `npm test`
- **THEN** Karma no carga ningún archivo de `e2e/`

### Requirement: Datos de prueba reconocibles y sin colisiones
Toda suite que cree datos SHALL nombrarlos con el prefijo `PW_` seguido de una marca única por corrida,
de modo que dos corridas seguidas no choquen entre sí ni con datos capturados a mano, y que los datos de
prueba se puedan identificar al limpiar `aba.db` antes de la entrega.

#### Scenario: Dos corridas seguidas
- **WHEN** la suite piloto corre dos veces seguidas contra la misma `aba.db`
- **THEN** cada corrida crea sus propios productos `PW_<marca>` y pasa sin depender de lo que dejó la anterior

### Requirement: Suite piloto de compra a inventario
La batería SHALL incluir la suite `e2e/compras-inventario/`, que registra desde la pantalla Compras una
compra con un proveedor nuevo, una línea de bultos y una línea de productos varios, ambas de productos
nuevos, y verifica en tres capas: el cuerpo de `POST /api/purchases`, la respuesta del backend y lo que
muestra la pantalla Inventario.

#### Scenario: Compra de bultos y varios de productos nuevos
- **WHEN** en Compras se captura un proveedor `PW_<marca>`, una línea «Bultos» de 3 bultos de un producto
  nuevo y una línea «Varios» de 5 piezas de otro producto nuevo, y se pulsa «Guardar compra»
- **THEN** el cuerpo enviado lleva el proveedor y las dos líneas con `kind` `bag` y `unit` y sus cantidades,
  el backend responde con éxito, e Inventario muestra el producto de bultos con 3 bultos sellados y el
  producto vario con 5 piezas

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
