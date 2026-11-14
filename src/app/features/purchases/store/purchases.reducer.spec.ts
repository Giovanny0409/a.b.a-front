import { aProduct, aPurchase, aPurchaseDefaults, anExpense } from '../../../testing/fixtures';
import { PurchasesActions } from './purchases.actions';
import { initialPurchasesState, purchasesFeatureKey, purchasesReducer } from './purchases.reducer';
import { selectPurchaseDefaults, selectPurchaseProducts, selectPurchaseSuppliers } from './purchases.selectors';

describe('purchasesReducer', () => {
  it('al cargar guarda productos, datos de la última compra, compras y gastos, y arma los proveedores', () => {
    const state = purchasesReducer(initialPurchasesState, PurchasesActions.loadProductsSuccess({
      products: [aProduct()],
      purchaseDefaults: [aPurchaseDefaults()],
      purchases: [
        aPurchase({ supplierName: 'Granos del Norte', supplierPhone: '555' }),
        aPurchase({ supplierName: undefined, supplierPhone: undefined, supplier: 'Forrajes Sur | Tel: 777' }),
        aPurchase({ supplierName: 'granos del norte', supplierPhone: '888' })
      ],
      expenses: [anExpense()]
    }));

    expect(state.products).toEqual([aProduct()]);
    expect(state.purchaseDefaults).toEqual([aPurchaseDefaults()]);
    expect(state.expenses).toEqual([anExpense()]);
    expect(state.suppliers).toEqual([
      { name: 'Forrajes Sur', phone: '777' },
      { name: 'granos del norte', phone: '888' }
    ]);
    expect(state.error).toBeNull();
  });

  it('usa «Sin proveedor» si la compra no trae proveedor', () => {
    const state = purchasesReducer(initialPurchasesState, PurchasesActions.loadProductsSuccess({
      products: [],
      purchaseDefaults: [],
      purchases: [aPurchase({ supplier: undefined, supplierName: undefined, supplierPhone: undefined })],
      expenses: []
    }));

    expect(state.suppliers).toEqual([{ name: 'Sin proveedor', phone: '' }]);
  });

  it('vacía productos, compras y gastos al fallar la carga, conservando proveedores', () => {
    const withData = {
      ...initialPurchasesState,
      products: [aProduct()],
      purchaseDefaults: [aPurchaseDefaults()],
      purchases: [aPurchase()],
      expenses: [anExpense()],
      suppliers: [{ name: 'Granos del Norte', phone: '555' }]
    };

    const state = purchasesReducer(withData, PurchasesActions.loadProductsFailure({ error: 'Sin red' }));

    expect(state).toEqual({ ...withData, products: [], purchaseDefaults: [], purchases: [], expenses: [], error: 'Sin red' });
  });

  it('agrega un proveedor sin duplicarlo por nombre y los ordena', () => {
    const first = purchasesReducer(initialPurchasesState, PurchasesActions.addSupplier({ supplier: { name: ' Zeta ', phone: ' 1 ' } }));
    const second = purchasesReducer(first, PurchasesActions.addSupplier({ supplier: { name: 'Alfa', phone: '2' } }));
    const updated = purchasesReducer(second, PurchasesActions.addSupplier({ supplier: { name: 'zeta', phone: '3' } }));

    expect(updated.suppliers).toEqual([{ name: 'Alfa', phone: '2' }, { name: 'zeta', phone: '3' }]);
  });

  it('ignora proveedores sin nombre', () => {
    const state = purchasesReducer(initialPurchasesState, PurchasesActions.addSupplier({ supplier: { name: '  ', phone: '1' } }));

    expect(state.suppliers).toEqual([]);
  });

  it('al registrar una compra la pone primero y suma su proveedor', () => {
    const previous = { ...initialPurchasesState, purchases: [aPurchase({ id: 'vieja' })] };

    const state = purchasesReducer(previous, PurchasesActions.registerPurchaseSuccess({
      requestId: 'r-1',
      purchases: [aPurchase({ id: 'nueva', supplierName: 'Forrajes Sur', supplierPhone: '777' })]
    }));

    expect(state.purchases.map((purchase) => purchase.id)).toEqual(['nueva', 'vieja']);
    expect(state.suppliers).toEqual([{ name: 'Forrajes Sur', phone: '777' }]);
  });

  it('guarda el error al fallar una compra o un gasto', () => {
    expect(purchasesReducer(initialPurchasesState, PurchasesActions.registerPurchaseFailure({ requestId: 'r', error: 'compra' })).error)
      .toBe('compra');
    expect(purchasesReducer(initialPurchasesState, PurchasesActions.registerExpenseFailure({ requestId: 'r', error: 'gasto' })).error)
      .toBe('gasto');
  });

  it('al registrar un gasto lo pone primero', () => {
    const previous = { ...initialPurchasesState, expenses: [anExpense({ id: 'viejo' })], error: 'antes' };

    const state = purchasesReducer(previous, PurchasesActions.registerExpenseSuccess({
      requestId: 'r-1',
      expense: anExpense({ id: 'nuevo' })
    }));

    expect(state.expenses.map((expense) => expense.id)).toEqual(['nuevo', 'viejo']);
    expect(state.error).toBeNull();
  });

  it('los selectors exponen productos y proveedores', () => {
    const state = {
      ...initialPurchasesState,
      products: [aProduct()],
      purchaseDefaults: [aPurchaseDefaults()],
      suppliers: [{ name: 'Alfa', phone: '' }]
    };
    const root = { [purchasesFeatureKey]: state };

    expect(selectPurchaseProducts(root)).toBe(state.products);
    expect(selectPurchaseSuppliers(root)).toBe(state.suppliers);
    expect(selectPurchaseDefaults(root)).toBe(state.purchaseDefaults);
  });
});
