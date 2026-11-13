## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, pasar P-09 a «En curso» con este change y registrar P-10 (código sin uso encontrado al revisar), en el mismo commit que los artefactos.

## 2. Front: Vitest

- [ ] 2.1 Instalar `vitest@^4` y `jsdom` como dependencias de desarrollo; desinstalar `karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`, `jasmine-core` y `@types/jasmine` (D1).
- [ ] 2.2 En `angular.json`, cambiar el target `test` a `@angular/build:unit-test` con `tsConfig: tsconfig.spec.json` y `runner: vitest`; en `tsconfig.spec.json`, `types: ["vitest/globals"]`. Scripts: `test` → `ng test --watch=false`, `test:watch` → `ng test`.

## 3. Front: pruebas de la capa de datos

- [ ] 3.1 `core/pos-api.service.spec.ts`: método, URL, parámetros y cuerpo de cada llamada en uso (`HttpTestingController`).
- [ ] 3.2 `core/sales-auth.guard.spec.ts`: vendedor activo, prompt cancelado, ID autorizado, ID rechazado y falla de la API.
- [ ] 3.3 Reducers y selectors de `dashboard`, `history`, `inventory`, `purchases` y `sales` (incluye el resumen del tablero y del historial, y la unión de proveedores de compras).
- [ ] 3.4 Efectos de `dashboard`, `history`, `inventory`, `purchases` y `sales`: acción de éxito, acción de falla con mensaje del backend y por omisión, y la normalización del cuerpo de compra y gasto.
- [ ] 3.5 Fachadas `dashboard.store`, `history.store`, `inventory.store`, `purchases.store` y `sales.store`: lo que despachan y cómo resuelven o fallan según el `requestId` (incluye venta por pesos convertida a kilos y venta sin vendedor).

## 4. Front: pruebas de componentes

- [ ] 4.1 `purchases-page.component.spec.ts`: creación, totales (inversión, bultos, piezas), validación de precio por kilo en bultos, cuerpo que pasa a la fachada, mensajes de éxito y error, alta de proveedor y registro de gasto.
- [ ] 4.2 `sales-page.component.spec.ts`: creación, etiquetas por modo, agregar y quitar líneas del carrito, total y cambio, cobro insuficiente, venta exitosa (con y sin ticket) y error, tickets guardados.
- [ ] 4.3 `dashboard-page.component.spec.ts`: cortes de mañana, tarde y día, resumen semanal, clasificación bulto/pieza, estado de importancia y guardado de importancia.
- [ ] 4.4 `history-page.component.spec.ts` e `inventory-page.component.spec.ts`: carga al crear, etiquetas, filtro de inventario.
- [ ] 4.5 `app.component.spec.ts`: la app se crea con su shell, menú y topbar.
- [ ] 4.6 Correr `npm test` y confirmar que pasa y que no carga nada de `e2e/`; correr `npm run build`.

## 5. Back: proyecto de pruebas

- [ ] 5.1 Crear `tests/BackendAba.Tests/BackendAba.Tests.csproj` (xUnit, `net9.0`) con referencia al proyecto de la API, y `backend-aba.sln` con los dos proyectos (D3, D5).
- [ ] 5.2 En `backend-aba.csproj`, excluir `tests/**`; en `Program.cs`, agregar `public partial class Program;`. Verificar que `dotnet build backend-aba.csproj` no incluye las pruebas.
- [ ] 5.3 Fixture de base SQLite en memoria con migraciones reales (D4).
- [ ] 5.4 Pruebas de `PosStore`: compras de bultos y piezas (alta y reutilización de producto y proveedor, costo por bulto), inventario (bultos sellados, kilos abiertos, piezas, `needsRestock`), cotización y venta por bulto, kilo y pieza (costo, total, ganancia, estado del lote), venta sin inventario, vendedor no autorizado, venta sin líneas, gastos, resumen, autorización de vendedor y siembra idempotente.
- [ ] 5.5 Pruebas de la API con `WebApplicationFactory<Program>` sobre SQLite en memoria: `GET` de productos, inventario, lotes, compras, ventas, gastos e historial; `POST` de compras, ventas en lote, gastos y autorización de vendedor, con sus códigos (`200`, `400`, `401`, `404` de la cotización) y propiedades en camelCase.
- [ ] 5.6 Correr `dotnet test` desde la raíz del back y confirmar que pasa y que `aba.db` no cambió.

## 6. Reglas y documentación

- [ ] 6.1 `CLAUDE.md` del front y del back, y `openspec/config.yaml`: `npm test` y `dotnet test` como compuertas, y agregar o actualizar las pruebas de lo que cambia cada change.
- [ ] 6.2 READMEs: sección «Pruebas» de `src/app/features/sales/README.md` y `purchases/README.md`; en el `README.md` del back, cómo correr `dotnet test` y qué cubre.

## 7. Verificación y cierre

- [ ] 7.1 Revisar que no queden dependencias de Karma/Jasmine, imports ni helpers sin uso (Principio 5).
- [ ] 7.2 QA: no aplica la suite de `qa-playwright` como change de pantalla (no cambia lo que se ve), pero se corre `npm run test:e2e` para confirmar que la batería E2E sigue pasando con Vitest instalado.
- [ ] 7.3 `openspec validate agregar-pruebas-unitarias --strict`.
- [ ] 7.4 En `docs/PENDIENTES.md`, cerrar P-09 con la evidencia (conteo de pruebas de front y back) y registrar lo encontrado fuera de alcance.
