## Context

- **Referencia:** Sadform.Front (`C:\Users\User\Desktop\MixStations\Sadform.Front`) se leyó solo como
  referencia: no se copia ni se modifica nada de ese proyecto. Allá, `tsconfig.json` tiene `baseUrl: "./"` y
  se importa `src/app/...`; `main.ts` solo arranca, y `app.config.ts` agrupa los providers por secciones;
  NgRx corre con `runtimeChecks` estrictos y DevTools; y `AppConfig` lee las URLs de `environment.ts` y de un
  `config.js` de runtime.
- **Aquí:**
  - `tsconfig.json` no tiene `baseUrl` ni `paths`, y `src/app` tiene 88 importaciones con `../../` o `../../../`.
  - `src/main.ts` declara todos los providers (HTTP con `connectionInterceptor`, `provideI18n()`, `Notifier`,
    `provideStore` con seis features, `provideEffects` y el router).
  - `@ngrx/store-devtools` está en `package.json` y nadie lo usa.
  - `API_BASE_URL = 'http://localhost:5028/api'` vive en `core/pos-api.service.ts`.
  - `angular.json`: `build` con `production` (por omisión) y `development`, `serve` en `development`, y
    `test` con `@angular/build:unit-test` (Vitest) sobre `tsconfig.spec.json`, que extiende `tsconfig.json`.
  - `e2e/tsconfig.json` extiende `../tsconfig.json` con `rootDir: ".."`. La E2E importa
    `src/app/testing/translate.ts` por ruta relativa.

## Goals / Non-Goals

**Goals:**
- Importaciones entre carpetas con alias, sin `../../` hacia otra carpeta de `src/app`.
- `main.ts` mínimo y `app.config.ts` con secciones, `runtimeChecks` estrictos y DevTools fuera de producción.
- La URL del backend en `src/environments/`.
- `.editorconfig` con comillas simples en `*.ts`.

**Non-Goals:**
- Configuración de runtime (`config.js`), Azure AD, Sentry, telemetría: Sadform los necesita por sus
  ambientes; aquí no hay (D-04).
- Aislar la E2E en otra base y puerto (P-08): solo queda preparada la URL configurable.
- `loading` por feature e indicadores de carga (P-16), `SHARED_IMPORTS`, un servicio por feature,
  `CHANGELOG`, `/version.json` (D-04): se comparan en la conversación y se descartan o quedan para otro change.
- Mover carpetas o renombrar archivos.

## Decisions

### D1. `paths` con alias por carpeta, no `baseUrl` con `src/app/...`
- **Qué:** en `tsconfig.json`, `"paths": { "@core/*": ["./src/app/core/*"], "@features/*":
  ["./src/app/features/*"], "@layout/*": ["./src/app/layout/*"], "@testing/*": ["./src/app/testing/*"],
  "@env/*": ["./src/environments/*"] }`. Sin `baseUrl` (TypeScript 5 resuelve `paths` relativos al
  `tsconfig`).
- **Regla:** alias cuando se cruza de una carpeta de primer nivel a otra (por ejemplo, de `features/sales` a
  `core`); `./` dentro de la misma (de `features/sales/store` a `features/sales`, `../` está bien). Lo que
  queda fuera de las carpetas con alias (`src/assets/i18n/es.json`) sigue relativo.
- **Por qué no `src/app/...`:** amarra cada importación a la raíz del repo y no dice de qué capa viene; los
  alias son cortos y muestran la dependencia (`@core` desde un feature).
- **Alcance:** `tsconfig.json` es la base de `tsconfig.app.json`, `tsconfig.spec.json` y `e2e/tsconfig.json`,
  así que los tres ven los alias. El esbuild de Angular y el runner de Vitest de `@angular/build` respetan
  `paths`.

### D2. `app.config.ts` por secciones
- **Qué:** `export const appConfig: ApplicationConfig` en `src/app/app.config.ts`, con secciones
  `// ===== HTTP =====`, `// ===== I18N =====`, `// ===== AVISOS =====`, `// ===== NGRX =====` y
  `// ===== ROUTER =====`. `main.ts` queda en `bootstrapApplication(AppComponent, appConfig).catch(...)`.
- **Prueba:** `app.config.spec.ts` verifica con `TestBed.configureTestingModule({ providers: appConfig.providers })`
  que se inyectan `Notifier` (como `SwalNotifier`), el `Store` con los seis features, y que `HttpClient`
  pasa por `connectionInterceptor`.

### D3. NgRx estricto y DevTools fuera de producción
- **Qué:** `provideStore(reducers, { runtimeChecks: { strictStateImmutability: true,
  strictActionImmutability: true, strictStateSerializability: true, strictActionSerializability: true } })`
  y `...environment.devProviders`: `environment.development.ts` lleva `[provideStoreDevtools({ maxAge: 25 })]`
  y `environment.ts`, `[]`.
- **Por qué en `environment` y no con una condición en `app.config.ts`:** con
  `environment.production ? [] : [provideStoreDevtools(...)]` las DevTools no se registraban en producción,
  pero el `import` estático las dejaba en el bundle (se comprobó buscando `__REDUX_DEVTOOLS_EXTENSION__`).
  Importadas solo desde `environment.development.ts`, `fileReplacements` las saca del build de producción.
  `isDevMode()` tiene el mismo problema que la condición.
- **Riesgo conocido:** un reducer o un componente que hoy mute el estado empezará a fallar en desarrollo.
  Es justo lo que se busca; se corrige en la tarea donde aparezca y, si es anterior y grande, se registra.

### D4. `src/environments/` con `fileReplacements`
- **Qué:** `environment.ts` (`production: true`, `apiBaseUrl: 'http://localhost:5028/api'`) y
  `environment.development.ts` (`production: false`, misma URL). En `angular.json`, la configuración
  `development` reemplaza el primero por el segundo. `PosApiService` usa `environment.apiBaseUrl` desde
  `@env/environment`.
- **Pruebas unitarias:** el builder `unit-test` compila con la configuración `development` del build, así que
  las pruebas ven `environment.development.ts` (con las DevTools). `pos-api.service.spec.ts` compara contra
  `environment.apiBaseUrl` en lugar del literal, y el bundle de producción se revisa aparte.
- **Alternativa descartada:** `InjectionToken<string>` para la URL. Agrega una capa sin necesidad mientras haya
  un solo valor por build; se puede agregar cuando P-08 lo pida.

### D5. `.editorconfig`
- Agrega `[*.ts] quote_type = single`. Ya hay `indent_size = 2`, `insert_final_newline` y
  `trim_trailing_whitespace`.

## Risks / Trade-offs

- [Una importación con alias que la E2E de Playwright no resuelva] → La E2E solo importa
  `src/app/testing/translate.ts`, que importa `../../assets/i18n/es.json` (fuera de los alias). Si algún archivo
  que importa la E2E llegara a usar un alias, `npx tsc -p e2e/tsconfig.json` y la corrida de E2E lo detectan.
- [`runtimeChecks` rompe un flujo en desarrollo] → `npm test` y `npm run test:e2e` completos corren contra
  `ng serve` (desarrollo) antes de cerrar.
- [Muchas líneas cambiadas en un PR] → Los cambios de importaciones son mecánicos y van en un commit aparte
  de los de configuración.

## Migration Plan

1. Sin migración de datos. Revertir es revertir los commits.
2. El PR se abre después del de `dev-feat-compras-ventas-guiadas` (PR #3 del front), sobre el que está apilado.

## Open Questions

_(ninguna)_
