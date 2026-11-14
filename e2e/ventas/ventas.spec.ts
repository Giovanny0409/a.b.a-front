import { Page, expect, test } from '@playwright/test';
import { comprarBultos } from '../support/api';
import { avisos, cerrarError, darIdDeVendedor, esperarExito, terminarVenta } from '../support/avisos';
import { PRODUCTOS, PROVEEDORES } from '../support/catalogo';
import { t } from '../support/textos';
import { ID_RECHAZADO, textoVendedor, ventas } from './ventas.locators';

// Escenarios de «Vendedor activo visible y cambiable» (spec sales, change cambiar-vendedor-en-ventas).
// Se escribió antes de corregir P-14 para reproducirlo: con el defecto, «Cambiar de vendedor» falla porque
// la pantalla no ofrece forma de cambiarlo y las ventas siguen a nombre del primero. Desde
// guiar-compras-y-ventas-por-producto, el ID y el fin de venta se contestan en los avisos de la app.

const VENDEDORES = {
  aurelio: { id: '0409', nombre: 'Aurelio' },
  ana: { id: '2002', nombre: 'Ana' }
};
const ALIMENTO = PRODUCTOS.polloEngordaMalta;

// El backend guarda el vendedor dentro del cliente de la venta (`PosStore.RegisterSaleBatch`): es un dato,
// no un texto de la pantalla, así que no sale de es.json.
const clienteDeLaVenta = (vendedor: string) => `Vendedor: ${vendedor}`;

/**
 * Cobra un bulto del alimento, contesta el aviso de fin de venta con `opcion` y devuelve a nombre de quién
 * quedó la venta según el backend.
 */
async function cobrarUnBulto(page: Page, opcion: 'ver ticket' | 'nueva venta' = 'nueva venta'): Promise<string> {
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
  await terminarVenta(page, opcion);
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
    await ventas(page).entrar();
    await darIdDeVendedor(page, '9999');

    await expect(page).toHaveURL(/\/tablero$/);
    await cerrarError(page, ID_RECHAZADO);
  });

  test('el vendedor ve su nombre y cobra a su nombre', async ({ page }) => {
    const pantalla = ventas(page);

    await pantalla.entrar();
    await darIdDeVendedor(page, VENDEDORES.aurelio.id);

    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.aurelio.nombre));
    expect(await cobrarUnBulto(page)).toContain(clienteDeLaVenta(VENDEDORES.aurelio.nombre));
  });

  test('salir y volver conserva al vendedor sin volver a pedir el ID', async ({ page }) => {
    const pantalla = ventas(page);
    await pantalla.entrar();
    await darIdDeVendedor(page, VENDEDORES.aurelio.id);
    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.aurelio.nombre));

    await pantalla.irAlTablero();
    await pantalla.entrar();

    await expect(page).toHaveURL(/\/ventas$/);
    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.aurelio.nombre));
    await expect(avisos(page).popup).toBeHidden();
  });

  test('cambiar de vendedor conserva los tickets y la siguiente venta es del nuevo', async ({ page }) => {
    const pantalla = ventas(page);
    await pantalla.entrar();
    await darIdDeVendedor(page, VENDEDORES.aurelio.id);
    expect(await cobrarUnBulto(page, 'ver ticket')).toContain(clienteDeLaVenta(VENDEDORES.aurelio.nombre));
    await pantalla.guardarTicket.click();
    await esperarExito(page, t('sales.messages.ticketSaved'));
    await pantalla.cerrarTicket.click();
    await expect(pantalla.ticketsGuardados).toHaveText('1');

    await pantalla.cambiarVendedor.click();
    await darIdDeVendedor(page, VENDEDORES.ana.id);

    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.ana.nombre));
    await expect(pantalla.ticketsGuardados).toHaveText('1');
    expect(await cobrarUnBulto(page)).toContain(clienteDeLaVenta(VENDEDORES.ana.nombre));
  });

  test('cancelar el cambio regresa al tablero y al volver pide el ID', async ({ page }) => {
    const pantalla = ventas(page);
    await pantalla.entrar();
    await darIdDeVendedor(page, VENDEDORES.aurelio.id);
    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.aurelio.nombre));

    await pantalla.cambiarVendedor.click();
    await darIdDeVendedor(page, null);
    await expect(page).toHaveURL(/\/tablero$/);

    await pantalla.entrar();
    await darIdDeVendedor(page, VENDEDORES.ana.id);
    await expect(pantalla.vendedor).toHaveText(textoVendedor(VENDEDORES.ana.nombre));
  });
});
