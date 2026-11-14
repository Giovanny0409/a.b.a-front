import { Dialog, Page, expect, test } from '@playwright/test';
import { comprarBultos } from '../support/api';
import { PRODUCTOS, PROVEEDORES } from '../support/catalogo';
import { t } from '../support/textos';
import { ventas } from '../ventas/ventas.locators';

// Escenarios de la spec i18n (change instalar-i18n-espanol): los textos salen de es.json, con ortografía
// correcta y formato es-MX, y los mensajes del backend se muestran tal cual.

const ALIMENTO = PRODUCTOS.polloEngordaMalta;
const AURELIO = '0409';
// Una clave sin traducir se vería así en la pantalla: «sección.algo».
const CLAVE_VISIBLE = /\b(common|menu|dashboard|sales|seller|purchases|expenses|inventory|history)\.[a-zA-Z]+/;

const PANTALLAS = [
  { ruta: '/tablero', textos: ['dashboard.quickWork.title', 'dashboard.cashCut.day', 'dashboard.importance.minBags'] },
  { ruta: '/compras', textos: ['purchases.title', 'common.fields.category', 'purchases.totals.investment'] },
  { ruta: '/inventario', textos: ['inventory.title', 'inventory.columns.minimum', 'inventory.filter.label'] },
  { ruta: '/historial', textos: ['history.metrics.investment', 'history.sales.title', 'history.purchases.investment'] }
];

/** Contesta el prompt del vendedor con `id`, registra el resto de los diálogos y los acepta o rechaza. */
function contestarDialogos(page: Page, id: string, aceptar = false) {
  const registro = { prompts: [] as string[], otros: [] as string[] };
  page.on('dialog', async (dialog: Dialog) => {
    if (dialog.type() === 'prompt') {
      registro.prompts.push(dialog.message());
      await dialog.accept(id);
      return;
    }
    registro.otros.push(dialog.message());
    await (aceptar ? dialog.accept() : dialog.dismiss());
  });
  return registro;
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
    // Existencia para la venta de «Pregunta al cobrar».
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
    const dialogos = contestarDialogos(page, AURELIO);
    await page.goto('/tablero');

    await ventas(page).entrar();

    await expect(page.locator('main')).toContainText(t('sales.checkout.finish'));
    await expect(page.locator('main')).toContainText(t('sales.cart.empty'));
    expect(dialogos.prompts).toEqual([t('seller.askId')]);
    expect(await page.locator('body').innerText()).not.toMatch(CLAVE_VISIBLE);
  });

  test('un ID desconocido se avisa con el texto del diccionario', async ({ page }) => {
    const dialogos = contestarDialogos(page, '9999', true);
    await page.goto('/tablero');

    await ventas(page).entrar();

    await expect.poll(() => dialogos.otros).toEqual([t('seller.rejected')]);
    expect(dialogos.prompts).toEqual([t('seller.askId')]);
  });

  test('al cobrar pregunta «¿Requiere ticket?»', async ({ page }) => {
    const dialogos = contestarDialogos(page, AURELIO);
    await page.goto('/tablero');
    await ventas(page).entrar();
    await agregarUnBulto(page);

    const venta = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith('/api/sales/batch'));
    await ventas(page).finalizar.click();
    expect((await venta).status()).toBe(200);

    await expect.poll(() => dialogos.otros).toEqual([t('sales.messages.askTicket')]);
    expect(t('sales.messages.askTicket')).toContain('¿Requiere ticket?');
  });

  test('un mensaje del backend se muestra tal cual', async ({ page }) => {
    const mensaje = 'No hay inventario suficiente para esta venta.';
    contestarDialogos(page, AURELIO);
    // El backend responde así cuando no alcanza el inventario; se fuerza la respuesta para no depender de
    // la existencia que haya en aba.db.
    await page.route('**/api/sales/batch', (route) => route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: mensaje })
    }));
    await page.goto('/tablero');
    await ventas(page).entrar();
    await agregarUnBulto(page);

    await ventas(page).finalizar.click();

    await expect(page.locator('p.notice')).toHaveText(mensaje);
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
