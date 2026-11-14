import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '@env/environment';
import {
  BagLot,
  ExpenseRecord,
  ExpenseArea,
  InventoryItem,
  Product,
  ProductPurchaseDefaults,
  PurchaseRecord,
  PurchaseLineInput,
  SaleLine,
  SaleRecord,
  SaleUnit,
  Supplier,
  SellerAuthorization
} from './pos.models';

@Injectable({ providedIn: 'root' })
export class PosApiService {
  private readonly http = inject(HttpClient);
  /** La URL del backend viene del build (`src/environments/`). */
  private readonly baseUrl = environment.apiBaseUrl;

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  getPurchaseDefaults(): Observable<ProductPurchaseDefaults[]> {
    return this.http.get<ProductPurchaseDefaults[]>(`${this.baseUrl}/products/purchase-defaults`);
  }

  getLots(): Observable<BagLot[]> {
    return this.http.get<BagLot[]>(`${this.baseUrl}/inventory/lots`);
  }

  getPurchases(): Observable<PurchaseRecord[]> {
    return this.http.get<PurchaseRecord[]>(`${this.baseUrl}/purchases`);
  }

  getSales(): Observable<SaleRecord[]> {
    return this.http.get<SaleRecord[]>(`${this.baseUrl}/sales`);
  }

  getExpenses(): Observable<ExpenseRecord[]> {
    return this.http.get<ExpenseRecord[]>(`${this.baseUrl}/expenses`);
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
    return this.http.get<InventoryItem[]>(`${this.baseUrl}/inventory`);
  }

  createProduct(input: { name: string; category: string; minBags: number }): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, input);
  }

  registerPurchase(input: {
    supplier: Supplier;
    lines: PurchaseLineInput[];
  }): Observable<PurchaseRecord[]> {
    return this.http.post<PurchaseRecord[]>(`${this.baseUrl}/purchases`, input);
  }

  registerExpense(input: {
    concept: string;
    category: string;
    area: ExpenseArea;
    amount: number;
    notes?: string;
  }): Observable<ExpenseRecord> {
    return this.http.post<ExpenseRecord>(`${this.baseUrl}/expenses`, input);
  }

  quoteSale(productId: string, unit: SaleUnit, quantity: number): Observable<SaleLine> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('unit', unit)
      .set('quantity', quantity);

    return this.http.get<SaleLine>(`${this.baseUrl}/sales/quote`, { params });
  }

  registerSale(input: {
    customer: string;
    sellerId: string;
    productId: string;
    unit: SaleUnit;
    quantity: number;
  }): Observable<SaleRecord> {
    return this.http.post<SaleRecord>(`${this.baseUrl}/sales`, input);
  }

  registerSaleBatch(input: {
    customer: string;
    sellerId: string;
    lines: Array<{ productId: string; unit: SaleUnit; quantity: number }>;
  }): Observable<SaleRecord> {
    return this.http.post<SaleRecord>(`${this.baseUrl}/sales/batch`, input);
  }

  authorizeSeller(sellerId: string): Observable<SellerAuthorization> {
    return this.http.post<SellerAuthorization>(`${this.baseUrl}/sellers/authorize`, { sellerId });
  }
}
