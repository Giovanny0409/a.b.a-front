// Datos de prueba para los *.spec.ts. Cada función devuelve un objeto válido del contrato con valores
// por omisión, y la prueba sobrescribe solo lo que le importa.
import {
  BagLot,
  ExpenseRecord,
  InventoryItem,
  Product,
  ProductPurchaseDefaults,
  PurchaseRecord,
  SaleLine,
  SaleRecord
} from '@core/pos.models';

export function aProduct(overrides: Partial<Product> = {}): Product {
  return { id: 'p-1', name: 'Maiz quebrado', category: 'Grano', minBags: 4, kind: 'bag', ...overrides };
}

export function aPurchaseDefaults(overrides: Partial<ProductPurchaseDefaults> = {}): ProductPurchaseDefaults {
  return {
    productId: 'p-1',
    name: 'Maiz quebrado',
    kind: 'bag',
    category: 'Grano',
    markedKg: 40,
    salePriceBag: 400,
    salePriceKg: 11,
    ...overrides
  };
}

export function anInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    product: aProduct(),
    sealedBags: 5,
    openKg: 0,
    quantityTotal: 0,
    needsRestock: false,
    ...overrides
  };
}

export function aLot(overrides: Partial<BagLot> = {}): BagLot {
  return {
    id: 'lot-1',
    productId: 'p-1',
    supplier: 'Carga inicial',
    purchasedAt: '2026-11-10T15:00:00Z',
    markedKg: 40,
    purchaseCost: 320,
    salePriceBag: 400,
    salePriceKg: 11,
    status: 'sealed',
    remainingKg: 40,
    ...overrides
  };
}

export function aSaleLine(overrides: Partial<SaleLine> = {}): SaleLine {
  return {
    id: 'line-1',
    productId: 'p-1',
    productName: 'Maiz quebrado',
    unit: 'bag',
    quantity: 1,
    unitPrice: 400,
    cost: 320,
    total: 400,
    profit: 80,
    ...overrides
  };
}

export function aSale(overrides: Partial<SaleRecord> = {}): SaleRecord {
  return {
    id: 'sale-1',
    soldAt: '2026-11-10T15:00:00Z',
    customer: 'Publico general | Vendedor: Aurelio',
    lines: [aSaleLine()],
    total: 400,
    cost: 320,
    profit: 80,
    ...overrides
  };
}

export function aPurchase(overrides: Partial<PurchaseRecord> = {}): PurchaseRecord {
  return {
    id: 'purchase-1',
    purchasedAt: '2026-11-10T15:00:00Z',
    kind: 'bag',
    productId: 'p-1',
    productName: 'Maiz quebrado',
    category: 'Grano',
    supplier: 'Granos del Norte',
    supplierName: 'Granos del Norte',
    supplierPhone: '5551234567',
    bags: 2,
    markedKg: 40,
    investment: 640,
    ...overrides
  };
}

export function anExpense(overrides: Partial<ExpenseRecord> = {}): ExpenseRecord {
  return {
    id: 'expense-1',
    expenseAt: '2026-11-10T15:00:00Z',
    concept: 'Luz',
    category: 'Luz',
    area: 'general',
    amount: 100,
    ...overrides
  };
}
