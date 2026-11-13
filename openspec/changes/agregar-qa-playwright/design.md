## Context

- El front no tiene pruebas de punta a punta. `npm test` corre Karma (`@angular/build:karma`) sobre
  `src/**/*.spec.ts` (`tsconfig.spec.json`).
- `npm start` (`scripts/start-with-backend.ps1`) arranca el backend en `:5028` en una ventana oculta si no
  responde y luego `ng serve --host 127.0.0.1 --port 4200`. CORS del back solo permite `:4200`
  (`Program.cs:39`) y la URL de la API está fija en `src/app/core/pos-api.service.ts:19`.
- La app no tiene login. Solo Ventas pide el ID de vendedor con `window.prompt`
  (`src/app/core/sales-auth.guard.ts`).
- Las pantallas usan controles HTML nativos (`input`, `select`, `datalist`), no `p-select`/`p-inputNumber`,
  así que los selectores son simples.
- Compras manda `POST /api/purchases` con `{ supplier: { name, phone }, lines: PurchaseLineInput[] }`
  (`pos-api.service.ts`, `RegisterPurchaseRequest` en `a.b.a-back/Models/Requests.cs`) y muestra en
  `.notice` «Compra registrada en el backend e inventario actualizado.» al terminar.
- El backend no tiene endpoints de borrado (solo `GET`/`POST`), así que una prueba no puede limpiar lo que
  crea. D-06: hasta la entrega todo en `aba.db` es de prueba.

## Goals / Non-Goals

**Goals:**
- Una batería E2E que corre con un comando contra la app local tal como la usa la persona.
- Una suite piloto que sirva de ejemplo para las siguientes: compra → inventario, en tres capas.
- Una skill que vuelva la QA un paso fijo de cada change.

**Non-Goals:**
- Aislar las pruebas en otra base o puerto, y limpiar `aba.db` (P-08, antes de la entrega).
- Suites de Ventas, Gastos, Historial y Tablero: cada una llega con el change que toque esa pantalla.
- CI: no hay pipeline; la batería es local.
- Otros navegadores además de Chromium.
- Tocar el backend.

## Decisions

**D1. Reutilizar `npm start` como `webServer`.** `playwright.config.ts` declara
`webServer: { command: 'npm start', url: 'http://127.0.0.1:4200', reuseExistingServer: true, timeout: 180_000 }`
y `baseURL: 'http://127.0.0.1:4200'`. Alternativa descartada: levantar back y front por separado en otros
puertos con otra base. Eso es P-08 y exige volver configurable la URL de la API y el CORS; hoy no aporta
porque todos los datos son de prueba. Trampa: si Playwright arranca `npm start`, al terminar cierra
`ng serve`, pero el backend sigue vivo en su ventana oculta. Es lo mismo que pasa con `npm start` a mano.

**D2. Un worker, Chromium, ventana de escritorio.** `workers: 1`, `fullyParallel: false`, un solo proyecto
`chromium` con `viewport: { width: 1440, height: 900 }` repetido después del spread de
`devices['Desktop Chrome']` (que trae 1280×720). El backend y `aba.db` son uno solo: dos suites en
paralelo escribiendo inventario se pisarían. `reporter: [['list'], ['html', { open: 'never' }]]` para leer
el resultado en la terminal y conservar el reporte.

**D3. `e2e/` fuera de `src/` y con su propio `tsconfig`.** `e2e/tsconfig.json` (extiende el raíz, `types:
["node"]`, `include: ["**/*.ts"]`), y `playwright.config.ts` en la raíz. Karma no lo ve porque
`tsconfig.spec.json` solo incluye `src/**`. Las suites siguen el patrón `e2e/<suite>/<suite>.spec.ts` +
`<suite>.locators.ts`, para que un cambio de texto de la pantalla se corrija en un solo lugar.

**D4. Nombres `PW_<marca>`.** `e2e/support/test-data.ts` exporta `marcaDeCorrida()` (`Date.now()` en base
36) y `nombrePrueba(sufijo)` → `PW_<marca>_<sufijo>`. Sin endpoints de borrado, la marca es lo que evita
colisiones (el back busca productos y proveedores por nombre y los reutiliza) y lo que permitirá
reconocerlos al limpiar en P-08.

**D5. Tres capas en la suite piloto.** Con `page.waitForRequest` y `postDataJSON()` se verifica el cuerpo
(`supplier.name`, dos líneas, `kind: 'bag'` con `quantity: 3` y `kind: 'unit'` con `quantity: 5`); con
`page.waitForResponse` se verifica `200`; después se abre `/inventario` (`page.goto`; no hay tenant ni sesión
que se pierda al recargar), se filtra por el
nombre y se leen las columnas «Bultos sellados» y «Piezas». El proveedor se captura escribiendo el nombre
en el campo «Proveedor» (sin la barra de alta), que es el camino más corto y el más usado.

**D6. Skill `qa-playwright` sin script propio.** En Sadform la skill tenía un `.mjs` para elegir suites
según los archivos cambiados. Aquí hay una suite; la skill dice cómo elegirlas a mano
(`src/app/features/<pantalla>/` → `e2e/` que la recorren) y corre `npx playwright test <carpeta>`. Un
script de selección se agrega cuando haya suficientes suites para que valga la pena.

**D7. Versión.** `@playwright/test@^1.63.0` y solo Chromium (`npx playwright install chromium`). Node 24
del proyecto es compatible.

## Risks / Trade-offs

- [`aba.db` acumula datos `PW_`] → aceptado por D-06; P-08 los limpia antes de la entrega. La marca los
  hace reconocibles.
- [Un dato capturado a mano con el mismo nombre que uno de prueba] → improbable con el prefijo `PW_` y la
  marca de tiempo.
- [La suite depende del texto de la pantalla, que cambiará cuando llegue i18n (P-01)] → los textos viven en
  `<suite>.locators.ts`; al migrar a `es.json` se actualizan ahí.
- [El primer `npm start` tarda: `dotnet run` compila y `ng serve` construye] → `timeout` de 180 s en
  `webServer`.
- [El backend oculto queda vivo al terminar] → documentado en `e2e/README.md`, igual que con `npm start`.
