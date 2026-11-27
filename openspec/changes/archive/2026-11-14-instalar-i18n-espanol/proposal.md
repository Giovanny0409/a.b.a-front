## Why

El Principio 1 de `CLAUDE.md` exige que todo texto visible viva en `src/assets/i18n/es.json`, pero
`ngx-translate` no está instalado y ese archivo no existe (P-01). Todos los textos están fijos en las
plantillas y en el código, y varios llevan faltas de ortografía que se ven en la app («Trabajo rapido»,
«Inversion», «Categoria», «Total dia», «Minimo»). Las importes salen como «MX$0.00» porque la app corre
con el formato regional en inglés. Va primero porque las mejoras de pantalla que siguen
(P-16 a P-25) tocan todas las pantallas, y sin esto cada una agregaría textos fijos o tendría que instalar
i18n por su cuenta.

## What Changes

- Instalar `@ngx-translate/core` y registrar el servicio de traducción en `main.ts`, con español como
  único idioma, cargado desde `src/assets/i18n/es.json` dentro del bundle (sin petición HTTP ni
  claves visibles mientras carga).
- Crear `src/assets/i18n/es.json` y llevar a claves **todos** los textos visibles de la app: el menú y la
  barra superior (`layout/`), las cinco pantallas (Tablero, Ventas, Compras, Inventario, Historial), los
  avisos de los effects y de las fachadas, y los `prompt`/`alert`/`confirm` del guard de vendedor y de
  Ventas.
- Corregir la ortografía de los textos al pasarlos a `es.json` (acentos y signos de apertura «¿»).
- Formato regional `es-MX` para moneda, números y fechas: los importes se ven como «$1,250.00» en lugar
  de «MX$1,250.00».
- Nuevo `npm run i18n:check`, que corre antes de `build` y `test` junto con `logs:check`: falla si una
  clave usada en el código no existe en `es.json` o si una clave de `es.json` no se usa (Principio 5).
- Las pruebas E2E y unitarias toman los textos de `es.json` en lugar de repetirlos, para que un cambio de
  redacción no rompa una prueba.
- Registrar en `docs/PENDIENTES.md` las mejoras de la revisión de pantallas (P-16 a P-25) y el error de
  YAML de `openspec/config.yaml` (P-26), sin corregirlos aquí.

## Capabilities

### New Capabilities
- `i18n`: los textos visibles salen de `es.json` (único idioma, español), con ortografía correcta y
  formato regional `es-MX`; `i18n:check` impide claves faltantes o huérfanas.

### Modified Capabilities
_(ninguna: los textos cambian de lugar y de ortografía, pero ningún requisito de `sales`, `purchases`,
`inventory`, `expenses`, `e2e-qa` ni `unit-tests` cambia)_

## Impact

- Front (`a.b.a-front`): `package.json` (`@ngx-translate/core`, script `i18n:check`), `src/main.ts`,
  nuevo `src/app/core/i18n/` (proveedor y cargador), nuevo `src/assets/i18n/es.json`, nuevo
  `scripts/i18n/check-i18n-keys.mjs`; las plantillas de `layout/` y de las cinco páginas;
  `core/sales-auth.guard.ts`; los `*.effects.ts` y fachadas con textos; sus `*.spec.ts`;
  `src/app/testing/` (proveedor de traducción para pruebas); `e2e/*/*.locators.ts`; los `README.md` de
  los cinco features; `e2e/README.md`; `CLAUDE.md` y `openspec/config.yaml` (P-01 deja de ser
  excepción); `docs/PENDIENTES.md`.
- Back: no se toca. Los mensajes de error que manda el backend (`error.error.message`) se siguen
  mostrando tal cual; ya están en español.
- Sin cambios de comportamiento: cada pantalla hace lo mismo, con los textos en `es.json`.
- Rama: `dev-feat-i18n-espanol`, desde `dev`.
