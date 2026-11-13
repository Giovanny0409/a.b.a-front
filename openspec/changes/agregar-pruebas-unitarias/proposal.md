## Why

Ninguno de los dos repos tiene pruebas automáticas de su lógica: el front no tiene un solo `*.spec.ts` y
`npm test` falla con `TS18003` (P-09), y el back no tiene proyecto de pruebas. Los cálculos que más
importan a la tienda —costo y ganancia por lote, inventario de bultos, kilos y piezas, resumen del
tablero, cortes de caja— solo se verifican a mano. La suite E2E de Playwright prueba el flujo completo,
pero es lenta y no dice qué pieza falló.

## What Changes

- **Front, corredor**: se reemplaza Karma + Jasmine (deprecados) por Vitest con jsdom, usando el builder
  `@angular/build:unit-test` de Angular 21. Se quitan `karma*`, `jasmine-core` y `@types/jasmine`.
  `npm test` corre una vez y termina; `npm run test:watch` se queda observando.
- **Front, pruebas**: specs junto a cada archivo de `src/app` con lógica en uso: reducers, selectors,
  efectos, fachadas (`*.store.ts`), `pos-api.service.ts`, `sales-auth.guard.ts` y los componentes
  (creación y su lógica: validaciones y totales de Compras, carrito y cobro de Ventas, cortes y estado de
  importancia del Tablero, etiquetas de Historial e Inventario).
- **Back, proyecto de pruebas**: nuevo `tests/BackendAba.Tests` (xUnit) y `backend-aba.sln` para que
  `dotnet test` corra desde la raíz. Pruebas de `PosStore` contra SQLite en memoria y pruebas de la API con
  `WebApplicationFactory` (rutas, códigos de respuesta y forma del JSON en camelCase).
- **Back, mínimo indispensable en el código**: `backend-aba.csproj` excluye `tests/**` de su compilación,
  y `Program.cs` declara `public partial class Program` para que la fábrica de pruebas lo alcance.
- **Reglas**: `npm test` y `dotnet test` pasan a ser compuertas de cada change en los dos `CLAUDE.md` y
  en `openspec/config.yaml`.

## Capabilities

### New Capabilities
- `unit-tests`: pruebas automáticas de la lógica del front y del back, cómo se corren y qué cubren.

### Modified Capabilities
_(ninguna: no cambia el comportamiento de compras, ventas, inventario ni gastos; las pruebas verifican
los requisitos que ya existen)_

## Impact

- Front (`a.b.a-front`): `package.json`/`package-lock.json`, `angular.json` (target `test`),
  `tsconfig.spec.json`, nuevos `src/app/**/*.spec.ts`, `CLAUDE.md`, `openspec/config.yaml`,
  `docs/PENDIENTES.md`, READMEs de feature (sección Pruebas).
- Back (`a.b.a-back`): nuevo `tests/BackendAba.Tests/`, nuevo `backend-aba.sln`, `backend-aba.csproj`
  (exclusión), `Program.cs` (una línea), `CLAUDE.md`, `README.md`.
- Sin cambios de comportamiento ni de contrato. El código huérfano encontrado al revisar (P-10) no se
  prueba ni se borra aquí.
- Ramas: `dev-test-pruebas-unitarias` en los dos repos, apiladas sobre `dev-test-qa-playwright` (front)
  y `dev-chore-forma-de-trabajo` (back) (P-06).
