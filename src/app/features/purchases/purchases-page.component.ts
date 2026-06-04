import { CurrencyPipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PurchasesStore } from './purchases.store';

type BagForm = FormGroup<{
  markedKg: FormControl<number>;
  realKg: FormControl<number>;
  purchaseCost: FormControl<number>;
}>;

@Component({
  selector: 'aba-purchases-page',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, NgFor, NgIf, ReactiveFormsModule],
  providers: [PurchasesStore],
  template: `
    <section class="panel">
      <div class="head">
        <div>
          <h2>Registrar compra de bultos</h2>
          <p>Captura kilos marcados y kilos reales para que la venta por kilo calcule mejor la ganancia.</p>
        </div>
        <button class="btn secondary" type="button" (click)="addBag()">
          <i class="pi pi-plus"></i>
          Bulto
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <label class="field">
            <span>Producto</span>
            <input formControlName="productName" list="purchase-products" placeholder="Producto comprado">
            <datalist id="purchase-products">
              <option *ngFor="let product of store.products()" [value]="product.name"></option>
            </datalist>
          </label>

          <label class="field">
            <span>Proveedor</span>
            <input formControlName="supplier" placeholder="Nombre del proveedor">
          </label>

          <label class="field">
            <span>Precio venta por bulto</span>
            <input formControlName="salePriceBag" type="number" min="0" step="0.01">
          </label>

          <label class="field">
            <span>Precio venta por kilo</span>
            <input formControlName="salePriceKg" type="number" min="0" step="0.01">
          </label>
        </div>

        <div class="table-wrap">
          <table formArrayName="bags">
            <thead>
              <tr>
                <th>#</th>
                <th>Kg marcados</th>
                <th>Kg reales</th>
                <th>Costo compra</th>
                <th>Costo real/kg</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bag of bags.controls; let i = index" [formGroupName]="i">
                <td>{{ i + 1 }}</td>
                <td><input formControlName="markedKg" type="number" min="0" step="0.01"></td>
                <td><input formControlName="realKg" type="number" min="0" step="0.01"></td>
                <td><input formControlName="purchaseCost" type="number" min="0" step="0.01"></td>
                <td>{{ costPerKg(i) | currency: 'MXN' }}</td>
                <td>
                  <button class="icon-btn" type="button" title="Quitar bulto" (click)="removeBag(i)" [disabled]="bags.length === 1">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="totals">
          <span>Inversion: <strong>{{ totals().investment | currency: 'MXN' }}</strong></span>
          <span>Kg reales: <strong>{{ totals().realKg | number: '1.1-2' }}</strong></span>
          <span>Bultos: <strong>{{ bags.length }}</strong></span>
          <button class="btn" type="submit"><i class="pi pi-save"></i> Guardar compra</button>
        </footer>
      </form>

      <p class="notice" *ngIf="message()">{{ message() }}</p>
    </section>
  `,
  styles: [`
    .head,
    .totals {
      align-items: center;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
    }

    .head p {
      color: var(--muted);
      margin: -0.45rem 0 0.9rem;
    }

    .form-grid {
      display: grid;
      gap: 0.8rem;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-bottom: 1rem;
    }

    td input {
      border: 1px solid var(--line);
      border-radius: 8px;
      min-height: 2.35rem;
      padding: 0.45rem;
      width: 8rem;
    }

    .icon-btn {
      background: #fde2e0;
      border-radius: 8px;
      color: var(--danger);
      height: 2.25rem;
      width: 2.25rem;
    }

    .icon-btn:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    .totals {
      background: var(--surface-soft);
      border-radius: 8px;
      flex-wrap: wrap;
      margin-top: 1rem;
      padding: 0.75rem;
    }

    .notice {
      color: var(--ok);
      font-weight: 800;
      margin-bottom: 0;
    }

    @media (max-width: 980px) {
      .form-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 620px) {
      .head,
      .form-grid {
        grid-template-columns: 1fr;
      }

      .head {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `]
})
export class PurchasesPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(PurchasesStore);
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    productName: ['', Validators.required],
    supplier: [''],
    salePriceBag: [0, [Validators.required, Validators.min(0.01)]],
    salePriceKg: [0, [Validators.required, Validators.min(0.01)]],
    bags: this.fb.array([this.createBag()])
  });

  constructor() {
    this.store.loadProducts();
    effect(() => {
      const firstProductName = this.store.products()[0]?.name;
      if (firstProductName && !this.form.controls.productName.value) {
        this.form.controls.productName.setValue(firstProductName);
      }
    });
  }

  totals(): { realKg: number; investment: number } {
    return this.bags.controls.reduce(
      (acc, group) => ({
        realKg: acc.realKg + Number(group.controls.realKg.value || 0),
        investment: acc.investment + Number(group.controls.purchaseCost.value || 0)
      }),
      { realKg: 0, investment: 0 }
    );
  }

  get bags(): FormArray<BagForm> {
    return this.form.controls.bags;
  }

  addBag(): void {
    this.bags.push(this.createBag());
  }

  removeBag(index: number): void {
    if (this.bags.length > 1) {
      this.bags.removeAt(index);
    }
  }

  costPerKg(index: number): number {
    const group = this.bags.at(index);
    const realKg = Number(group.controls.realKg.value || 0);
    const cost = Number(group.controls.purchaseCost.value || 0);
    return realKg > 0 ? cost / realKg : 0;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.store.registerPurchase({
      productName: value.productName,
      supplier: value.supplier || 'Sin proveedor',
      salePriceBag: value.salePriceBag,
      salePriceKg: value.salePriceKg,
      bags: value.bags
    }).subscribe({
      next: () => {
        this.message.set('Compra registrada en el backend y bultos agregados al inventario.');
        this.form.controls.bags.clear();
        this.form.controls.bags.push(this.createBag());
      },
      error: (error) => {
        this.message.set(error?.error?.message ?? 'No fue posible registrar la compra en el backend.');
      }
    });
  }

  private createBag(): BagForm {
    return this.fb.nonNullable.group({
      markedKg: [40, [Validators.required, Validators.min(0.01)]],
      realKg: [40, [Validators.required, Validators.min(0.01)]],
      purchaseCost: [0, [Validators.required, Validators.min(0.01)]]
    });
  }
}
