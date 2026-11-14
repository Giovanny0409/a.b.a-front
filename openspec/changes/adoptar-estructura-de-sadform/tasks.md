## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, en el mismo commit que los artefactos: registrar que
  `dev-refactor-estructura-como-sadform` está apilada sobre `dev-feat-compras-ventas-guiadas` (PR #3 del
  front) y que su PR va después.

## 2. Configuración base

- [x] 2.1 `.editorconfig`: `[*.ts] quote_type = single` (D5).
- [x] 2.2 `src/environments/environment.ts` y `environment.development.ts` con `production` y `apiBaseUrl`,
  y `fileReplacements` en la configuración `development` de `angular.json` (D4).
- [x] 2.3 `tsconfig.json` con `paths` para `@core/*`, `@features/*`, `@layout/*`, `@testing/*` y `@env/*`
  (D1). Comprobar que `npm run build`, `npm test` y `npx tsc -p e2e/tsconfig.json` siguen pasando antes de
  tocar importaciones.

## 3. Composición de la app

- [x] 3.1 `src/app/app.config.ts` con los providers de `main.ts` agrupados por secciones; `main.ts` solo
  arranca (D2). Agregar `app.config.spec.ts`: `Notifier` es `SwalNotifier`, el store tiene los seis
  features y `HttpClient` pasa por `connectionInterceptor`.
- [x] 3.2 `provideStore` con los cuatro `runtimeChecks` estrictos y `provideStoreDevtools({ maxAge: 25 })` solo
  si `!environment.production` (D3). Probar en `app.config.spec.ts` que un reducer que muta el estado lanza
  error. Si `npm test` o la E2E encuentran una mutación existente, corregirla aquí con su prueba, o registrarla
  si es grande.
  - **Evidencia:** `app.config.spec.ts` (5 pruebas): `SwalNotifier`, los seis features, `push` sobre el estado
    lanza `TypeError`, las DevTools en desarrollo y el interceptor. Las DevTools se movieron a
    `environment.development.ts` (`devProviders`) porque, con la condición en `app.config.ts`, el build de
    producción las seguía trayendo: `__REDUX_DEVTOOLS_EXTENSION__` aparece en 0 archivos del build de
    producción y en 1 del de desarrollo. `npm test`: 32 archivos, 199 pruebas; ninguna mutación encontrada.
- [x] 3.3 `PosApiService` toma la URL de `environment.apiBaseUrl` (`@env/environment`) y desaparece la
  constante fija; `pos-api.service.spec.ts` compara contra `environment.apiBaseUrl` (D4).
  - `API_BASE_URL` pasó a `private readonly baseUrl` del servicio; `localhost:5028` solo queda en
    `src/environments/`.

## 4. Importaciones con alias (commit aparte)

- [ ] 4.1 Reemplazar en `src/app/**` (código y `*.spec.ts`) las importaciones que cruzan de una carpeta de
  primer nivel a otra por su alias, y dejar relativas las de la misma carpeta (D1). Comprobar que no quedan
  `../../` hacia carpetas con alias.
- [ ] 4.2 `npm run build` (con `logs:check` e `i18n:check`), `npm test` y `npx tsc -p e2e/tsconfig.json`.

## 5. Documentación

- [ ] 5.1 `CLAUDE.md`, Principio 3: los alias, `app.config.ts` y `src/environments/`. Actualizar el contexto de
  `openspec/config.yaml` solo si repite esa parte (sin corregir P-26 aquí).
- [ ] 5.2 README que describen importaciones, arranque o la URL del backend: `features/*/README.md` (sección
  Dependencias o Servicios y endpoints), `e2e/README.md` si menciona la URL, y el `README.md` raíz si lo hace.

## 6. QA y cierre

- [ ] 6.1 QA con la skill `qa-playwright`: `npm run test:e2e` completo contra `ng serve` (desarrollo, con los
  `runtimeChecks` activos) y el backend de esta rama. Anotar aquí la evidencia. Revisar en el navegador que
  las Redux DevTools reciben el estado en desarrollo.
- [ ] 6.2 Revisar que no queden huérfanos: la constante `API_BASE_URL`, providers repetidos en `main.ts` ni
  importaciones sin usar. `openspec validate adoptar-estructura-de-sadform --strict`.
- [ ] 6.3 En `docs/PENDIENTES.md`, cerrar el registro de la rama apilada si ya no aplica, anotar en P-08 que la
  URL ya es configurable, y registrar lo que haya aparecido.
