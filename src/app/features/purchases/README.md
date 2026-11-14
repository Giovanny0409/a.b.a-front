# Compras

## Descripción

Pantalla para registrar compras a proveedores (bultos y productos varios) y gastos de insumos (renta, luz, bolsas, comida, etc.), disponible en la ruta `/compras`.

## Responsabilidades y alcance

- Registrar una compra con una o más líneas, cada una de tipo `bag` (bulto) o `unit` (producto vario: correas, vitaminas, comederos, bebederos, jaulas, etc.).
- Dar de alta un producto nuevo desde la misma línea de compra si el nombre capturado no existe todavía en el catálogo (no requiere un alta previa por separado).
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

Usa los modelos compartidos en `core/pos.models.ts`: `Product`, `Supplier`, `PurchaseKind` (`'bag' | 'unit'`), `PurchaseLineInput`, `PurchaseRecord`, `ExpenseArea`, `ExpenseRecord`.

`PurchaseRecord` representa **una línea de compra ya registrada** (no el ticket completo); si el formulario envía varias líneas en un solo envío, el backend crea y devuelve un `PurchaseRecord` por cada línea.

## Estado NgRx

`PurchasesState { products, purchases, expenses, suppliers, error }`, expuesto vía `PurchasesStore` (fachada con `products()`, `suppliers()` como signals). El catálogo de proveedores (`suppliers`) se reconstruye combinando altas manuales (`addSupplier`, solo en memoria) con los proveedores que ya aparecen en `purchases` — no hay un endpoint dedicado de proveedores en el backend.

## Efectos y flujo de datos

- `loadProducts$`: `forkJoin` de `products`, `purchases` y `expenses` (con `catchError` a `[]` para gastos, por si el backend no responde).
- `registerPurchase$`: envía `{ supplier: { name, phone }, lines: [...] }` a `POST /api/purchases` y recibe un arreglo de `PurchaseRecord`.
- `registerExpense$`: envía el gasto a `POST /api/expenses`.

## Servicios y endpoints

Vía `core/pos-api.service.ts` contra el backend (`backend aba`, `http://localhost:5028/api`):
- `GET /api/products`, `POST /api/products` (alta implícita al registrar compra de un producto nuevo la realiza el propio endpoint de compras, no este).
- `GET /api/purchases`, `POST /api/purchases`.
- `GET /api/expenses`, `POST /api/expenses`.

## Rutas e integración

Ruta `/compras` (`app.routes.ts`), sin guard — accesible sin autorización de vendedor (a diferencia de `/ventas`).

## Permisos y guards

Ninguno propio. No requiere autorización de vendedor.

## UI/UX

Reutiliza estilos de `src/assets/layout/` (`_forms`, `_buttons`, `_tables`, `_cards`, `_badges`). Datalist nativo para autocompletar proveedor, producto y categoría.

## Internacionalización

Todos los textos salen de `es.json`: los de la compra en `purchases.*`, los del panel de gastos en
`expenses.*` (compartidos con Historial) y los comunes en `common.*`.

- **Mensajes:** `message()` y `expenseMessage()` se traducen al asignarlos con `TranslateService.instant()`. Un
  mensaje del backend no es una clave, así que se muestra tal cual. Los respaldos de `purchases.effects.ts` son
  claves (`purchases.errors.*`, `expenses.errors.register`).
- **Valores que se guardan como dato:** los `value` de las categorías y apartados de gasto («Renta»,
  «guardadito»), las categorías sugeridas del producto («Alimento»…) y el proveedor por omisión («Sin
  proveedor») se quedan en el código. Solo las etiquetas de las opciones salen del diccionario.

## Manejo de errores y observabilidad

Errores de red o de validación del backend se muestran en `message()`/`expenseMessage()` (signals), tomando `error?.error?.message` cuando el backend responde `400 BadRequest` con un mensaje.

## Pruebas

- Unitarias (Vitest, `npm test`): `purchases-page.component.spec.ts` (totales, validación del precio por kilo,
  cuerpo que pasa a la fachada, mensajes, alta de proveedor y gasto), `purchases.store.spec.ts` (resolución por
  `requestId`), `store/purchases.reducer.spec.ts` (unión de proveedores) y `store/purchases.effects.spec.ts`
  (normalización del cuerpo de compra y gasto).
- E2E (Playwright, `npm run test:e2e`): `e2e/compras-inventario/` registra una compra de bultos y varios y la
  verifica en Inventario.
- Los textos se comparan con `t()` (`src/app/testing/translate.ts` y `e2e/support/textos.ts`); la prueba del
  componente agrega `provideI18n()` a su `TestBed` y comprueba que las opciones conservan su valor de dato.

## Dependencias

`@angular/forms` (Reactive Forms, `FormArray`), NgRx (`@ngrx/store`, `@ngrx/effects`), `core/pos-api.service.ts`.

## Limitaciones y trabajo pendiente

- El catálogo de proveedores no tiene endpoint propio; una alta hecha desde el toolbar "Nuevo proveedor" sin registrar ninguna compra para él se pierde al recargar la página.
- No hay edición ni eliminación de compras ya registradas.
- El umbral mínimo (`minBags`) de un producto creado al vuelo desde una compra queda en `0` hasta que exista la función de umbral mínimo editable (hoja de ruta).

## Notas de mantenimiento

El backend normaliza nombre de producto y de proveedor (trim + comparación insensible a mayúsculas) para decidir si reutiliza un registro existente o crea uno nuevo; mantener esa misma normalización si se agrega otro punto de alta de producto/proveedor.
