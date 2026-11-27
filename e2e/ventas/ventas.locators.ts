import { Page } from '@playwright/test';
import { t, terminaCon } from '../support/textos';

// Los textos salen de es.json (los de las plantillas de Ventas). Los diálogos del vendedor y del fin de
// venta son avisos de la app: ver ../support/avisos.ts.

export const ID_RECHAZADO = t('seller.rejected');
export const textoVendedor = (nombre: string) => t('sales.toolbar.seller', { name: nombre });

export function ventas(page: Page) {
  return {
    entrar: () => page.locator('a[href="/ventas"]').first().click(),
    irAlTablero: () => page.locator('a[href="/tablero"]').first().click(),
    vendedor: page.locator('.sales-toolbar .badge'),
    // Los nombres accesibles empiezan con el glifo del icono, por eso se anclan al final.
    cambiarVendedor: page.getByRole('button', { name: terminaCon(t('sales.toolbar.changeSeller')) }),
    ticketsGuardados: page.getByRole('button', { name: new RegExp(t('sales.savedTickets.title')) }).locator('span'),
    producto: page.locator('select[formcontrolname="productId"]'),
    modo: page.locator('select[formcontrolname="mode"]'),
    cantidad: page.locator('input[formcontrolname="amount"]'),
    agregar: page.getByRole('button', { name: terminaCon(t('sales.form.add')) }),
    finalizar: page.getByRole('button', { name: terminaCon(t('sales.checkout.finish')) }),
    guardarTicket: page.locator('.ticket-actions').getByRole('button', { name: terminaCon(t('common.actions.save')) }),
    cerrarTicket: page.locator('.ticket-actions').getByRole('button', { name: terminaCon(t('common.actions.close')) })
  };
}
