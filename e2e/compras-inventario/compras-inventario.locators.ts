import { Locator, Page } from '@playwright/test';

// Los textos son los de las plantillas de Compras e Inventario. Cuando lleguen a es.json (P-01),
// se actualizan aquí.

export const ESTA_REGISTRADA = 'Compra registrada en el backend e inventario actualizado.';

export function compras(page: Page) {
  const lineas = page.locator('table.purchase-total-table tbody tr');

  const barra = page.locator('form.supplier-toolbar');

  return {
    // La barra de alta de proveedor también tiene un campo «Proveedor»: este es el de la compra.
    proveedor: page.locator('input[formcontrolname="supplierName"]'),
    barraProveedor: {
      // El nombre accesible empieza con el glifo del icono, por eso se ancla al final.
      abrir: page.getByRole('button', { name: /Nuevo proveedor$/ }),
      nombre: barra.locator('input[formcontrolname="name"]'),
      telefono: barra.locator('input[formcontrolname="phone"]'),
      registrar: barra.getByRole('button', { name: /Registrar$/ })
    },
    guardar: page.getByRole('button', { name: 'Guardar compra' }),
    aviso: page.locator('p.notice').first(),
    linea: (indice: number) => {
      const fila: Locator = lineas.nth(indice);
      return {
        tipo: fila.locator('select[formcontrolname="kind"]'),
        producto: fila.locator('input[formcontrolname="productName"]'),
        categoria: fila.locator('input[formcontrolname="category"]'),
        cantidad: fila.locator('input[formcontrolname="quantity"]'),
        kgPorBulto: fila.locator('input[formcontrolname="markedKg"]'),
        costoTotal: fila.locator('input[formcontrolname="purchaseCost"]'),
        ventaBulto: fila.locator('input[formcontrolname="salePriceBag"]'),
        ventaKg: fila.locator('input[formcontrolname="salePriceKg"]')
      };
    }
  };
}

// Columnas de la tabla de Inventario, en el orden de la plantilla.
const COLUMNA_BULTOS_SELLADOS = 3;
const COLUMNA_PIEZAS = 5;

export function inventario(page: Page) {
  return {
    filtro: page.getByLabel('Filtrar producto'),
    fila: (producto: string) => {
      const fila = page.locator('tbody tr').filter({
        has: page.locator('td').first().getByText(producto, { exact: true })
      });
      return {
        fila,
        bultosSellados: fila.locator('td').nth(COLUMNA_BULTOS_SELLADOS),
        piezas: fila.locator('td').nth(COLUMNA_PIEZAS)
      };
    }
  };
}
