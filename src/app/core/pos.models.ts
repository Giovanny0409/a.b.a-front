export type SaleUnit = 'bag' | 'kg' | 'piece';
export type PurchaseKind = 'bag' | 'unit';
export type ExpenseArea = 'general' | 'guardadito' | 'camioneta';
/** Tipo del producto, fijo desde su primera compra: `bag` se vende por bulto, kilo o pesos; `unit`, por pieza. */
export type ProductKind = 'bag' | 'unit';

export interface Product {
  id: string;
  name: string;
  category: string;
  minBags: number;
  kind: ProductKind;
}

/** Datos de la última compra de un producto (`GET /api/products/purchase-defaults`). */
export interface ProductPurchaseDefaults {
  productId: string;
  name: string;
  kind: ProductKind;
  category: string;
  markedKg: number | null;
  /** Para `unit` es el precio de la pieza, como «Venta bulto/u.» en Compras. */
  salePriceBag: number;
  salePriceKg: number | null;
}

export interface Supplier {
  id?: string;
  name: string;
  phone: string;
}

export interface PurchaseItem {
  quantity: number;
  markedKg?: number;
  purchaseCost: number;
}

export interface PurchaseLineInput {
  kind: PurchaseKind;
  productName: string;
  category: string;
  quantity: number;
  markedKg?: number;
  purchaseCost: number;
  salePriceBag: number;
  salePriceKg: number;
}

export interface BagLot {
  id: string;
  productId: string;
  supplier: string;
  supplierName?: string;
  supplierPhone?: string;
  purchasedAt: string;
  markedKg: number;
  purchaseCost: number;
  salePriceBag: number;
  salePriceKg: number;
  status: 'sealed' | 'open' | 'sold';
  remainingKg: number;
}

export interface SaleLine {
  id: string;
  productId: string;
  productName: string;
  unit: SaleUnit;
  quantity: number;
  unitPrice: number;
  cost: number;
  total: number;
  profit: number;
}

export interface SaleRecord {
  id: string;
  soldAt: string;
  customer: string;
  lines: SaleLine[];
  total: number;
  cost: number;
  profit: number;
}

export interface Seller {
  id: string;
  name: string;
}

export interface SellerAuthorization {
  authorized: boolean;
  seller: Seller | null;
}

export interface PurchaseRecord {
  id: string;
  purchasedAt: string;
  kind?: PurchaseKind;
  productId: string;
  productName: string;
  category?: string;
  supplier?: string;
  supplierName?: string;
  supplierPhone?: string;
  bags?: number;
  quantity?: number;
  markedKg?: number;
  investment: number;
}

export interface ExpenseRecord {
  id: string;
  expenseAt: string;
  concept: string;
  category: string;
  area: ExpenseArea;
  amount: number;
  notes?: string;
}

export interface InventoryItem {
  product: Product;
  sealedBags: number;
  openKg: number;
  quantityTotal?: number;
  needsRestock: boolean;
}

export interface DashboardSummary {
  totalBags: number;
  sealedBags: number;
  openBags: number;
  investment: number;
  income: number;
  expenses: number;
  profit: number;
  lowStock: number;
}
