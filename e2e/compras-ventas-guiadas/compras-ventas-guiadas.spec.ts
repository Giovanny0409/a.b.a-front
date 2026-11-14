import { Page, expect, test } from '@playwright/test';
import { API_URL, comprarBultos, comprarPiezas, existencia } from '../support/api';
import {
  avisos,
  cerrarError,
  contarAvisos,
  darIdDeVendedor,
  esperarExito,
  terminarVenta,
  vigilarAvisos
} from '../support/avisos';
import { PRODUCTOS, PROVEEDORES } from '../support/catalogo';
import { t } from '../support/textos';
import { compras, historial, ventas } from './compras-ventas-guiadas.locators';

// Escenarios de las specs sales, purchases y notifications del change guiar-compras-y-ventas-por-producto.
// Se escribió antes de corregir para reproducir los dos defectos: Ventas ofrece «Por bulto» para un
// comedero, y el ticket de una venta por pieza dice «1 bulto» (P-19). Con nombres fijos (catalogo.ts), lo
// que depende de la existencia se compara contra lo que había antes.

const COMEDERO = PRODUCTOS.comederoPollo;
const ALIMENTO = PRODUCTOS.polloEngordaMalta;
const VENDEDOR = { id: '0409', nombre: 'Aurelio' };
// Más que el tiempo que se ve un éxito (SUCCESS_TIMER_MS, 2.5 s): un error sigue abierto después.
const MAS_QUE_UN_EXITO_MS = 3_500;
// Doble de PRODUCT_LOOKUP_DEBOUNCE_MS (150 ms, purchases-page.component.ts): lo que tarda en llenarse la línea.
const ESPERA_AUTOLLENADO_MS = 300;

async function entrarAVentas(page: Page): Promise<void> {
  await page.goto('/tablero');
  await ventas(page).entrar();
  await darIdDeVendedor(page, VENDEDOR.id);
}

/** Agrega al carrito una pieza del comedero y cobra. */
async function cobrarUnComedero(page: Page): Promise<void> {
  const pantalla = ventas(page);
  await pantalla.producto.selectOption({ label: COMEDERO.nombre });
  await expect(pantalla.modo).toHaveValue('piece');
  const cotizacion = page.waitForResponse((r) => r.url().includes('/api/sales/quote') && r.ok());
  await pantalla.cantidad.fill('1');
  await cotizacion;
  await pantalla.agregar.click();

  const venta = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith('/api/sales/batch'));
  await pantalla.finalizar.click();
  expect((await venta).status()).toBe(200);
}

test.describe('compras y ventas guiadas por el tipo del producto', () => {
  test.beforeAll(async ({ request }) => {
    // Existencia para las ventas de la suite: comederos por pieza y un bulto del alimento.
    await comprarPiezas(request, PROVEEDORES.accesoriosBajio, COMEDERO, 4);
    await comprarBultos(request, PROVEEDORES.maltaCleyton, ALIMENTO, 1);
  });

  test.beforeEach(async () => {
    test.info().annotations.push({ type: 'datos', description: `${COMEDERO.nombre} · ${ALIMENTO.nombre}` });
  });

  test.describe('ventas', () => {
    test('un comedero solo se vende por pieza', async ({ page }) => {
      await entrarAVentas(page);
      const pantalla = ventas(page);

      await pantalla.producto.selectOption({ label: COMEDERO.nombre });

      await expect(pantalla.opcionesDeModo).toHaveText([t('sales.modes.piece')]);
      await expect(pantalla.modo).toHaveValue('piece');
    });

    test('un alimento de 40 kg se vende por bulto, kilo o pesos', async ({ page }) => {
      await entrarAVentas(page);
      const pantalla = ventas(page);

      await pantalla.producto.selectOption({ label: ALIMENTO.nombre });

      await expect(pantalla.opcionesDeModo).toHaveText([t('sales.modes.bag'), t('sales.modes.kg'), t('sales.modes.money')]);
      await expect(pantalla.modo).toHaveValue('bag');
    });

    test('el backend rechaza un modo que no corresponde y no registra la venta', async ({ request }) => {
      const productos = await (await request.get(`${API_URL}/products`)).json() as Array<{ id: string; name: string; kind: string }>;
      const comedero = productos.find((producto) => producto.name === COMEDERO.nombre);
      expect(comedero?.kind).toBe('unit');
      const ventasAntes = (await (await request.get(`${API_URL}/sales`)).json() as unknown[]).length;

      const cotizacion = await request.get(`${API_URL}/sales/quote`, { params: { productId: comedero!.id, unit: 'bag', quantity: 1 } });
      const venta = await request.post(`${API_URL}/sales/batch`, {
        data: { customer: 'Prueba', sellerId: VENDEDOR.id, lines: [{ productId: comedero!.id, unit: 'bag', quantity: 1 }] }
      });

      // Los mensajes los arma el backend: no salen de es.json.
      for (const respuesta of [cotizacion, venta]) {
        expect(respuesta.status()).toBe(400);
        expect((await respuesta.json()).message).toBe(`${COMEDERO.nombre} se vende por pieza.`);
      }
      expect((await (await request.get(`${API_URL}/sales`)).json() as unknown[]).length).toBe(ventasAntes);
    });

    test('muestra la existencia del producto al elegirlo', async ({ page, request }) => {
      const { piezas } = await existencia(request, COMEDERO.nombre);
      await entrarAVentas(page);
      const pantalla = ventas(page);

      await pantalla.producto.selectOption({ label: COMEDERO.nombre });

      await expect(pantalla.existencia).toHaveText(t('common.units.piecesCount', { count: piezas }));
    });

    test('el ticket de una pieza dice «1 pieza» y muestra al vendedor, igual que el Historial', async ({ page }) => {
      await entrarAVentas(page);
      const pantalla = ventas(page);

      await cobrarUnComedero(page);
      await terminarVenta(page, 'ver ticket');

      const linea = pantalla.lineasDelTicket.filter({ hasText: COMEDERO.nombre });
      await expect(linea).toContainText(t('sales.quantity.piece', { quantity: '1' }));
      await expect(linea).not.toContainText(t('sales.quantity.bag', { quantity: '1' }));
      await expect(pantalla.vendedorDelTicket).toHaveText(t('sales.ticket.seller', { name: VENDEDOR.nombre }));

      await pantalla.cerrarTicket.click();
      await page.locator('a[href="/historial"]').first().click();
      await expect(historial(page).ventaDe(COMEDERO.nombre)).toContainText(t('sales.quantity.piece', { quantity: '1' }));
    });

    test('con «Nueva venta» el carrito queda vacío y no se abre el ticket', async ({ page }) => {
      await entrarAVentas(page);
      const pantalla = ventas(page);

      await cobrarUnComedero(page);
      await terminarVenta(page, 'nueva venta');

      await expect(pantalla.ticket).toBeHidden();
      await expect(pantalla.lineasDelCarrito).toHaveCount(0);
    });
  });

  test.describe('compras', () => {
    test('un producto existente llena tipo, categoría y precio de su última compra, sin tocar cantidad ni costo', async ({ page }) => {
      await page.goto('/compras');
      const pantalla = compras(page);
      await pantalla.cantidad.fill('7');
      await pantalla.costoTotal.fill('315');

      await pantalla.producto.fill('comedero para pollo 3 kg');

      await expect(pantalla.tipo).toBeDisabled();
      await expect(pantalla.tipo).toHaveValue('unit');
      await expect(pantalla.categoria).toHaveValue(COMEDERO.categoria);
      await expect(pantalla.ventaBulto).toHaveValue(String(COMEDERO.ventaPieza));
      await expect(pantalla.cantidad).toHaveValue('7');
      await expect(pantalla.costoTotal).toHaveValue('315');
    });

    test('un nombre nuevo deja la línea editable y sin llenar', async ({ page }) => {
      await page.goto('/compras');
      const pantalla = compras(page);

      await pantalla.producto.fill('Bebedero que no existe');
      await page.waitForTimeout(ESPERA_AUTOLLENADO_MS);

      await expect(pantalla.tipo).toBeEnabled();
      await expect(pantalla.categoria).toHaveValue('');
      await expect(pantalla.ventaBulto).toHaveValue('0');
    });

    test('el backend rechaza comprar por bultos un producto de piezas', async ({ request }) => {
      const respuesta = await request.post(`${API_URL}/purchases`, {
        data: {
          supplier: { name: PROVEEDORES.accesoriosBajio.nombre, phone: PROVEEDORES.accesoriosBajio.telefono },
          lines: [{
            kind: 'bag', productName: COMEDERO.nombre, category: COMEDERO.categoria, quantity: 1, markedKg: 3,
            purchaseCost: COMEDERO.costoPorPieza, salePriceBag: COMEDERO.ventaPieza, salePriceKg: COMEDERO.ventaPieza
          }]
        }
      });

      expect(respuesta.status()).toBe(400);
      expect((await respuesta.json()).message).toBe(`El producto ${COMEDERO.nombre} es de piezas.`);
    });
  });

  test.describe('avisos', () => {
    test('una compra registrada avisa «Compra registrada», se cierra sola y vacía la línea', async ({ page }) => {
      await page.goto('/compras');
      const pantalla = compras(page);
      await pantalla.proveedor.fill(PROVEEDORES.accesoriosBajio.nombre);
      await pantalla.producto.fill(COMEDERO.nombre);
      await expect(pantalla.tipo).toBeDisabled();
      await pantalla.cantidad.fill('1');
      await pantalla.costoTotal.fill(String(COMEDERO.costoPorPieza));

      await pantalla.guardar.click();

      await esperarExito(page, t('purchases.messages.registered'));
      await expect(pantalla.producto).toHaveValue('');
    });

    test('un error del backend se muestra tal cual y se queda hasta cerrarlo', async ({ page }) => {
      const mensaje = `El producto ${COMEDERO.nombre} es de piezas.`;
      // Se fuerza la respuesta para no registrar nada en aba.db.
      await page.route('**/api/purchases', (route) => route.request().method() === 'POST'
        ? route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: mensaje }) })
        : route.continue());
      await page.goto('/compras');
      const pantalla = compras(page);
      await pantalla.proveedor.fill(PROVEEDORES.accesoriosBajio.nombre);
      await pantalla.producto.fill(COMEDERO.nombre);
      await expect(pantalla.tipo).toBeDisabled();
      await pantalla.costoTotal.fill(String(COMEDERO.costoPorPieza));

      await pantalla.guardar.click();

      await expect(avisos(page).iconoDeError).toBeVisible();
      await page.waitForTimeout(MAS_QUE_UN_EXITO_MS);
      await cerrarError(page, mensaje);
    });

    test('un gasto registrado avisa «Gasto registrado»', async ({ page }) => {
      await page.goto('/compras');
      const { gasto } = compras(page);
      await gasto.concepto.fill('Bolsas para despacho');
      await gasto.monto.fill('35');

      await gasto.guardar.click();

      await esperarExito(page, t('expenses.messages.registered'));
    });

    test('cancelar el borrado de un ticket guardado lo deja en la lista', async ({ page }) => {
      await entrarAVentas(page);
      const pantalla = ventas(page);
      await cobrarUnComedero(page);
      await terminarVenta(page, 'ver ticket');
      await pantalla.guardarTicket.click();
      await esperarExito(page, t('sales.messages.ticketSaved'));
      await pantalla.cerrarTicket.click();
      await pantalla.abrirTicketsGuardados.click();
      await expect(pantalla.ticketsGuardados).toHaveCount(1);

      await pantalla.eliminarTicket.click();
      const aviso = avisos(page);
      await expect(aviso.titulo).toHaveText(t('sales.messages.confirmDeleteTicket'));
      await expect(aviso.confirmar).toHaveText(t('notifications.actions.delete'));
      await aviso.cancelar.click();

      await expect(aviso.popup).toBeHidden();
      await expect(pantalla.ticketsGuardados).toHaveCount(1);
    });

    test('con el backend apagado avisa una sola vez «Sin conexión con el servidor» con «Reintentar»', async ({ page }) => {
      let caidas = 0;
      await page.route('http://localhost:5028/api/**', (route) => {
        caidas += 1;
        return route.abort('connectionrefused');
      });
      await vigilarAvisos(page);

      await page.goto('/tablero');

      const aviso = avisos(page);
      await expect(aviso.titulo).toHaveText(t('notifications.connection.title'));
      await expect(aviso.confirmar).toHaveText(t('notifications.actions.retry'));
      await expect.poll(() => caidas).toBeGreaterThan(1);
      expect(await contarAvisos(page)).toBe(1);

      const recarga = page.waitForEvent('load');
      await aviso.confirmar.click();
      await recarga;
    });
  });
});
