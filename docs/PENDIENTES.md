# Pendientes

Todo lo identificado en ABA Punto de Venta (front y back) y **no cerrado**: tareas, decisiones y deuda.
**Se lee antes de empezar a trabajar** y se actualiza en el mismo commit que el cambio que lo motiva.
Lo que aparece y no es del change en curso **se registra aquí y no se corrige ahí**: ampliar el alcance
es una decisión que se pregunta.

Vive solo en este repo (`a.b.a-front`), igual que la planeación de OpenSpec, aunque el registro sea del
backend: la columna **Repo** lo dice.

- **Prefijos:** `P-NN` pendientes, `D-NN` decisiones, `DT-NN` deuda técnica. Un ID nunca se reutiliza.
- **Estado:** Abierto · En curso · Bloqueado (motivo) · Cerrado (fecha y evidencia). Al cerrarse, la
  fila queda con un estado corto y la evidencia pasa a «Cerrados».

## 1. Pendientes

| ID | Pendiente | Origen | Repo | Estado |
|---|---|---|---|---|
| P-01 | La internacionalización no existe: `ngx-translate` no está en `package.json` y no hay `src/assets/i18n/es.json`, aunque el principio 1 de `CLAUDE.md` la exige. Ningún texto se puede llevar a claves hasta instalarla. Hace falta un change que instale `ngx-translate`, cree `es.json` y migre la primera pantalla; después conviene un `i18n:check` como el de `logs:check` | Revisión de la configuración, 2026-11-12 | front | Abierto |
| P-02 | Los datos de la laptop anterior no están en esta: `aba.db` se creó nueva el 2026-11-12 con los 3 productos de demostración de `PosStore.Seed` | Instalación en la laptop nueva, 2026-11-12 | back | **Cerrado 2026-11-12**: ver «Cerrados» |
| P-03 | En `a.b.a-front`, `origin/HEAD` apunta a `primera-subida`, y existen además `main` y `dev`. `CLAUDE.md` dice que la rama estable es `main`. En `a.b.a-back`, `origin/HEAD` es `main`. Falta decidir si `primera-subida` se retira y cambiar la rama por omisión en GitHub | Revisión de ramas, 2026-11-12 | front | Abierto |
| P-04 | El `CLAUDE.md` del back dice que la planeación OpenSpec vive solo en el front y que no se duplica un `openspec/` en el back, pero el back tiene `openspec/config.yaml` y las skills de OpenSpec en `.claude/skills/`. Falta decidir si se borran del back o si el back planea sus propios changes | Revisión de la configuración, 2026-11-12 | back | Abierto |
| P-05 | `npm ci` reporta 52 vulnerabilidades en dependencias del front (2 bajas, 21 moderadas, 26 altas, 3 críticas). No se corrió `npm audit fix` porque puede cambiar versiones | Instalación en la laptop nueva, 2026-11-12 | front | Abierto |
| P-06 | `dev-feat-backend-sync` no se ha fusionado a `dev` en ninguno de los dos repos (front: 2 commits adelante; back: 1). `dev-chore-forma-de-trabajo` está apilada encima, así que su PR a `dev` incluye esos commits si va primero | Creación de `dev-chore-forma-de-trabajo`, 2026-11-12 | ambos | Abierto |
| P-07 | No hay pruebas E2E. Falta un change que instale Playwright, deje una suite piloto y la skill `qa-playwright`. Corren contra el backend normal y `aba.db` (D-06) | D-05, 2026-11-12 | front | **Cerrado 2026-11-12**: ver «Cerrados» |
| P-08 | Antes de entregar el sistema: limpiar `aba.db` de los datos de prueba (incluidos los de Playwright) y aislar las pruebas E2E en su propia base y puerto, para que no toquen los datos reales. Hoy la URL de la API está fija en `src/app/core/pos-api.service.ts` y CORS del back solo permite `:4200` | D-06, 2026-11-12 | ambos | Abierto |
| P-09 | El front no tiene ninguna prueba unitaria: no hay un solo `*.spec.ts` en `src/`, así que `npm test` falla con `TS18003: No inputs were found in config file 'tsconfig.spec.json'`. `CLAUDE.md` pide crear o actualizar el `*.spec.ts` de cada componente que se toca, y la compuerta `npm test` no puede pasar hasta que exista el primero. Falta decidir si el primer change que toque un componente agrega su spec, o si hay un change para eso | Tarea 2.4 de `agregar-qa-playwright`, 2026-11-12: falla igual antes y después del change | front | **Cerrado 2026-11-14**: ver «Cerrados» |
| P-10 | Código sin uso en el front, anterior a esta revisión: `AppTopbarStore` (`layout/app-topbar.store.ts`) nadie lo inyecta, así que el store `appTopbar` (acciones, efecto, reducer y selector, registrados en `main.ts`) nunca se carga; en `PosApiService` no se usan `getSnapshot`, `createProduct` ni `registerSale`; tampoco `SalesStore.registerSale`, `DashboardStore.fallbackSummary`, `InventoryStore.productName` ni `InventoryStore.lots`, ni la interfaz `PurchaseItem` de `pos.models.ts`. Falta decidir si se borran o si el topbar debía mostrar los totales | Revisión del código para `agregar-pruebas-unitarias`, 2026-11-12. Ese change no les escribe pruebas | front | Abierto |
| P-11 | Una venta en lote con dos líneas del mismo producto vende el mismo inventario dos veces: con un solo bulto, dos líneas «1 bulto» se cobran las dos; con un bulto de 40 kg, dos líneas de 30 kg venden 60 kg. `PosStore.RegisterSaleBatch` aplica cada línea en memoria y guarda al final, y `QuoteSaleUnsafe`/`FindSaleLot`/`FindUnitLot` consultan la base, que aún ve el lote sin cambios. El carrito de Ventas permite agregar el mismo producto varias veces. La prueba `PosStoreSaleTests.Dos_lineas_del_mismo_producto_no_venden_mas_de_lo_que_hay` está omitida con este ID | Tarea 5.4 de `agregar-pruebas-unitarias`, 2026-11-14: la prueba lo encontró | back | **Cerrado 2026-11-14**: ver «Cerrados» |
| P-12 | `playwright.config.ts` solo espera al front (`:4200`): si hay un `ng serve` vivo sin backend en `:5028`, Playwright lo reutiliza, no arranca el backend y la suite agota el tiempo esperando `POST /api/purchases`. Pasó el 2026-11-14 con un `ng serve` que sobró de una corrida. Falta que `webServer` espere también al backend (dos entradas: `dotnet run` en `../a.b.a-back` con `url` `:5028`, y `ng serve` en `:4200`) | Tarea 7.2 de `agregar-pruebas-unitarias`, 2026-11-14 | front | En curso: `esperar-backend-en-e2e` |
| P-13 | Cuando un producto tiene varios bultos, `FindSaleLot` (`PosStore.cs`) elige con `FirstOrDefault` sin orden cuál se vende o se abre: no es el más antiguo, y el precio y el costo de la venta dependen de cuál toque (en la siembra, Maiz quebrado tiene un bulto a 390 y otro a 395). Al vender por kilo puede abrir un bulto sellado aunque haya uno abierto con kilos suficientes. Falta decidir la regla (el más antiguo primero, y el abierto antes que uno sellado) | Tarea 2.4 de `corregir-venta-doble-en-lote`, 2026-11-14: una prueba suponía cuál bulto salía y falló | back | Abierto |

## 2. Decisiones

| ID | Decisión | Fecha |
|---|---|---|
| D-01 | Forma de trabajo: este registro, las reglas de OpenSpec en `openspec/config.yaml`, `logs:check` antes de compilar y probar, y la skill `handoff-approved-openspec-change` | 2026-11-12 |
| D-02 | Claude crea las ramas y hace los commits; antes de hacer push o abrir un PR (con `gh`) pregunta | 2026-11-12 |
| D-03 | La memoria del agente es solo para hechos de la máquina. Lo que es del proyecto va al repositorio, para que sobreviva a un cambio de laptop | 2026-11-12 |
| D-04 | Todo se maneja desde Git y GitHub: no hay publicación en la nube ni ambientes de test/prod. No se adoptan `CHANGELOG.md` ni la versión servida en `/version.json` | 2026-11-12 |
| D-05 | Los cambios que tocan pantallas se prueban en la app con Playwright antes del PR (ver P-07) | 2026-11-12 |
| D-06 | Hasta la entrega, todo lo que hay en `aba.db` es de prueba: las pruebas E2E escriben ahí sin aislarse. Se limpia y se aísla antes de entregar (P-08) | 2026-11-12 |

## 3. Deuda técnica

Sin registros.

## 4. Cerrados

| ID | Cierre |
|---|---|
| P-02 | 2026-11-12: no hay nada que recuperar. Hasta la entrega todos los datos son de prueba (D-06) |
| P-07 | 2026-11-12, `agregar-qa-playwright`: `@playwright/test` 1.65.0 con Chromium, `playwright.config.ts`, suite piloto `e2e/compras-inventario/` y skill `qa-playwright`. `npm run test:e2e`: 1 pasó, con la app ya levantada y con la app apagada; datos `PW_mwebed8h_*` |
| P-09 | 2026-11-14, `agregar-pruebas-unitarias`: front con Vitest (`@angular/build:unit-test`), `npm test` 25 archivos y 140 pruebas pasan; back con `tests/BackendAba.Tests` (xUnit), `dotnet test` 58 pasan y 1 omitida (P-11), `aba.db` sin cambios |
| P-11 | 2026-11-14, `corregir-venta-doble-en-lote`: `RegisterSaleBatch` guarda cada línea dentro de la transacción. `dotnet test`: 63 pasan, 0 omitidas; la prueba de P-11 y las de kilos, piezas y «sí alcanza» pasan, y por HTTP dos líneas del único bulto responden `400` sin registrar venta |
