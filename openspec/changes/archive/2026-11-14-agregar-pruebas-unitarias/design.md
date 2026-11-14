## Context

- Front: Angular 21.2 (`@angular/build` 21.2.13), target `test` con `@angular/build:karma` y
  `tsconfig.spec.json` con `types: ["jasmine"]`; no hay un solo `*.spec.ts`, así que `npm test` falla con
  `TS18003` (P-09). El builder `@angular/build:unit-test` de esta versión trae `runner: vitest` por
  omisión y pide `vitest@^4` como dependencia opcional.
- La lógica del front vive en: reducers y selectors (funciones puras), efectos (llaman a
  `PosApiService`), fachadas `*.store.ts` (despachan y esperan la acción de éxito o falla por
  `requestId`), `sales-auth.guard.ts` (usa `window.prompt`/`window.alert`) y los componentes de página
  (validaciones y cálculos en métodos de la clase).
- Back: un solo `backend-aba.csproj` (SDK Web) en la raíz, sin `.sln`. `PosStore` concentra la lógica y
  recibe `AppDbContext`. `Program.cs` usa top-level statements, aplica migraciones y siembra al
  arrancar, y registra el contexto con la cadena `DefaultConnection`.
- Código sin uso encontrado al revisar (P-10): `AppTopbarStore` y su store completo, `getSnapshot`,
  `createProduct` y `registerSale` de `PosApiService`, `SalesStore.registerSale`,
  `DashboardStore.fallbackSummary`, `InventoryStore.productName` y `lots`, `PurchaseItem`.

## Goals / Non-Goals

**Goals:**
- `npm test` y `dotnet test` corren solos, rápido y sin depender de la app levantada ni de `aba.db`.
- Una prueba por comportamiento en uso, junto al archivo que prueba, como referencia para los changes
  que sigan.

**Non-Goals:**
- Cambiar comportamiento o refactorizar para que sea «más probable»: si algo es difícil de probar, se
  prueba como está o se registra.
- Probar o borrar el código sin uso de P-10.
- Umbrales de cobertura obligatorios y CI.

## Decisions

**D1. Vitest con el builder de Angular, no Karma.** `angular.json` → `test.builder:
"@angular/build:unit-test"` con `tsConfig: tsconfig.spec.json` y `runner: vitest` (jsdom por omisión,
sin navegador). Karma está deprecado y necesita Chrome. Se instalan `vitest@^4` y `jsdom`, y se
desinstalan `karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`,
`karma-jasmine-html-reporter`, `jasmine-core` y `@types/jasmine` (Principio 5). `tsconfig.spec.json`
cambia `types` a `["vitest/globals"]`. Scripts: `test` → `ng test --watch=false` (para que la compuerta
termine) y `test:watch` → `ng test`.

**D2. Qué se prueba en el front y cómo.**
- Reducers y selectors: llamadas directas (`reducer(state, action)`, `selector.projector(...)`).
- Efectos: `TestBed` con `provideMockActions` y un `PosApiService` falso (`vi.fn()` que devuelve `of`
  o `throwError`), verificando la acción emitida.
- `PosApiService`: `provideHttpClient()` + `provideHttpClientTesting()` y `HttpTestingController`
  (método, URL y cuerpo).
- Fachadas: `provideMockStore` + `provideMockActions` con un `Subject`, espiando `dispatch` y emitiendo
  la acción de éxito o falla con el mismo `requestId`.
- Guard: `TestBed.runInInjectionContext`, `MockStore` con el selector sobreescrito y `vi.spyOn(window,
  'prompt' | 'alert')`.
- Componentes: `TestBed` con el componente standalone, `provideRouter([])`, y la fachada sustituida por
  un objeto falso con señales (`signal([...])`) en `overrideComponent(..., { set: { providers } })`,
  porque cada página provee su propia fachada. Se prueban la creación y los métodos con lógica.
- Las fechas del Tablero (cortes del día, semana) se fijan con `vi.useFakeTimers()` +
  `vi.setSystemTime(...)`.

**D3. Proyecto de pruebas del back en `tests/` con exclusión.** El `.csproj` web está en la raíz y su
globbing por omisión compilaría `tests/**/*.cs`; se agrega `<Compile Remove="tests/**" />` (y
`Content`/`None`/`EmbeddedResource` igual). Se crea `backend-aba.sln` con los dos proyectos para que
`dotnet test` funcione desde la raíz. Alternativa descartada: mover la API a `src/`; es un cambio
estructural que no aporta a este change.

**D4. SQLite en memoria, no el proveedor InMemory de EF.** `PosStore.RegisterSaleBatch` abre una
transacción y las consultas usan `ToLower()`; el proveedor InMemory de EF no soporta transacciones y se
comporta distinto de SQLite. Cada prueba abre una `SqliteConnection("DataSource=:memory:")`, la deja
abierta mientras vive el contexto y llama `Database.Migrate()`, así que también se prueban las
migraciones reales.

**D5. Pruebas de la API con `WebApplicationFactory<Program>`.** `Program.cs` agrega `public partial class
Program;` al final (top-level statements genera `Program` como `internal`). La fábrica reemplaza el
registro de `AppDbContext` por uno sobre una conexión SQLite en memoria compartida, así que
`Migrate()` + `Seed` del arranque corren sobre esa base y nunca sobre `aba.db`. Paquetes:
`xunit`, `xunit.runner.visualstudio`, `Microsoft.NET.Test.Sdk`, `Microsoft.AspNetCore.Mvc.Testing` 9.0.x
y `Microsoft.Data.Sqlite` (viene con `Microsoft.EntityFrameworkCore.Sqlite`). Serilog escribe en
`logs/` del directorio de contenido, que ya está en `.gitignore`.

**D6. Compuertas.** `npm test` y `dotnet test` se agregan a las compuertas de `CLAUDE.md` (front y back)
y a `rules.tasks` de `openspec/config.yaml`, y `npm test` deja de fallar por P-09.

## Risks / Trade-offs

- [Las pruebas de componentes dependen de los textos de las plantillas] → se prueban métodos y estado,
  no texto del DOM, salvo la creación.
- [`window.confirm`/`prompt`/`alert` en jsdom] → se espían con `vi.spyOn` en cada prueba que pasa por
  ellos.
- [Fechas y zona horaria en los cortes del Tablero] → `vi.setSystemTime` con horas locales
  construidas con `new Date(año, mes, día, hora)`, nunca cadenas UTC.
- [`Program.cs` arranca Serilog con archivo] → aceptado: las pruebas de API escriben en `logs/`, que
  está ignorado.
