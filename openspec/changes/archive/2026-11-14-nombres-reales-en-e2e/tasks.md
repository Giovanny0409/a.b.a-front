## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, registrar este change como D-07 (nombres reales en E2E) y ajustar P-08, en el mismo commit que los artefactos.

## 2. Catálogo y soporte

- [x] 2.1 Crear `e2e/support/catalogo.ts` (D1) y `e2e/support/api.ts` (D2); borrar `e2e/support/test-data.ts`.

## 3. Suite de compras

- [x] 3.1 Reescribir `e2e/compras-inventario/compras-inventario.spec.ts` con los escenarios «Pollo de engorda de dos marcas» y «Accesorio por pieza» (D3), y ajustar sus locators si hace falta. La suite da de alta los tres proveedores con la barra «Nuevo proveedor» para que cada compra lleve su teléfono; los locators de la barra quedaron en `compras-inventario.locators.ts`, y se quitó `agregarLinea`, que ya no se usa.
- [x] 3.2 Correr la suite dos veces seguidas (escenario «Dos corridas seguidas»). Dos corridas seguidas: 1 pasó (14.6 s) y 1 pasó (15.2 s).

## 4. Documentación y cierre

- [x] 4.1 `e2e/README.md` (Estructura, Datos de prueba, Alcance) y `.claude/skills/qa-playwright/SKILL.md` (datos con el catálogo y verificación por diferencia).
- [x] 4.2 Revisar que no quede ninguna referencia a `PW_`, `marcaDeCorrida` ni `nombrePrueba`; `npx tsc -p e2e/tsconfig.json`. Sin referencias a `PW_`, `marcaDeCorrida`, `nombrePrueba` ni `test-data`; `tsc` sin errores.
- [x] 4.3 `openspec validate nombres-reales-en-e2e --strict`.
