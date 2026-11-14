# E2E (Playwright)

## Descripción

Batería de pruebas de punta a punta con [Playwright](https://playwright.dev/) que prueba la app como la
usa una persona: el front local (`http://127.0.0.1:4200`) contra el backend local
(`http://localhost:5028`) y su base `aba.db`. No hay login que preparar; la app no tiene autenticación,
salvo el ID de vendedor de Ventas.

## Alcance

- `compras-inventario`: registra desde Compras una compra por proveedor: alimento para pollo de engorda de
  dos marcas (Malta Cleyton y Purina), cada una a su proveedor, y un comedero por pieza a un tercero.
  Verifica el cuerpo y la respuesta de cada `POST /api/purchases`, que cada compra queda con su proveedor y
  teléfono, y que en Inventario las dos marcas son productos distintos y cada una sube exactamente lo
  comprado.
- Solo Chromium, con un solo worker: todas las suites comparten el mismo backend y la misma base.
- Fuera de alcance por ahora: Ventas, Gastos, Historial y Tablero (cada suite llega con el change que
  toque esa pantalla), CI y otros navegadores.

## Estructura de archivos

```text
e2e/
├── README.md
├── tsconfig.json                          # tipos de Node; ../tsconfig.json fija rootDir en src/
├── support/
│   ├── catalogo.ts                        # PROVEEDORES y PRODUCTOS con nombres reales
│   └── api.ts                             # existencia() y ultimaCompra(): lecturas del backend
└── compras-inventario/
    ├── compras-inventario.locators.ts     # locators de Compras e Inventario
    └── compras-inventario.spec.ts
```

Cada suite vive en su carpeta con `<suite>.locators.ts` y `<suite>.spec.ts`. La configuración está en
[`../playwright.config.ts`](../playwright.config.ts).

## Cómo correr

```bash
npm run test:e2e                              # toda la batería
npx playwright test e2e/compras-inventario    # una suite
npm run test:e2e:ui                           # UI interactiva
npx playwright show-trace test-results/<prueba>/trace.zip
```

- Playwright revisa por separado el backend (`http://localhost:5028/api/products`) y el front
  (`http://127.0.0.1:4200`). Reutiliza el que ya responda y arranca solo el que falte: `dotnet run
  --launch-profile http` en `../a.b.a-back` (o en `ABA_BACKEND_PATH`) y `ng serve` en `:4200`. Espera hasta
  180 s a los dos y, al terminar, cierra solo lo que arrancó.
- Si cambiaste el back, detén el backend que esté corriendo antes de la batería: si no, Playwright reutiliza
  el que tiene el código anterior.
- La primera vez en una máquina: `npm ci` y `npx playwright install chromium`.
- La QA de cada change se hace con la skill `qa-playwright` (`.claude/skills/qa-playwright/SKILL.md`).

## Datos de prueba

- Las suites escriben en `aba.db`. Hasta la entrega todo lo que hay ahí es de prueba (D-06 de
  `docs/PENDIENTES.md`).
- Los datos salen de `support/catalogo.ts`: productos y proveedores con nombres reales, siempre los
  mismos (D-07). El back reutiliza productos y proveedores por nombre, así que cada corrida suma
  inventario a los mismos productos.
- Por eso **ninguna prueba compara contra un valor absoluto**: lee el antes con `support/api.ts` y espera
  `antes + lo que hizo`.
- La misma mercancía de dos marcas lleva la marca en el nombre del producto: el back identifica el producto
  por nombre, y así quedan como dos productos.
- El backend no tiene endpoints de borrado, así que nada se limpia; la base completa se limpia antes de
  entregar (P-08).

## Pruebas

- `compras-inventario` pasa con el front y el backend arriba o apagados, y en corridas seguidas contra la
  misma base.
- El reporte HTML queda en `playwright-report/` y el detalle de cada falla en
  `test-results/<prueba>/` (`error-context.md` con la foto del DOM y `trace.zip`). Las dos carpetas están
  en `.gitignore`.

## Limitaciones y trabajo pendiente

- Corre contra la base de uso real; aislarla en su propia base y puerto es P-08.
- Sin CI: se corre localmente.
- Solo Chromium.

## Notas de mantenimiento

- Los locators dependen del texto de las plantillas. Cuando los textos pasen a `es.json` (P-01), se
  actualizan en el `<suite>.locators.ts`.
- Los botones con icono de PrimeIcons tienen el glifo al inicio del nombre accesible: se buscan con una
  expresión regular (`/Producto$/`), no con `exact: true`.
