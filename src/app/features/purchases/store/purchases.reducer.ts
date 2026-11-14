import { createReducer, on } from '@ngrx/store';
import { ExpenseRecord, Product, ProductPurchaseDefaults, PurchaseRecord } from '../../../core/pos.models';
import { PurchaseSupplier, PurchasesActions } from './purchases.actions';

export const purchasesFeatureKey = 'purchases';

export interface PurchasesState {
  products: Product[];
  /** Datos de la última compra de cada producto, para autollenar la línea. */
  purchaseDefaults: ProductPurchaseDefaults[];
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  suppliers: PurchaseSupplier[];
  error: string | null;
}

export const initialPurchasesState: PurchasesState = {
  products: [],
  purchaseDefaults: [],
  purchases: [],
  expenses: [],
  suppliers: [],
  error: null
};

export const purchasesReducer = createReducer(
  initialPurchasesState,
  on(PurchasesActions.loadProductsSuccess, (state, { products, purchaseDefaults, purchases, expenses }) => ({
    ...state,
    products,
    purchaseDefaults,
    purchases,
    expenses,
    suppliers: mergeSuppliers(state.suppliers, purchases.map((purchase) => supplierFromPurchase(purchase))),
    error: null
  })),
  on(PurchasesActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    products: [],
    purchaseDefaults: [],
    purchases: [],
    expenses: [],
    error
  })),
  on(PurchasesActions.addSupplier, (state, { supplier }) => ({
    ...state,
    suppliers: mergeSuppliers(state.suppliers, [supplier])
  })),
  on(PurchasesActions.registerPurchaseSuccess, (state, { purchases }) => ({
    ...state,
    purchases: [...purchases, ...state.purchases],
    suppliers: mergeSuppliers(state.suppliers, purchases.map((purchase) => supplierFromPurchase(purchase))),
    error: null
  })),
  on(PurchasesActions.registerPurchaseFailure, (state, { error }) => ({ ...state, error })),
  on(PurchasesActions.registerExpenseSuccess, (state, { expense }) => ({
    ...state,
    expenses: [expense, ...state.expenses],
    error: null
  })),
  on(PurchasesActions.registerExpenseFailure, (state, { error }) => ({ ...state, error }))
);

function parseSupplier(value: string): PurchaseSupplier {
  const [name = 'Sin proveedor', phone = ''] = value.split(' | Tel: ');
  return {
    name: name.trim() || 'Sin proveedor',
    phone: phone.trim()
  };
}

function supplierFromPurchase(purchase: PurchaseRecord): PurchaseSupplier {
  if (purchase.supplierName || purchase.supplierPhone) {
    return {
      name: purchase.supplierName || 'Sin proveedor',
      phone: purchase.supplierPhone || ''
    };
  }

  return parseSupplier(purchase.supplier || 'Sin proveedor');
}

function mergeSuppliers(current: PurchaseSupplier[], incoming: PurchaseSupplier[]): PurchaseSupplier[] {
  const suppliers = new Map<string, PurchaseSupplier>();

  for (const supplier of [...current, ...incoming]) {
    const name = supplier.name.trim();
    if (name) {
      suppliers.set(name.toLocaleLowerCase(), { name, phone: supplier.phone.trim() });
    }
  }

  return [...suppliers.values()].sort((a, b) => a.name.localeCompare(b.name));
}
