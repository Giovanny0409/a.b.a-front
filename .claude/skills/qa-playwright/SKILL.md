---
name: qa-playwright
description: Prueba y valida con Playwright, en la app real (front :4200 y backend :5028), lo que cambió la rama en curso. Elige las suites de e2e/ que recorren las pantallas cambiadas, escribe o actualiza la suite del change con los escenarios de sus specs, corre todo, separa defectos del producto de pruebas viejas o frágiles, corrige lo que es del change y registra lo que no. Úsala sin que la pidan al terminar de implementar un change que toque una pantalla, antes de marcar su tarea de QA y antes de abrir el PR. Úsala también cuando pidan "prueba esto", "valídalo", "haz la QA", "corre las pruebas e2e", "¿funciona en la app?", "revisa la pantalla" o "corre Playwright".
license: MIT
compatibility: Requiere Node 22+, las dependencias del proyecto (@playwright/test con Chromium instalado) y el SDK de .NET 9 para el backend.
metadata:
  version: "1.0"
---

La batería de [`e2e/`](../../../e2e/README.md) prueba la app como la usa una persona: el front local de
la rama contra el backend local y `aba.db`. **Las pruebas unitarias no bastan**: un change puede compilar y
pasar sus unitarias y aun así mandar un cuerpo que el backend no entiende o no reflejarse en otra pantalla.

```bash
npm run test:e2e                                   # toda la batería
npx playwright test e2e/compras-inventario         # una suite
npm run test:e2e:ui                                # UI interactiva, para depurar
npx playwright show-trace test-results/<prueba>/trace.zip
```

Si la app no está corriendo, Playwright ejecuta `npm start` (backend y front) y la cierra al terminar; si
ya está corriendo, la reutiliza.

## Cuándo correrla

- **Al terminar de implementar** un change que toque `src/app/features/<pantalla>/`, `src/app/core/` o
  `src/app/layout/`, antes de marcar su tarea de QA en `tasks.md`.
- **Antes de abrir el PR**, si hubo commits desde la última corrida.
- **No aplica** en un change solo de documentación, de scripts o del backend que no cambie lo que ve la
  persona. Se marca la tarea diciendo por qué.

## Flujo

1. **Elegir.** Por cada carpeta cambiada en `src/app/features/<pantalla>/`, las suites de `e2e/` que
   recorren esa pantalla (lo dice el nombre de la suite y su cabecera). Un cambio en `core/`
   (`pos-api.service.ts`, `pos.models.ts`) o en `layout/` toca todas: corre la batería completa.
2. **Escribir la suite del change.** Lo nuevo se prueba en `e2e/<capacidad-o-flujo>/`, con un escenario
   por cada `WHEN/THEN` de las specs del change. Referencia: [`e2e/compras-inventario/`](../../../e2e/compras-inventario/).
   - Verifica las tres capas: lo que se ve, el cuerpo que se manda (`page.waitForRequest` +
     `postDataJSON()`) y lo que responde el backend (`page.waitForResponse`).
   - Los datos se nombran con `nombrePrueba(marca, sufijo)` de `e2e/support/test-data.ts`
     (`PW_<marca>_<sufijo>`). El backend no tiene borrado: la marca evita choques entre corridas. La
     prueba la anota con `test.info().annotations.push({ type: 'datos', description: \`PW_${marca}_*\` })`
     para que el reporte diga qué datos creó.
   - Los locators van en `<suite>.locators.ts`; dependen del texto de las plantillas.
   - Un flujo que cruza pantallas va en una sola prueba, o en serie (`test.describe.configure({ mode:
     'serial' })`) sobre una página creada en `beforeAll`.
3. **Correr** las suites elegidas más la del change.
4. **Leer cada falla** en `test-results/<prueba>/error-context.md` (foto del DOM) y su `trace.zip`, y
   clasificarla antes de tocar nada:

   | Qué es | Cómo se reconoce | Qué se hace |
   |---|---|---|
   | Defecto del change | Lo que la spec pide no ocurre: cuerpo, respuesta o pantalla | Se corrige en la rama y se anota en `tasks.md` |
   | Prueba vieja | El change cambió ese comportamiento a propósito | Se actualiza la prueba, explicando en un comentario qué cambió |
   | Prueba frágil | Depende de un texto exacto, del orden de filas o de un tiempo | Se arregla la prueba con las recetas de abajo |
   | Defecto anterior al change | Falla igual sin el change y no es de lo que el change toca | Se registra en `docs/PENDIENTES.md` en el mismo commit, y no se corrige aquí |

   Nunca se debilita una aserción para que pase. Si una prueba no puede verificar lo que la spec pide,
   la spec o la prueba están mal, y eso se pregunta.
5. **Dejar evidencia** en la tarea de QA de `tasks.md`: suites y resultado (`N pasaron`), el ambiente
   (front `:4200`, backend `:5028`, `aba.db`), la marca de los datos creados y los defectos encontrados,
   con su tarea o su ID de `PENDIENTES`.

## Datos

- Hasta la entrega, todo en `aba.db` es de prueba (D-06), y las suites escriben ahí. Antes de entregar se
  limpia y se aísla la batería (P-08).
- Nunca se tocan registros que no lleven el prefijo `PW_` de la corrida.

## Recetas que ya costaron una corrida

- **Botones con icono de PrimeIcons**: el nombre accesible empieza con el glifo del icono (`" Producto"`),
  así que `getByRole('button', { name: 'Producto', exact: true })` no lo encuentra. Usa una expresión
  regular anclada al final: `{ name: /Producto$/ }`.
- **`select` nativo**: `selectOption('<value>')` con el `value` de la opción (`bag`, `unit`), no con su
  texto.
- **`input` con `datalist`**: es un `input` normal; `fill()` basta, no hay overlay que elegir.
- **Campos que aparecen según otro** (`markedKg` y `salePriceKg` solo en líneas «Bultos»): cambia primero
  el tipo de la línea y luego llena sus campos.
- **ID de vendedor de Ventas**: el guard lo pide con `window.prompt`. Regístrate antes de navegar:
  `page.once('dialog', (dialog) => dialog.accept('<id>'))`.
- **Columnas de una tabla**: localiza la fila por el texto de su primera celda y la columna por índice,
  con el índice como constante con nombre en el `.locators.ts`.

## Después

- La suite del change se queda en `e2e/` y se versiona con el change: es la prueba de regresión de lo que
  se hizo.
- Si una receta nueva costó una corrida, agrégala aquí.
