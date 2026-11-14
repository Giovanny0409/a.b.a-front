import { Dialog, Page, expect, test } from '@playwright/test';
import { comprarBultos } from '../support/api';
import { PRODUCTOS, PROVEEDORES } from '../support/catalogo';
import { ID_RECHAZADO, PIDE_ID, PREGUNTA_TICKET, textoVendedor, ventas } from './ventas.locators';

// Escenarios de «Vendedor activo visible y cambiable» (spec sales, change cambiar-vendedor-en-ventas).
// Se escribió antes de corregir P-14 para reproducirlo: con el defecto, «Cambiar de vendedor» falla porque
// la pantalla no ofrece forma de cambiarlo y las ventas siguen a nombre del primero.

const VENDEDORES = {
  aurelio: { id: '0409', nombre: 'Aurelio' },
  ana: { id: '2002', nombre: 'Ana' }
};
const ALIMENTO = PRODUCTOS.polloEngordaMalta;

/**
 * Contesta los diálogos del navegador: los prompts del ID con la siguiente respuesta de la lista (null
 * cancela), la pregunta del ticket con `ticket`, y registra los avisos.
 */
function contestarDialogos(page: Page, respuestas: Array<string | null>, ticket = false) {
  const registro = { prompts: 0, avisos: [] as string[] };
  page.on('dialog', async (dialog: Dialog) => {
    if (dialog.type() === 'prompt') {
      expect(dialog.message()).toBe(PIDE_ID);
      registro.prompts += 1;
      const respuesta = respuestas.shift();
      await (respuesta == null ? dialog.dismiss() : dialog.accept(respuesta));
    } else if (dialog.message() === PREGUNTA_TICKET) {
      await (ticket ? dialog.accept() : dialog.dismiss());
    } else {
      registro.avisos.push(dialog.message());
      await dialog.accept();
    }
  });
  return registro;
}

/** Cobra un bulto del alimento y devuelve a nombre de quién quedó la venta según el backend. */
// El backend guarda el vendedor dentro del cliente de la venta (`PosStore.RegisterSaleBatch`): es un dato,
// no un texto de la pantalla, así que no sale de es.json.
const clienteDeLaVenta = (vendedor: string) => `Vendedor: ${vendedor}`;

async function cobrarUnBulto(page: Page): Promise<string> {
  const pantalla = ventas(page);
  await pantalla.producto.selectOption({ label: ALIMENTO.nombre });
  await pantalla.modo.selectOption('bag');
  const cotizacion = page.waitForResponse((r) => r.url().includes('/api/sales/quote') && r.ok());
  await pantalla.cantidad.fill('1');
  await cotizacion;
  await pantalla.agregar.click();

  const venta = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith('/api/sales/batch'));
  await pantalla.finalizar.click();
  const respuesta = await venta;
  expect(respuesta.status()).toBe(200);
  return (await respuesta.json()).customer as string;
}

test.describe('ventas: vendedor activo', () => {
  test.beforeAll(async ({ request }) => {
    // Existencia para las cuatro ventas de la suite.
    await comprarBultos(request, PROVEEDORES.maltaCleyton, ALIMENTO, 4);
  });

  test.beforeEach(async ({ page }) => {
    test.info().annotations.push({ type: 'datos', description: ALIMENTO.nombre });
    await page.goto('/tablero');
  });

  test('un ID desconocido no entra y regresa al tablero', async ({ page }) => {
    const dialogos = contestarDialogos(page, ['9999']);

    await ventas(page).entrar();

    // La prueba ya empieza en el tablero: hay que esperar el aviso, no solo la URL.
    await expect.poll(() => dialogos.avisos).toEqual([ID_RECHAZADO]);
    await expect(page).toHaveURL(/\/tablero$/);
  });

  test('el vendedor ve su nombre y cobra a su nombre', async ({ page }) => {
    contestarDialogos(page, [VENDEDORES.aurelio.id]);
    const pantalla = ventas(page);

    await pantalla.entrar();

    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.aurelio.nombre));
    expect(await cobrarUnBulto(page)).toContain(clienteDeLaVenta(VENDEDORES.aurelio.nombre));
  });

  test('salir y volver conserva al vendedor sin volver a pedir el ID', async ({ page }) => {
    const dialogos = contestarDialogos(page, [VENDEDORES.aurelio.id]);
    const pantalla = ventas(page);
    await pantalla.entrar();
    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.aurelio.nombre));

    await pantalla.irAlTablero();
    await pantalla.entrar();

    await expect(page).toHaveURL(/\/ventas$/);
    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.aurelio.nombre));
    expect(dialogos.prompts).toBe(1);
  });

  test('cambiar de vendedor conserva los tickets y la siguiente venta es del nuevo', async ({ page }) => {
    contestarDialogos(page, [VENDEDORES.aurelio.id, VENDEDORES.ana.id], true);
    const pantalla = ventas(page);
    await pantalla.entrar();
    expect(await cobrarUnBulto(page)).toContain(clienteDeLaVenta(VENDEDORES.aurelio.nombre));
    await pantalla.guardarTicket.click();
    await pantalla.cerrarTicket.click();
    await expect(pantalla.ticketsGuardados).toHaveText('1');

    await pantalla.cambiarVendedor.click();

    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.ana.nombre));
    await expect(pantalla.ticketsGuardados).toHaveText('1');
    expect(await cobrarUnBulto(page)).toContain(clienteDeLaVenta(VENDEDORES.ana.nombre));
  });

  test('cancelar el cambio regresa al tablero y al volver pide el ID', async ({ page }) => {
    const dialogos = contestarDialogos(page, [VENDEDORES.aurelio.id, null, VENDEDORES.ana.id]);
    const pantalla = ventas(page);
    await pantalla.entrar();
    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.aurelio.nombre));

    await pantalla.cambiarVendedor.click();
    await expect(page).toHaveURL(/\/tablero$/);

    await pantalla.entrar();
    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.ana.nombre));
    expect(dialogos.prompts).toBe(3);
  });
});
