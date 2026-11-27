import { Page } from '@playwright/test';
import { t, terminaCon } from '../support/textos';

// Los textos salen de es.json. Ventas y Compras, con lo que guía a la persona: los modos según el tipo
// del producto, la existencia, el ticket y el autollenado de la línea de compra. Los avisos están en
// ../support/avisos.ts.

export function ventas(page: Page) {
  const dialogoDeTickets = page.locator('.saved-tickets-dialog');
  return {
    entrar: () => page.locator('a[href="/ventas"]').first().click(),
    producto: page.locator('select[formcontrolname="productId"]'),
    modo: page.locator('select[formcontrolname="mode"]'),
    opcionesDeModo: page.locator('select[formcontrolname="mode"] option'),
    cantidad: page.locator('input[formcontrolname="amount"]'),
    existencia: page.locator('.stock'),
    agregar: page.getByRole('button', { name: terminaCon(t('sales.form.add')) }),
    lineasDelCarrito: page.locator('.sales-layout table tbody tr').filter({ has: page.locator('.icon-btn') }),
    finalizar: page.getByRole('button', { name: terminaCon(t('sales.checkout.finish')) }),
    ticket: page.locator('#sale-ticket'),
    lineasDelTicket: page.locator('#sale-ticket tbody tr'),
    vendedorDelTicket: page.locator('#sale-ticket .ticket-seller'),
    guardarTicket: page.locator('.ticket-actions').getByRole('button', { name: terminaCon(t('common.actions.save')) }),
    cerrarTicket: page.locator('.ticket-actions').getByRole('button', { name: terminaCon(t('common.actions.close')) }),
    abrirTicketsGuardados: page.getByRole('button', { name: new RegExp(t('sales.savedTickets.title')) }),
    ticketsGuardados: dialogoDeTickets.locator('tbody tr').filter({ has: page.locator('.ticket-row-actions') }),
    eliminarTicket: dialogoDeTickets.getByTitle(t('sales.savedTickets.delete'))
  };
}

export function compras(page: Page) {
  const linea = page.locator('table.purchase-total-table tbody tr').first();
  const gasto = page.locator('form.expense-form');
  return {
    proveedor: page.locator('input[formcontrolname="supplierName"]'),
    tipo: linea.locator('select[formcontrolname="kind"]'),
    producto: linea.locator('input[formcontrolname="productName"]'),
    categoria: linea.locator('input[formcontrolname="category"]'),
    cantidad: linea.locator('input[formcontrolname="quantity"]'),
    costoTotal: linea.locator('input[formcontrolname="purchaseCost"]'),
    ventaBulto: linea.locator('input[formcontrolname="salePriceBag"]'),
    guardar: page.getByRole('button', { name: terminaCon(t('purchases.save')) }),
    gasto: {
      concepto: gasto.locator('input[formcontrolname="concept"]'),
      monto: gasto.locator('input[formcontrolname="amount"]'),
      guardar: gasto.getByRole('button', { name: terminaCon(t('expenses.save')) })
    }
  };
}

export function historial(page: Page) {
  return {
    ventaDe: (producto: string) => page.locator('.history-grid article').first().locator('tbody tr')
      .filter({ hasText: producto }).first()
  };
}
