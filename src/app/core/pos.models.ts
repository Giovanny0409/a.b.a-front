export type SaleUnit = 'bag' | 'kg';

export interface Product {
  id: string;
  name: string;
  category: string;
  minBags: number;
}

export interface BagLot {
  id: string;
  productId: string;
  supplier: string;
  purchasedAt: string;
  markedKg: number;
  realKg: number;
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
  productId: string;
  productName: string;
  supplier: string;
  bags: number;
  markedKg: number;
  realKg: number;
  investment: number;
}

export interface InventoryItem {
  product: Product;
  sealedBags: number;
  openKg: number;
  realKgTotal: number;
  needsRestock: boolean;
}

export interface DashboardSummary {
  bagsAvailable: number;
  openKgAvailable: number;
  investment: number;
  income: number;
  profit: number;
  lowStock: number;
}

export interface PosState {
  products: Product[];
  lots: BagLot[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
}
