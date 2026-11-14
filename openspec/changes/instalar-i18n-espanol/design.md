## Context

Ningún texto de la app vive en un diccionario. Están fijos en:

- **Plantillas:** `layout/` (menú y barra superior) y las cinco páginas de `features/`.
- **Métodos que devuelven etiquetas:** `amountLabel`, `modeLabel`, `importanceStatus`,
  `inventoryTotalLabel`, `expenseAreaLabel` y similares.
- **Diálogos del navegador:** los `window.prompt`/`alert` de `core/sales-auth.guard.ts` y los
  `window.confirm` de Ventas.
- **Mensajes de respaldo** de los effects y de las fachadas (`'No fue posible cargar…'`).

`@ngx-translate/core` no está en `package.json`. La versión actual, 18.1.0, pide Angular ≥ 18, así que
encaja con Angular 21. La app no registra `LOCALE_ID`, por eso `CurrencyPipe` usa `en-US` y muestra
«MX$».

Las pruebas dependen de los textos. Los locators de `e2e/ventas/` y `e2e/compras-inventario/` los
repiten como constantes (con un comentario que ya anticipa P-01), y algunos `*.spec.ts` de componentes
comprueban texto renderizado.

Fuera de esta app, pero relacionado: los mensajes de error de carga se guardan en cada store y ninguna
pantalla los muestra. Mostrarlos es P-16 (aviso de conexión), no este change.

## Goals / Non-Goals

**Goals:**
- Todo texto visible sale de `src/assets/i18n/es.json`, con la ortografía corregida.
- Los importes, números y fechas usan el formato `es-MX`.
- `i18n:check` impide claves faltantes o huérfanas, igual que `logs:check` impide logs de depuración.
- Las pruebas leen los textos del diccionario.
- Cada pantalla se comporta igual que antes.

**Non-Goals:**
- **Otro idioma:** no se agrega ni se prepara un selector de idioma (`CLAUDE.md`: solo español).
- **Plurales:** no se corrigen («1 bultos»). ngx-translate no trae ICU, y la redacción se mantiene como
  está.
- **Defecto del ticket:** no se corrige que imprima «bulto» para los productos por pieza (P-19).
- **Valores que se guardan como datos:** no se traducen el cliente «Publico general», el proveedor «Sin
  proveedor», las categorías de producto ni las de gasto. Cambiarlos cambiaría lo que llega a `aba.db`.
- **Mensajes del backend:** no se tocan.
- **Cambios de diseño de pantalla y control de flujo:** este change no rediseña ninguna pantalla (eso
  son P-16 a P-25) ni migra `*ngIf`/`*ngFor` (DT-01).

## Decisions

### D1. Diccionario dentro del bundle, con un cargador propio
`es.json` se importa en TypeScript (`resolveJsonModule`) y un `TranslateLoader` propio
(`core/i18n/es-json.loader.ts`) lo entrega con `of(es)`. Se registra con `provideTranslateService` en
`main.ts`, con `lang` y `fallbackLang` en `'es'`. La forma exacta del proveedor se valida contra la
versión instalada.

- **Por qué:** los textos existen desde el primer render, así que no se ven claves mientras carga y
  `TranslateService.instant()` funciona en el guard sin esperar. Las pruebas unitarias usan el mismo
  cargador sin `HttpClient`. Con un solo idioma, el archivo es pequeño.
- **Alternativa descartada:** `@ngx-translate/http-loader` desde `/assets/i18n/es.json`. Agrega una
  petición, deja ver las claves un instante y obliga a esperar la carga en el guard y en las pruebas.
  Además, si el backend falla, la app no se entera, pero si falla esta petición, no hay ningún texto.

### D2. Claves por área, en camelCase y en inglés
Las claves de primer nivel son `common`, `menu`, `topbar`, `dashboard`, `sales`, `seller`,
`purchases`, `expenses`, `inventory` e `history`. Por ejemplo: `dashboard.quickWork.title`,
`sales.checkout.finish`, `common.units.bags`. Los textos con cantidades interpolan parámetros (por
ejemplo, `"common.units.bagsCount": "{{count}} bultos"`), sin concatenar en el código.

- **Por qué:** las claves en inglés siguen a los nombres de los features (`features/sales`), y agrupar
  por área permite ver en `es.json` qué textos tiene cada pantalla.
- **Textos repetidos:** un texto que se repite («Guardar», «Producto», «Total») va en `common.*` solo si
  significa lo mismo en todos los lugares.

### D3. El código TypeScript devuelve claves, no textos
- **Métodos de etiqueta:** `modeLabel`, `amountLabel`, `expenseAreaLabel` y similares devuelven la
  clave, y la plantilla la traduce. Si el texto solo junta datos de la vista, la plantilla lo arma con
  parámetros (`'common.units.bagsCount' | translate: { count }`).
- **Textos con datos que arma el código** (`quoteDetail`, `lineDetail`, `inventoryTotalLabel`,
  `supplierLabel`, `purchaseQuantityLabel`): se traducen al armarlos con `TranslateService.instant()` y
  devuelven el texto final. Con el cargador síncrono de D1, `instant()` siempre encuentra el diccionario.
  En la implementación esto reemplazó el `{ key, params }` que se planeó, que obligaba a llamar dos veces
  al método desde la plantilla.
- **Estado del Tablero:** `importanceStatus` deja de devolver el texto `'Cubierto' | 'Revisar'` (que
  también se usa para comparar) y devuelve un código `'covered' | 'review'`. La plantilla lo traduce.
- **Guard y `confirm` de Ventas:** usan `TranslateService.instant()`.
- **Avisos y mensajes de respaldo:** los respaldos de effects y fachadas pasan a ser claves. Los avisos
  de Ventas y Compras (`message()`, `expenseMessage()`) se traducen con `instant()` al asignarlos. Si
  llega un mensaje del backend, no es una clave, y ngx-translate lo devuelve tal cual, que es lo que pide
  la spec.
- **Claves literales completas:** ninguna clave se arma concatenando (`'sales.mode.' + mode`). Las
  correspondencias se escriben como mapas con la clave completa, para que `i18n:check` (D5) las vea.

### D4. Formato regional es-MX
En `main.ts` se registra `registerLocaleData(localeEsMx)` y se proveen `LOCALE_ID: 'es-MX'` y
`DEFAULT_CURRENCY_CODE: 'MXN'`. `CurrencyPipe`, `DecimalPipe` y `DatePipe` lo toman solos, y los
formatos explícitos de fecha (`'dd/MM/yyyy HH:mm'`) se quedan igual. Los `Intl.NumberFormat('es-MX')`
y `toLocaleString('es-MX')` que ya existen no cambian.

### D5. `i18n:check` en `scripts/i18n/check-i18n-keys.mjs`
El script se ejecuta con Node, sin dependencias, en el mismo estilo que `scripts/logs/check-debug-logs.mjs`:

1. Aplana `es.json` en claves con puntos.
2. Recorre los `.ts` de `src/app` que no son `*.spec.ts`.
3. Toma como clave usada todo literal de cadena cuyo primer segmento sea uno de los de primer nivel
   de `es.json` (D2).
4. Falla si alguna clave usada no existe en el diccionario, o si alguna clave del diccionario no se
   usa, y nombra cada clave y archivo.

Corre en `prebuild` y `pretest` después de `logs:check`.

- **Alternativa descartada:** `ngx-translate-extract`. Es otra dependencia, reescribe el JSON y no
  detecta claves huérfanas sin configuración adicional.
- **Límite conocido:** no detecta un literal en español que se quedó fijo en una plantilla. Eso lo
  cubren la revisión de cada pantalla (tareas 3.x) y la QA.

### D6. Las pruebas leen el diccionario
- **Unitarias:** los `*.spec.ts` que renderizan textos o traducen agregan a su `TestBed` el mismo
  `provideI18n()` de la app (`core/i18n/provide-i18n.ts`, con el cargador de D1 y el locale de D4).
  `src/app/testing/translate.ts` exporta `t(clave, params)`, que lee `es.json` con la misma
  interpolación `{{param}}` y falla si la clave no existe. Las aserciones de texto comparan con `t()`,
  no con literales.
- **E2E:** `e2e/support/textos.ts` reexporta ese mismo `t()`. Los `*.locators.ts` cambian sus constantes
  (`PIDE_ID`, `ESTA_REGISTRADA`…) y sus nombres de rol por `t(...)`.

### D7. Pantalla por pantalla, con la app funcionando en cada paso
1. Infraestructura: dependencia, proveedor, locale, `i18n:check`, ayudas de prueba y `layout/`.
2. Una tarea por pantalla: plantilla, código TS, sus `*.spec.ts`, sus locators E2E y su `README.md`.
3. Al final, la revisión de que no queden literales.

Así cada paso pasa `npm run build` y `npm test`, y se puede hacer un commit por pantalla.

## Risks / Trade-offs

- **Un literal se queda fijo y nadie lo nota.** `i18n:check` no lo ve.
  → **Mitigación:** buscar con `grep` los textos entre etiquetas y en atributos (`placeholder`,
  `title`) de cada plantilla al cerrar su tarea, más la QA de la spec «ninguna pantalla muestra una
  clave».
- **Corregir la ortografía rompe pruebas que buscan el texto viejo.**
  → **Mitigación:** D6 hace que las pruebas tomen el texto del diccionario, y se migran en la misma
  tarea que su pantalla.
- **Cambia la forma de los importes («MX$» → «$»).** Una prueba que compare importes como texto
  fallaría.
  → **Mitigación:** buscar `MX$` en `src/` y `e2e/` antes de la tarea 2 y ajustarlo en la misma tarea.
- **El código de estado del Tablero cambia de `'Revisar'` a `'review'`.** Sus pruebas cambian.
  → **Mitigación:** se actualizan en la tarea del Tablero. El comportamiento es el mismo.
- **La API de `provideTranslateService` cambió entre versiones de ngx-translate.**
  → **Mitigación:** D1 se valida contra la versión instalada, y la versión queda fija en
  `package.json`.

## Migration Plan

Sin datos ni backend que migrar. Revertir es revertir los commits de la rama.

## Open Questions

_(ninguna)_. Los valores que se guardan como datos («Publico general», categorías) se quedan como
están (Non-Goals). Si se quiere corregir su ortografía, es un change aparte que también toca el
backend y los datos de `aba.db`.
