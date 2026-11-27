import { SaleUnit } from './pos.models';

const SINGULAR: Record<SaleUnit, string> = {
  bag: 'sales.quantity.bag',
  kg: 'sales.quantity.kg',
  piece: 'sales.quantity.piece'
};

const PLURAL: Record<SaleUnit, string> = {
  bag: 'sales.quantity.bags',
  kg: 'sales.quantity.kg',
  piece: 'sales.quantity.pieces'
};

/**
 * Clave de `es.json` para la cantidad vendida con su unidad real («1 pieza», «2 bultos», «2.5 kg»). La usan
 * el ticket de Ventas y el Historial. La clave recibe `{{quantity}}`.
 */
export function saleQuantityKey(unit: SaleUnit, quantity: number): string {
  return quantity === 1 ? SINGULAR[unit] : PLURAL[unit];
}
