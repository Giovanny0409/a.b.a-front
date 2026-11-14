import { t } from '@testing/translate';
import { saleQuantityKey } from './sale-quantity';

describe('saleQuantityKey', () => {
  it.each([
    ['piece', 1, 'sales.quantity.piece'],
    ['piece', 3, 'sales.quantity.pieces'],
    ['bag', 1, 'sales.quantity.bag'],
    ['bag', 2, 'sales.quantity.bags'],
    ['kg', 2.5, 'sales.quantity.kg'],
    ['kg', 1, 'sales.quantity.kg']
  ] as const)('%s × %s usa «%s»', (unit, quantity, key) => {
    expect(saleQuantityKey(unit, quantity)).toBe(key);
  });

  it('una pieza no se lee como bulto', () => {
    expect(t(saleQuantityKey('piece', 1), { quantity: 1 })).not.toBe(t('sales.quantity.bag', { quantity: 1 }));
  });
});
