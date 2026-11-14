import { Page, expect, test } from '@playwright/test';
import { existencia, ultimaCompra } from '../support/api';
import { PRODUCTOS, PROVEEDORES, Proveedor } from '../support/catalogo';
import { compras, ESTA_REGISTRADA, inventario } from './compras-inventario.locators';

// Escenarios «Pollo de engorda de dos marcas» y «Accesorio por pieza» de la spec e2e-qa
// (change nombres-reales-en-e2e). El mismo alimento se compra en dos marcas a dos proveedores y debe
// quedar como dos productos, cada uno con su proveedor. Los nombres son fijos, así que el inventario se
// verifica por diferencia contra lo que había antes.

const { polloEngordaMalta, polloEngordaPurina, comederoPollo } = PRODUCTOS;
const BULTOS_MALTA = 3;
const BULTOS_PURINA = 2;
const COMEDEROS = 5;

interface LineaDeCompra {
  tipo: 'bag' | 'unit';
  producto: string;
  categoria: string;
  cantidad: number;
  costoTotal: number;
  ventaBulto: number;
  kgPorBulto?: number;
  ventaKg?: number;
}

const lineaDeBultos = (producto: typeof polloEngordaMalta, cantidad: number): LineaDeCompra => ({
  tipo: 'bag',
  producto: producto.nombre,
  categoria: producto.categoria,
  cantidad,
  costoTotal: producto.costoPorBulto * cantidad,
  ventaBulto: producto.ventaBulto,
  kgPorBulto: producto.kgPorBulto,
  ventaKg: producto.ventaKg
});

/** Registra una compra desde la pantalla y verifica el cuerpo que se manda y la respuesta del backend. */
async function comprar(page: Page, proveedor: Proveedor, linea: LineaDeCompra): Promise<void> {
  const pantalla = compras(page);
  await pantalla.proveedor.fill(proveedor.nombre);

  const fila = pantalla.linea(0);
  await fila.tipo.selectOption(linea.tipo);
  await fila.producto.fill(linea.producto);
  await fila.categoria.fill(linea.categoria);
  await fila.cantidad.fill(String(linea.cantidad));
  if (linea.tipo === 'bag') {
    await fila.kgPorBulto.fill(String(linea.kgPorBulto));
    await fila.ventaKg.fill(String(linea.ventaKg));
  }
  await fila.costoTotal.fill(String(linea.costoTotal));
  await fila.ventaBulto.fill(String(linea.ventaBulto));

  const peticion = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/api/purchases'));
  const respuesta = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith('/api/purchases'));
  await pantalla.guardar.click();

  const cuerpo = (await peticion).postDataJSON();
  expect(cuerpo.supplier.name).toBe(proveedor.nombre);
  expect(cuerpo.lines).toEqual([expect.objectContaining({ kind: linea.tipo, productName: linea.producto, quantity: linea.cantidad })]);
  expect((await respuesta).status()).toBe(200);
  await expect(pantalla.aviso).toHaveText(ESTA_REGISTRADA);
}

test('el pollo de engorda de dos marcas y proveedores queda como dos productos, y el comedero suma piezas', async ({ page, request }) => {
  test.info().annotations.push({
    type: 'datos',
    description: [polloEngordaMalta.nombre, polloEngordaPurina.nombre, comederoPollo.nombre].join(' · ')
  });
  const antesMalta = await existencia(request, polloEngordaMalta.nombre);
  const antesPurina = await existencia(request, polloEngordaPurina.nombre);
  const antesComedero = await existencia(request, comederoPollo.nombre);

  await page.goto('/compras');
  // El teléfono se toma del proveedor ya registrado; uno nuevo se da de alta con la barra de proveedor.
  const { barraProveedor } = compras(page);
  for (const proveedor of Object.values(PROVEEDORES)) {
    await barraProveedor.abrir.click();
    await barraProveedor.nombre.fill(proveedor.nombre);
    await barraProveedor.telefono.fill(proveedor.telefono);
    await barraProveedor.registrar.click();
  }

  await comprar(page, PROVEEDORES.maltaCleyton, lineaDeBultos(polloEngordaMalta, BULTOS_MALTA));
  await comprar(page, PROVEEDORES.purina, lineaDeBultos(polloEngordaPurina, BULTOS_PURINA));
  await comprar(page, PROVEEDORES.accesoriosBajio, {
    tipo: 'unit',
    producto: comederoPollo.nombre,
    categoria: comederoPollo.categoria,
    cantidad: COMEDEROS,
    costoTotal: comederoPollo.costoPorPieza * COMEDEROS,
    ventaBulto: comederoPollo.ventaPieza
  });

  // Cada compra queda con su proveedor y su teléfono.
  for (const [producto, proveedor] of [
    [polloEngordaMalta.nombre, PROVEEDORES.maltaCleyton],
    [polloEngordaPurina.nombre, PROVEEDORES.purina],
    [comederoPollo.nombre, PROVEEDORES.accesoriosBajio]
  ] as const) {
    expect(await ultimaCompra(request, producto)).toMatchObject({
      supplierName: proveedor.nombre,
      supplierPhone: proveedor.telefono
    });
  }

  // En Inventario, las dos marcas son dos productos y cada uno sube exactamente lo comprado.
  await page.goto('/inventario');
  const tabla = inventario(page);

  await tabla.filtro.fill('pollo de engorda');
  await expect(tabla.fila(polloEngordaMalta.nombre).bultosSellados).toHaveText(String(antesMalta.bultosSellados + BULTOS_MALTA));
  await expect(tabla.fila(polloEngordaPurina.nombre).bultosSellados).toHaveText(String(antesPurina.bultosSellados + BULTOS_PURINA));

  await tabla.filtro.fill(comederoPollo.nombre);
  await expect(tabla.fila(comederoPollo.nombre).piezas).toHaveText(String(antesComedero.piezas + COMEDEROS));
});
