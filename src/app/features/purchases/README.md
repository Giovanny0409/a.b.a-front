# Compras

## Descripción

Pantalla para registrar compras a proveedores (bultos y productos varios) y gastos de insumos (renta, luz, bolsas, comida, etc.), disponible en la ruta `/compras`.

## Responsabilidades y alcance

- Registrar una compra con una o más líneas, cada una de tipo `bag` (bulto) o `unit` (producto vario: correas, vitaminas, comederos, bebederos, jaulas, etc.).
- Dar de alta un producto nuevo desde la misma línea de compra si el nombre capturado no existe todavía en el catálogo (no requiere un alta previa por separado). La primera compra fija su tipo (`bag` o `unit`).
- Autollenar la línea de un producto existente: al escribir su nombre (sin importar mayúsculas ni espacios extremos), la línea toma su tipo, que queda fijo, su categoría, sus kg por bulto y sus últimos precios de venta. La cantidad y el costo no se tocan. Un nombre nuevo deja la línea editable y sin cambios.
- Capturar y reutilizar el proveedor (nombre + teléfono); si el nombre ya existe se reutiliza en vez de duplicarlo.
- Registrar gastos de insumos por apartado (`general`, `guardadito`, `camioneta`), que se descuentan de las ganancias en el tablero.
- No cubre: venta de productos (`features/sales`), ni edición de umbral mínimo (pendiente, ver hoja de ruta).

## Estructura de archivos

```text
purchases/
├── purchases-page.component.ts
├── purchases.store.ts
├── README.md
└── store/
    ├── purchases.actions.ts
    ├── purchases.effects.ts
    ├── purchases.reducer.ts
    └── purchases.selectors.ts
```

## Componentes

- `PurchasesPageComponent` (`aba-purchases-page`): formulario de compra con líneas dinámicas (`FormArray`), toolbar para alta rápida de proveedor, y panel independiente para registrar gastos de insumos.

## Modelos y contratos

Usa los modelos compartidos en `core/pos.models.ts`: `Product` (con `kind`), `ProductPurchaseDefaults`, `Supplier`, `PurchaseKind` (`'bag' | 'unit'`), `PurchaseLineInput`, `PurchaseRecord`, `ExpenseArea`, `ExpenseRecord`.

`ProductPurchaseDefaults` son los datos de la última compra de un producto. Para `unit`, `salePriceBag` es el precio de la pieza, igual que «Venta bulto/u.» en la línea, y `markedKg` y `salePriceKg` llegan en `null`.

`PurchaseRecord` representa **una línea de compra ya registrada** (no el ticket completo); si el formulario envía varias líneas en un solo envío, el backend crea y devuelve un `PurchaseRecord` por cada línea.

## Estado NgRx

`PurchasesState { products, purchaseDefaults, purchases, expenses, suppliers, error }`, expuesto vía `PurchasesStore` (fachada con `products()`, `suppliers()` y `purchaseDefaults()` como signals). El catálogo de proveedores (`suppliers`) se reconstruye combinando altas manuales (`addSupplier`, solo en memoria) con los proveedores que ya aparecen en `purchases` — no hay un endpoint dedicado de proveedores en el backend.

## Efectos y flujo de datos

- `loadProducts$`: `forkJoin` de `products`, `purchaseDefaults`, `purchases` y `expenses` (con `catchError` a `[]` para gastos, por si el backend no responde). Si no llegan los datos de la última compra, falla la carga completa.
- `registerPurchase$`: envía `{ supplier: { name, phone }, lines: [...] }` a `POST /api/purchases` y recibe un arreglo de `PurchaseRecord`.
- `registerExpense$`: envía el gasto a `POST /api/expenses`.

## Servicios y endpoints

Vía `core/pos-api.service.ts` contra el backend (`backend aba`, `apiBaseUrl` de `src/environments/`, hoy `http://localhost:5028/api`):
- `GET /api/products/purchase-defaults`: datos de la última compra de cada producto, para el autollenado.
- `GET /api/products`, `POST /api/products` (alta implícita al registrar compra de un producto nuevo la realiza el propio endpoint de compras, no este).
- `GET /api/purchases`, `POST /api/purchases`. Una línea con un tipo distinto al del producto existente responde `400 { message }` («El producto … es de piezas.»).
- `GET /api/expenses`, `POST /api/expenses`.

## Rutas e integración

Ruta `/compras` (`app.routes.ts`), sin guard — accesible sin autorización de vendedor (a diferencia de `/ventas`).

## Permisos y guards

Ninguno propio. No requiere autorización de vendedor.

## UI/UX

Reutiliza estilos de `src/assets/layout/` (`_forms`, `_buttons`, `_tables`, `_cards`, `_badges`). Datalist nativo para autocompletar proveedor, producto y categoría.

- **Autollenado:** el `valueChanges` del producto de cada línea espera `PRODUCT_LOOKUP_DEBOUNCE_MS` (150 ms) antes de buscar. El tipo de un producto existente queda deshabilitado, y `save()` usa `getRawValue()` para que viaje igual.
- **Avisos:** el resultado de guardar una compra o un gasto se avisa con `Notifier` (`core/notify/`): «Compra registrada» y «Gasto registrado» se cierran solos, y un error (el del backend tal cual, o falta el precio por kilo) se queda hasta cerrarlo. Ya no hay `<p class="notice">` en la pantalla.

## Internacionalización

Todos los textos salen de `es.json`: los de la compra en `purchases.*`, los del panel de gastos en
`expenses.*` (compartidos con Historial) y los comunes en `common.*`.

- **Avisos:** los textos de `notifier.success()` y `notifier.error()` se traducen con `TranslateService.instant()`.
  Un mensaje del backend no es una clave, así que se muestra tal cual. Los respaldos de `purchases.effects.ts` son
  claves (`purchases.errors.*`, `expenses.errors.register`).
- **Valores que se guardan como dato:** los `value` de las categorías y apartados de gasto («Renta»,
  «guardadito»), las categorías sugeridas del producto («Alimento»…) y el proveedor por omisión («Sin
  proveedor») se quedan en el código. Solo las etiquetas de las opciones salen del diccionario.

## Manejo de errores y observabilidad

Errores de red o de validación del backend se avisan con `notifier.error()`, tomando `error?.error?.message` cuando el backend responde `400 BadRequest` con un mensaje. Si el backend no responde, `connectionInterceptor` muestra además el aviso de sin conexión (`core/notify/`).

## Pruebas

- Unitarias (Vitest, `npm test`): `purchases-page.component.spec.ts` (totales, validación del precio por kilo,
  cuerpo que pasa a la fachada, avisos con un doble de `Notifier`, autollenado con tipo fijo, alta de proveedor y
  gasto), `purchases.store.spec.ts` (resolución por `requestId` y `purchaseDefaults()`),
  `store/purchases.reducer.spec.ts` (unión de proveedores y datos de la última compra) y
  `store/purchases.effects.spec.ts` (carga con `purchase-defaults` y normalización del cuerpo de compra y gasto).
- E2E (Playwright, `npm run test:e2e`): `e2e/compras-inventario/` registra una compra de bultos y varios y la
  verifica en Inventario; `e2e/compras-ventas-guiadas/` cubre el autollenado, la compra con otro tipo y los avisos.
- Los textos se comparan con `t()` (`src/app/testing/translate.ts` y `e2e/support/textos.ts`); la prueba del
  componente agrega `provideI18n()` a su `TestBed` y comprueba que las opciones conservan su valor de dato.

## Dependencias

`@angular/forms` (Reactive Forms, `FormArray`), NgRx (`@ngrx/store`, `@ngrx/effects`), `core/pos-api.service.ts`.

## Limitaciones y trabajo pendiente

- El catálogo de proveedores no tiene endpoint propio; una alta hecha desde el toolbar "Nuevo proveedor" sin registrar ninguna compra para él se pierde al recargar la página.
- No hay edición ni eliminación de compras ya registradas.
- Los productos y los datos de la última compra se cargan al entrar: un producto comprado por primera vez no se autollena hasta recargar (P-32).
- Quedan de P-21 el costo unitario, la ganancia esperada, el proveedor nuevo desde el campo y el resumen antes de guardar.
- El umbral mínimo (`minBags`) de un producto creado al vuelo desde una compra queda en `0` hasta que exista la función de umbral mínimo editable (hoja de ruta).

## Notas de mantenimiento

El backend normaliza nombre de producto y de proveedor (trim + comparación insensible a mayúsculas) para decidir si reutiliza un registro existente o crea uno nuevo; mantener esa misma normalización si se agrega otro punto de alta de producto/proveedor.
