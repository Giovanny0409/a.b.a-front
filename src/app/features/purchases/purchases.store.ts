import { Injectable, inject, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { DataRefreshService } from '../../core/data-refresh.service';
import { Product, PurchaseRecord } from '../../core/pos.models';
import { PosApiService } from '../../core/pos-api.service';

@Injectable()
export class PurchasesStore {
  private readonly api = inject(PosApiService);
  private readonly refresh = inject(DataRefreshService);
  private readonly productsState = signal<Product[]>([]);

  readonly products = this.productsState.asReadonly();

  loadProducts(): void {
    this.api.getProducts().subscribe({
      next: (products) => this.productsState.set(products),
      error: () => this.productsState.set([])
    });
  }

  registerPurchase(input: {
    productName: string;
    supplier: string;
    bags: Array<{ markedKg: number; realKg: number; purchaseCost: number }>;
    salePriceBag: number;
    salePriceKg: number;
  }): Observable<PurchaseRecord> {
    const productName = input.productName.trim();
    const existingProduct = this.productsState().find(
      (product) => product.name.trim().toLocaleLowerCase() === productName.toLocaleLowerCase()
    );
    const savePurchase = (productId: string) => this.api.registerPurchase({
      productId,
      supplier: input.supplier || 'Sin proveedor',
      bags: input.bags,
      salePriceBag: input.salePriceBag,
      salePriceKg: input.salePriceKg
    });
    const request = existingProduct
      ? savePurchase(existingProduct.id)
      : this.api.createProduct({ name: productName, category: 'General', minBags: 0 }).pipe(
        tap((product) => this.productsState.update((products) => [...products, product])),
        switchMap((product) => savePurchase(product.id))
      );

    return request.pipe(
      tap(() => this.refresh.requestRefresh())
    );
  }
}
