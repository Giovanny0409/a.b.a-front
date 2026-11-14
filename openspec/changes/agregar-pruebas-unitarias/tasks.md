## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, pasar P-09 a «En curso» con este change y registrar P-10 (código sin uso encontrado al revisar), en el mismo commit que los artefactos.

## 2. Front: Vitest

- [x] 2.1 Instalar `vitest@^4` y `jsdom` como dependencias de desarrollo; desinstalar `karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`, `jasmine-core` y `@types/jasmine` (D1). Quedaron `vitest` 4.1.12 y `jsdom` 31.0.0.
- [x] 2.2 En `angular.json`, cambiar el target `test` a `@angular/build:unit-test` con `tsConfig: tsconfig.spec.json` y `runner: vitest`; en `tsconfig.spec.json`, `types: ["vitest/globals"]`. Scripts: `test` → `ng test --watch=false`, `test:watch` → `ng test`.

## 3. Front: pruebas de la capa de datos

- [x] 3.1 `core/pos-api.service.spec.ts`: método, URL, parámetros y cuerpo de cada llamada en uso (`HttpTestingController`).
- [x] 3.2 `core/sales-auth.guard.spec.ts`: vendedor activo, prompt cancelado, ID autorizado, ID rechazado y falla de la API. Los specs con `MockStore` llaman `store.resetSelectors()` en `afterEach`: `overrideSelector` deja el selector sobrescrito para los specs siguientes, que corren en el mismo contexto.
- [x] 3.3 Reducers y selectors de `dashboard`, `history`, `inventory`, `purchases` y `sales` (incluye el resumen del tablero y del historial, y la unión de proveedores de compras).
- [x] 3.4 Efectos de `dashboard`, `history`, `inventory`, `purchases` y `sales`: acción de éxito, acción de falla con mensaje del backend y por omisión, y la normalización del cuerpo de compra y gasto.
- [x] 3.5 Fachadas `dashboard.store`, `history.store`, `inventory.store`, `purchases.store` y `sales.store`: lo que despachan y cómo resuelven o fallan según el `requestId` (incluye venta por pesos convertida a kilos y venta sin vendedor). No se prueban `SalesStore.registerSale`, `DashboardStore.fallbackSummary`, `InventoryStore.productName` ni `lots`, ni `AppTopbarStore`: no tienen uso (P-10).

## 4. Front: pruebas de componentes

- [x] 4.1 `purchases-page.component.spec.ts`: creación, totales (inversión, bultos, piezas), validación de precio por kilo en bultos, cuerpo que pasa a la fachada, mensajes de éxito y error, alta de proveedor y registro de gasto.
- [x] 4.2 `sales-page.component.spec.ts`: creación, etiquetas por modo, agregar y quitar líneas del carrito, total y cambio, cobro insuficiente, venta exitosa (con y sin ticket) y error, tickets guardados.
- [x] 4.3 `dashboard-page.component.spec.ts`: cortes de mañana, tarde y día, resumen semanal, clasificación bulto/pieza, estado de importancia y guardado de importancia.
- [x] 4.4 `history-page.component.spec.ts` e `inventory-page.component.spec.ts`: carga al crear, etiquetas, filtro de inventario.
- [x] 4.5 `app.component.spec.ts`: la app se crea con su shell, menú y topbar.
- [x] 4.6 Correr `npm test` y confirmar que pasa y que no carga nada de `e2e/`; correr `npm run build`. `npm test`: 25 archivos, 140 pruebas pasan; `ng test --list-tests` lista 25 specs de `src/` y ninguno de `e2e/`. `npm run build` pasa (`logs:check` revisa 46 archivos).

## 5. Back: proyecto de pruebas

- [x] 5.1 Crear `tests/BackendAba.Tests/BackendAba.Tests.csproj` (xUnit, `net9.0`) con referencia al proyecto de la API, y `backend-aba.sln` con los dos proyectos (D3, D5).
- [x] 5.2 En `backend-aba.csproj`, excluir `tests/**`; en `Program.cs`, agregar `public partial class Program;`. Verificar que `dotnet build backend-aba.csproj` no incluye las pruebas. `dotnet build backend-aba.csproj`: 0 errores, 0 advertencias, sin las pruebas.
- [x] 5.3 Fixture de base SQLite en memoria con migraciones reales (D4).
- [x] 5.4 Pruebas de `PosStore`: compras de bultos y piezas (alta y reutilización de producto y proveedor, costo por bulto), inventario (bultos sellados, kilos abiertos, piezas, `needsRestock`), cotización y venta por bulto, kilo y pieza (costo, total, ganancia, estado del lote), venta sin inventario, vendedor no autorizado, venta sin líneas, gastos, resumen, autorización de vendedor y siembra idempotente. Encontró P-11 (dos líneas del mismo producto en una venta venden el mismo bulto dos veces); su prueba queda omitida con `Skip` citando P-11, sin debilitar la aserción.
- [x] 5.5 Pruebas de la API con `WebApplicationFactory<Program>` sobre SQLite en memoria: `GET` de productos, inventario, lotes, compras, ventas, gastos e historial; `POST` de compras, ventas en lote, gastos y autorización de vendedor, con sus códigos (`200`, `400`, `401`, `404` de la cotización) y propiedades en camelCase.
- [x] 5.6 Correr `dotnet test` desde la raíz del back y confirmar que pasa y que `aba.db` no cambió. `dotnet test`: 58 pasan, 1 omitida (P-11), 0 fallan; la huella de `aba.db` es la misma antes y después (`42acba07…`).

## 6. Reglas y documentación

- [x] 6.1 `CLAUDE.md` del front y del back, y `openspec/config.yaml`: `npm test` y `dotnet test` como compuertas, y agregar o actualizar las pruebas de lo que cambia cada change.
- [x] 6.2 READMEs: sección «Pruebas» de `src/app/features/sales/README.md` y `purchases/README.md`; en el `README.md` del back, cómo correr `dotnet test` y qué cubre.

## 7. Verificación y cierre

- [x] 7.1 Revisar que no queden dependencias de Karma/Jasmine, imports ni helpers sin uso (Principio 5). Sin referencias a Karma ni Jasmine fuera del historial de Git; `package-lock.json` sin `node_modules/karma*`.
- [x] 7.2 QA: no aplica la suite de `qa-playwright` como change de pantalla (no cambia lo que se ve), pero se corre `npm run test:e2e` para confirmar que la batería E2E sigue pasando con Vitest instalado. Primera corrida: falló por un `ng serve` sobrante en `:4200` sin backend, que Playwright reutilizó (P-12, de la configuración de `agregar-qa-playwright`). Con los puertos libres: 1 pasó, datos `PW_mwg1izje_*`, y al terminar no quedó nada escuchando.
- [x] 7.3 `openspec validate agregar-pruebas-unitarias --strict`.
- [x] 7.4 En `docs/PENDIENTES.md`, cerrar P-09 con la evidencia (conteo de pruebas de front y back) y registrar lo encontrado fuera de alcance. Se registraron P-11 y P-12.
