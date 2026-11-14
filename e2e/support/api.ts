import { APIRequestContext, expect } from '@playwright/test';

// Lecturas directas del backend para preparar y verificar las pruebas. Con nombres fijos (catalogo.ts),
// el inventario se compara contra lo que había antes de la prueba, nunca contra un valor absoluto.

export const API_URL = 'http://localhost:5028/api';

export interface Existencia {
  bultosSellados: number;
  piezas: number;
}

interface InventarioApi {
  product: { name: string };
  sealedBags: number;
  quantityTotal?: number;
}

interface CompraApi {
  productName: string;
  supplierName?: string;
  supplierPhone?: string;
}

export async function existencia(request: APIRequestContext, producto: string): Promise<Existencia> {
  const respuesta = await request.get(`${API_URL}/inventory`);
  expect(respuesta.ok()).toBe(true);
  const item = (await respuesta.json() as InventarioApi[]).find((entrada) => entrada.product.name === producto);
  return { bultosSellados: item?.sealedBags ?? 0, piezas: item?.quantityTotal ?? 0 };
}

/** La compra más reciente de un producto (GET /api/purchases viene de la más nueva a la más vieja). */
export async function ultimaCompra(request: APIRequestContext, producto: string): Promise<CompraApi | undefined> {
  const respuesta = await request.get(`${API_URL}/purchases`);
  expect(respuesta.ok()).toBe(true);
  return (await respuesta.json() as CompraApi[]).find((compra) => compra.productName === producto);
}
