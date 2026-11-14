import { Page } from '@playwright/test';

// Los textos son los de las plantillas de Ventas y del guard de vendedor. Cuando lleguen a es.json
// (P-01), se actualizan aquí.

export const PIDE_ID = 'Ingresa el ID de vendedor para ventas';
export const ID_RECHAZADO = 'ID de vendedor no autorizado.';
export const PREGUNTA_TICKET = 'Venta finalizada. Requiere ticket?';

export function ventas(page: Page) {
  return {
    entrar: () => page.locator('a[href="/ventas"]').first().click(),
    irAlTablero: () => page.locator('a[href="/tablero"]').first().click(),
    vendedor: page.locator('.sales-toolbar .badge'),
    // Los nombres accesibles empiezan con el glifo del icono, por eso se anclan al final.
    cambiarVendedor: page.getByRole('button', { name: /Cambiar vendedor$/ }),
    ticketsGuardados: page.getByRole('button', { name: /Tickets guardados/ }).locator('span'),
    producto: page.locator('select[formcontrolname="productId"]'),
    modo: page.locator('select[formcontrolname="mode"]'),
    cantidad: page.locator('input[formcontrolname="amount"]'),
    agregar: page.getByRole('button', { name: /Agregar producto$/ }),
    finalizar: page.getByRole('button', { name: /Finalizar venta$/ }),
    guardarTicket: page.locator('.ticket-actions').getByRole('button', { name: /Guardar$/ }),
    cerrarTicket: page.locator('.ticket-actions').getByRole('button', { name: /Cerrar$/ })
  };
}
