# code-structure Specification

## Purpose

Cubre las convenciones de estructura del front que se pueden verificar: las importaciones con alias entre carpetas de `src/app`, la composición de la app en `app.config.ts` con los checks estrictos de NgRx y las DevTools solo en desarrollo, y la URL del backend desde `src/environments/`.

## Requirements

### Requirement: Importaciones con alias entre carpetas
El código de `src/app` SHALL importar con un alias (`@core/*`, `@features/*`, `@layout/*`, `@testing/*`,
`@env/*`) cuando el archivo importado está en otra carpeta de primer nivel de `src/app` o en
`src/environments`. Las importaciones dentro de la misma carpeta de primer nivel SHALL seguir siendo
relativas. Ninguna importación de `src/app` SHALL subir dos o más niveles (`../../`) hacia otra carpeta de
primer nivel.

#### Scenario: Un feature importa de core
- **WHEN** `features/sales/sales.store.ts` usa `PosApiService`
- **THEN** lo importa de `@core/pos-api.service` y no de `../../core/pos-api.service`

#### Scenario: Sin rutas relativas largas
- **WHEN** se buscan en `src/app` importaciones que empiezan con `../../`
- **THEN** solo quedan las que llegan a un archivo fuera de las carpetas con alias (por ejemplo, `src/assets`)

#### Scenario: La app compila y las pruebas corren con los alias
- **WHEN** se corren `npm run build`, `npm test` y `npx tsc -p e2e/tsconfig.json`
- **THEN** los tres terminan sin errores de resolución de módulos

### Requirement: La app se compone en app.config.ts
Los providers de la aplicación SHALL vivir en `src/app/app.config.ts` (`appConfig: ApplicationConfig`),
agrupados por secciones comentadas, y `src/main.ts` SHALL limitarse a `bootstrapApplication(AppComponent,
appConfig)`. El store de NgRx SHALL activar `strictStateImmutability`, `strictActionImmutability`,
`strictStateSerializability` y `strictActionSerializability`, y las Redux DevTools SHALL registrarse solo
fuera de producción.

#### Scenario: Arranque
- **WHEN** se abre `src/main.ts`
- **THEN** solo arranca `AppComponent` con `appConfig`, sin declarar providers

#### Scenario: Una mutación del estado se detecta
- **WHEN** un reducer o un componente muta un objeto del estado de NgRx en desarrollo o en pruebas
- **THEN** NgRx lanza un error en lugar de dejar pasar la mutación

#### Scenario: DevTools solo en desarrollo
- **WHEN** se compila con la configuración de producción
- **THEN** `appConfig` no registra `provideStoreDevtools`

### Requirement: La URL del backend viene de environments
`PosApiService` SHALL tomar la URL base del backend de `environment.apiBaseUrl` (`src/environments/`), y
ningún archivo de `src/app` SHALL tener la URL del backend escrita. La configuración de desarrollo SHALL usar
`environment.development.ts` mediante `fileReplacements`.

#### Scenario: Las peticiones usan la URL del ambiente
- **WHEN** `PosApiService` pide los productos
- **THEN** la petición va a `${environment.apiBaseUrl}/products`

#### Scenario: Sin URL fija
- **WHEN** se busca `localhost:5028` en `src/app` fuera de los `*.spec.ts`
- **THEN** no hay ninguna coincidencia
