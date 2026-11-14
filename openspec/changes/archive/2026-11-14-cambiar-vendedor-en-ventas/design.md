## Context

`salesAuthorizationGuard` (`canMatch` de `/ventas`) lee `selectActiveSeller`: si hay vendedor, deja pasar;
si no, pide el ID con `window.prompt`, despacha `authorizeSeller` y espera la respuesta. El reducer guarda
`activeSeller` y nada lo vuelve a `null` salvo una autorización fallida, así que después del primer
vendedor el guard nunca vuelve a preguntar. El back registra cada venta con el `sellerId` que manda el
front (`Customer = "<cliente> | Vendedor: <nombre>"`), así que el back está bien: el front siempre manda
al primero.

## Goals / Non-Goals

**Goals:** ver quién cobra, cambiarlo sin recargar, y una suite E2E que habría detectado el defecto.

**Non-Goals:** cerrar sesión por inactividad; administrar vendedores (siguen fijos en `PosStore`).

## Decisions

**D1. Acción `clearSeller` y `changeSeller()`.** `SalesActions.clearSeller` deja `activeSeller` en
`null`. `SalesStore.changeSeller()` la despacha y navega a `/ventas` con
`onSameUrlNavigation: 'reload'`: el router vuelve a reconocer la ruta y corre el `canMatch`, que pide el
ID. Si se cancela, el guard ya redirige al Tablero. Los tickets guardados viven en el store y no se tocan.

**D2. Mostrar al vendedor en la barra de Ventas.** En `.sales-toolbar`, antes de «Tickets guardados»: un
`span.badge.ok` con «Vendedor: <nombre>» y un `button.btn.secondary` «Cambiar vendedor». Se reutilizan
`_badges.scss` y `_buttons.scss`; `.sales-toolbar` solo suma `align-items` y `gap`.

**D3. Suite E2E primero.** `e2e/ventas/` se escribe y se corre antes de corregir, y debe fallar en
«Cambiar de vendedor». Prepara existencia comprando por la API (`POST /api/purchases`) con el catálogo, y
verifica a nombre de quién quedó cada venta en la respuesta de `POST /api/sales/batch` (`customer`) y en
`GET /api/sales`.

## Risks / Trade-offs

- [`onSameUrlNavigation: 'reload'` no corriera el `canMatch`] → la suite E2E lo comprueba; si no, se
  navega al Tablero y de vuelta a Ventas.
- [Texto sin i18n] → P-01.
