## Why

Al comparar el front con Sadform.Front (proyecto hermano del equipo, solo como referencia de lectura) salieron
cuatro prácticas que aquí faltan y que ya cuestan: 88 importaciones relativas con `../../` y `../../../` que se
rompen al mover un archivo; un `main.ts` que mezcla el arranque con todos los providers; NgRx sin
`runtimeChecks`, así que una mutación del estado pasaría sin aviso, y `@ngrx/store-devtools` instalado sin
usarse; y la URL del backend fija en `pos-api.service.ts`, que impide apuntar las pruebas E2E a otra base y
puerto (P-08). Conviene ahora, antes de los changes de pantallas que siguen (P-16 a P-25), para que nazcan
con la estructura nueva.

## What Changes

- **Alias de importación:** `tsconfig.json` define `@core/*`, `@features/*`, `@layout/*`, `@testing/*` y
  `@env/*`. Las importaciones de `src/app` que cruzan de una carpeta de primer nivel a otra pasan a alias;
  las de la misma carpeta siguen con `./`.
- **`app.config.ts`:** los providers salen de `main.ts` a `src/app/app.config.ts`, agrupados por secciones
  (HTTP, i18n, avisos, NgRx, router). `main.ts` solo arranca la app.
- **NgRx:** `provideStore` con `runtimeChecks` estrictos (inmutabilidad y serialización del estado y de las
  acciones) y `provideStoreDevtools` solo fuera de producción.
- **URL de la API configurable:** `src/environments/environment.ts` y `environment.development.ts`, con
  `fileReplacements` en `angular.json`; `PosApiService` toma la URL de ahí. Hoy los dos valen
  `http://localhost:5028/api`.
- **`.editorconfig`:** `quote_type = single` para `*.ts`.
- Sin cambios de comportamiento visibles: las pantallas, el contrato con el backend y los textos no cambian.

## Capabilities

### New Capabilities
- `code-structure`: convenciones de estructura del front que se pueden verificar: alias de importación,
  composición de la app en `app.config.ts` con los checks de NgRx, y la URL del backend desde `environments`.

### Modified Capabilities
_(ninguna)_

## Impact

- **Front (`a.b.a-front`):** `tsconfig.json`, `angular.json`, `.editorconfig`, `src/main.ts`, nuevo
  `src/app/app.config.ts` (y su `*.spec.ts`), nuevo `src/environments/`, `core/pos-api.service.ts` y las
  importaciones de `src/app/**`. `CLAUDE.md` (Principio 3) y los README que describen la estructura.
- **Back:** no se toca.
- **Dependencias:** ninguna nueva (`@ngrx/store-devtools` ya está en `package.json`).
- **Ramas:** `dev-refactor-estructura-como-sadform`, apilada sobre `dev-feat-compras-ventas-guiadas`
  (PR #3 del front, aún abierto); su PR va después.
- **Sadform.Front no se modifica:** solo se leyó como referencia.
