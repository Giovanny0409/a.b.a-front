import { Page, expect, test } from '@playwright/test';
import { comprarBultos } from '../support/api';
import { avisos, cerrarError, darIdDeVendedor } from '../support/avisos';
import { PRODUCTOS, PROVEEDORES } from '../support/catalogo';
import { t } from '../support/textos';
import { ventas } from '../ventas/ventas.locators';

// Escenarios de la spec i18n (change instalar-i18n-espanol): los textos salen de es.json, con ortografía
// correcta y formato es-MX, y los mensajes del backend se muestran tal cual. Desde
// guiar-compras-y-ventas-por-producto, los diálogos son avisos de la app (../support/avisos.ts).

const ALIMENTO = PRODUCTOS.polloEngordaMalta;
const AURELIO = '0409';
// Una clave sin traducir se vería así en la pantalla: «sección.algo».
const CLAVE_VISIBLE = /\b(common|menu|dashboard|sales|seller|purchases|expenses|inventory|history|notifications)\.[a-zA-Z]+/;

const PANTALLAS = [
  { ruta: '/tablero', textos: ['dashboard.quickWork.title', 'dashboard.cashCut.day', 'dashboard.importance.minBags'] },
  { ruta: '/compras', textos: ['purchases.title', 'common.fields.category', 'purchases.totals.investment'] },
  { ruta: '/inventario', textos: ['inventory.title', 'inventory.columns.minimum', 'inventory.filter.label'] },
  { ruta: '/historial', textos: ['history.metrics.investment', 'history.sales.title', 'history.purchases.investment'] }
];

/** Entra a Ventas y contesta el ID de vendedor (darIdDeVendedor verifica el texto del diccionario). */
async function entrarAVentas(page: Page, id: string): Promise<void> {
  await page.goto('/tablero');
  await ventas(page).entrar();
  await darIdDeVendedor(page, id);
}

async function agregarUnBulto(page: Page): Promise<void> {
  const pantalla = ventas(page);
  await pantalla.producto.selectOption({ label: ALIMENTO.nombre });
  await pantalla.modo.selectOption('bag');
  const cotizacion = page.waitForResponse((r) => r.url().includes('/api/sales/quote') && r.ok());
  await pantalla.cantidad.fill('1');
  await cotizacion;
  await pantalla.agregar.click();
}

test.describe('i18n: textos de es.json', () => {
  test.beforeAll(async ({ request }) => {
    // Existencia para la venta de «Avisa al cobrar».
    await comprarBultos(request, PROVEEDORES.maltaCleyton, ALIMENTO, 1);
  });

  test.beforeEach(async ({ page }) => {
    test.info().annotations.push({ type: 'datos', description: ALIMENTO.nombre });
  });

  for (const pantalla of PANTALLAS) {
    test(`${pantalla.ruta} muestra sus textos, con acentos, y ninguna clave`, async ({ page }) => {
      await page.goto(pantalla.ruta);

      const cuerpo = page.locator('main');
      for (const clave of pantalla.textos) {
        await expect(cuerpo).toContainText(t(clave));
      }
      await expect(page.locator('aba-app-menu')).toContainText(t('menu.history'));
      expect(await page.locator('body').innerText()).not.toMatch(CLAVE_VISIBLE);
    });
  }

  test('Ventas muestra sus textos y ninguna clave', async ({ page }) => {
    await entrarAVentas(page, AURELIO);

    await expect(page.locator('main')).toContainText(t('sales.checkout.finish'));
    await expect(page.locator('main')).toContainText(t('sales.cart.empty'));
    expect(await page.locator('body').innerText()).not.toMatch(CLAVE_VISIBLE);
  });

  test('un ID desconocido se avisa con el texto del diccionario', async ({ page }) => {
    await entrarAVentas(page, '9999');

    await cerrarError(page, t('seller.rejected'));
  });

  test('al cobrar avisa «Venta cobrada» con «Ver ticket» y «Nueva venta»', async ({ page }) => {
    await entrarAVentas(page, AURELIO);
    await agregarUnBulto(page);

    const venta = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith('/api/sales/batch'));
    await ventas(page).finalizar.click();
    expect((await venta).status()).toBe(200);

    const aviso = avisos(page);
    await expect(aviso.titulo).toHaveText(t('sales.messages.charged'));
    await expect(aviso.texto).toContainText('$');
    await expect(aviso.confirmar).toHaveText(t('sales.messages.viewTicket'));
    await expect(aviso.negar).toHaveText(t('sales.messages.newSale'));
    expect(await aviso.popup.innerText()).not.toMatch(CLAVE_VISIBLE);
    await aviso.negar.click();
  });

  test('un mensaje del backend se muestra tal cual', async ({ page }) => {
    const mensaje = 'No hay inventario suficiente para esta venta.';
    // El backend responde así cuando no alcanza el inventario; se fuerza la respuesta para no depender de
    // la existencia que haya en aba.db.
    await page.route('**/api/sales/batch', (route) => route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: mensaje })
    }));
    await entrarAVentas(page, AURELIO);
    await agregarUnBulto(page);

    await ventas(page).finalizar.click();

    await cerrarError(page, mensaje);
  });

  for (const ruta of ['/tablero', '/historial']) {
    test(`${ruta} muestra los importes con «$» y no con «MX$»`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page.locator('.metric strong').first()).toBeVisible();

      const texto = await page.locator('main').innerText();
      expect(texto).toMatch(/\$\d{1,3}(,\d{3})*\.\d{2}/);
      expect(texto).not.toContain('MX$');
    });
  }
});
