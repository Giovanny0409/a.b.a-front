import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import {
  BagLot,
  ExpenseRecord,
  ExpenseArea,
  InventoryItem,
  Product,
  PurchaseRecord,
  PurchaseLineInput,
  SaleLine,
  SaleRecord,
  SaleUnit,
  Supplier,
  SellerAuthorization
} from './pos.models';

const API_BASE_URL = 'http://localhost:5028/api';

@Injectable({ providedIn: 'root' })
export class PosApiService {
  private readonly http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_BASE_URL}/products`);
  }

  getLots(): Observable<BagLot[]> {
    return this.http.get<BagLot[]>(`${API_BASE_URL}/inventory/lots`);
  }

  getPurchases(): Observable<PurchaseRecord[]> {
    return this.http.get<PurchaseRecord[]>(`${API_BASE_URL}/purchases`);
  }

  getSales(): Observable<SaleRecord[]> {
    return this.http.get<SaleRecord[]>(`${API_BASE_URL}/sales`);
  }

  getExpenses(): Observable<ExpenseRecord[]> {
    return this.http.get<ExpenseRecord[]>(`${API_BASE_URL}/expenses`);
  }

  getSnapshot(): Observable<{
    products: Product[];
    lots: BagLot[];
    purchases: PurchaseRecord[];
    sales: SaleRecord[];
    expenses: ExpenseRecord[];
  }> {
    return forkJoin({
      products: this.getProducts(),
      lots: this.getLots(),
      purchases: this.getPurchases(),
      sales: this.getSales(),
      expenses: this.getExpenses()
    });
  }

  getInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${API_BASE_URL}/inventory`);
  }

  createProduct(input: { name: string; category: string; minBags: number }): Observable<Product> {
    return this.http.post<Product>(`${API_BASE_URL}/products`, input);
  }

  registerPurchase(input: {
    supplier: Supplier;
    lines: PurchaseLineInput[];
  }): Observable<PurchaseRecord[]> {
    return this.http.post<PurchaseRecord[]>(`${API_BASE_URL}/purchases`, input);
  }

  registerExpense(input: {
    concept: string;
    category: string;
    area: ExpenseArea;
    amount: number;
    notes?: string;
  }): Observable<ExpenseRecord> {
    return this.http.post<ExpenseRecord>(`${API_BASE_URL}/expenses`, input);
  }

  quoteSale(productId: string, unit: SaleUnit, quantity: number): Observable<SaleLine> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('unit', unit)
      .set('quantity', quantity);

    return this.http.get<SaleLine>(`${API_BASE_URL}/sales/quote`, { params });
  }

  registerSale(input: {
    customer: string;
    sellerId: string;
    productId: string;
    unit: SaleUnit;
    quantity: number;
  }): Observable<SaleRecord> {
    return this.http.post<SaleRecord>(`${API_BASE_URL}/sales`, input);
  }

  registerSaleBatch(input: {
    customer: string;
    sellerId: string;
    lines: Array<{ productId: string; unit: SaleUnit; quantity: number }>;
  }): Observable<SaleRecord> {
    return this.http.post<SaleRecord>(`${API_BASE_URL}/sales/batch`, input);
  }

  authorizeSeller(sellerId: string): Observable<SellerAuthorization> {
    return this.http.post<SellerAuthorization>(`${API_BASE_URL}/sellers/authorize`, { sellerId });
  }
}
