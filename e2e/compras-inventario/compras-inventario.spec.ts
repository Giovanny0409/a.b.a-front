import { expect, test } from '@playwright/test';
import { marcaDeCorrida, nombrePrueba } from '../support/test-data';
import { compras, ESTA_REGISTRADA, inventario } from './compras-inventario.locators';

// Escenario «Compra de bultos y varios de productos nuevos» de la spec e2e-qa
// (change agregar-qa-playwright). Verifica en tres capas: el cuerpo que manda el front, la
// respuesta del backend y lo que muestra Inventario.

const BULTOS = 3;
const PIEZAS = 5;

test('una compra de bultos y varios de productos nuevos aparece en el inventario', async ({ page }) => {
  const marca = marcaDeCorrida();
  test.info().annotations.push({ type: 'datos', description: `PW_${marca}_*` });
  const proveedor = nombrePrueba(marca, 'prov');
  const productoBulto = nombrePrueba(marca, 'bulto');
  const productoVario = nombrePrueba(marca, 'vario');

  await page.goto('/compras');
  const pantalla = compras(page);

  await pantalla.proveedor.fill(proveedor);

  const bulto = pantalla.linea(0);
  await bulto.tipo.selectOption('bag');
  await bulto.producto.fill(productoBulto);
  await bulto.categoria.fill('Alimento');
  await bulto.cantidad.fill(String(BULTOS));
  await bulto.kgPorBulto.fill('25');
  await bulto.costoTotal.fill('1500');
  await bulto.ventaBulto.fill('600');
  await bulto.ventaKg.fill('28');

  await pantalla.agregarLinea.click();
  const vario = pantalla.linea(1);
  await vario.tipo.selectOption('unit');
  await vario.producto.fill(productoVario);
  await vario.categoria.fill('Accesorio');
  await vario.cantidad.fill(String(PIEZAS));
  await vario.costoTotal.fill('250');
  await vario.ventaBulto.fill('80');

  const peticion = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/purchases')
  );
  const respuesta = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().endsWith('/api/purchases')
  );
  await pantalla.guardar.click();

  const cuerpo = (await peticion).postDataJSON();
  expect(cuerpo.supplier.name).toBe(proveedor);
  expect(cuerpo.lines).toHaveLength(2);
  expect(cuerpo.lines[0]).toMatchObject({ kind: 'bag', productName: productoBulto, quantity: BULTOS });
  expect(cuerpo.lines[1]).toMatchObject({ kind: 'unit', productName: productoVario, quantity: PIEZAS });

  expect((await respuesta).status()).toBe(200);
  await expect(pantalla.aviso).toHaveText(ESTA_REGISTRADA);

  await page.goto('/inventario');
  const tabla = inventario(page);

  await tabla.filtro.fill(productoBulto);
  await expect(tabla.fila(productoBulto).bultosSellados).toHaveText(String(BULTOS));

  await tabla.filtro.fill(productoVario);
  await expect(tabla.fila(productoVario).piezas).toHaveText(String(PIEZAS));
});
