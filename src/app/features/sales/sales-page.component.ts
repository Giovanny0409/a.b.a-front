import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, startWith, switchMap } from 'rxjs';
import { SaleLine } from '../../core/pos.models';
import { SalesEntryMode, SalesStore } from './sales.store';

@Component({
  selector: 'aba-sales-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule],
  providers: [SalesStore],
  template: `
    <section class="sales-layout">
      <article class="panel">
        <h2>Nueva venta</h2>
        <form [formGroup]="form" (ngSubmit)="sell()" class="sale-form">
          <label class="field">
            <span>Cliente</span>
            <input formControlName="customer" placeholder="Publico general">
          </label>

          <label class="field">
            <span>Producto</span>
            <select formControlName="productId">
              <option *ngFor="let product of store.products()" [value]="product.id">{{ product.name }}</option>
            </select>
          </label>

          <label class="field">
            <span>Venta</span>
            <select formControlName="mode">
              <option value="bag">Por bulto</option>
              <option value="kg">Por kilo</option>
              <option value="money">Por pesos</option>
            </select>
          </label>

          <label class="field">
            <span>{{ amountLabel() }}</span>
            <input formControlName="amount" type="number" min="0" step="0.01">
          </label>

          <div class="quote" *ngIf="quote(); else noQuote">
            <span>Total</span>
            <strong>{{ quote()?.total | currency: 'MXN' }}</strong>
            <small>{{ quoteDetail() }} | Costo estimado {{ quote()?.cost | currency: 'MXN' }} | Ganancia {{ quote()?.profit | currency: 'MXN' }}</small>
          </div>
          <ng-template #noQuote>
            <div class="quote muted">
              <span>Inventario</span>
              <strong>No disponible</strong>
              <small>Revisa bultos sellados o kilos abiertos.</small>
            </div>
          </ng-template>

          <button class="btn" type="submit"><i class="pi pi-check"></i> Cobrar venta</button>
        </form>

        <p class="notice" *ngIf="message()">{{ message() }}</p>
      </article>

      <article class="panel">
        <h2>Ultimas ventas</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Total</th>
                <th>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sale of store.sales().slice(0, 8)">
                <td>{{ sale.soldAt | date: 'dd/MM HH:mm' }}</td>
                <td>{{ sale.customer }}</td>
                <td>{{ sale.lines[0].productName }}</td>
                <td>{{ sale.total | currency: 'MXN' }}</td>
                <td>{{ sale.profit | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .sales-layout {
      display: grid;
      gap: 1rem;
      grid-template-columns: 24rem minmax(0, 1fr);
    }

    .sale-form {
      display: grid;
      gap: 0.85rem;
    }

    .quote {
      background: var(--surface-soft);
      border-left: 4px solid var(--brand);
      border-radius: 8px;
      display: grid;
      gap: 0.25rem;
      padding: 0.85rem;
    }

    .quote.muted {
      border-left-color: var(--gold);
    }

    .quote span,
    .quote small {
      color: var(--muted);
      font-weight: 700;
    }

    .quote strong {
      font-size: 1.55rem;
    }

    .notice {
      color: var(--ok);
      font-weight: 800;
    }

    @media (max-width: 980px) {
      .sales-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SalesPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly store = inject(SalesStore);
  readonly message = signal('');
  readonly quote = signal<SaleLine | null>(null);

  readonly form = this.fb.nonNullable.group({
    customer: [''],
    productId: ['', Validators.required],
    mode: ['bag' as SalesEntryMode, Validators.required],
    amount: [1, [Validators.required, Validators.min(0.01)]]
  });

  constructor() {
    this.store.load();
    effect(() => {
      const firstProductId = this.store.products()[0]?.id;
      if (firstProductId && !this.form.controls.productId.value) {
        this.form.controls.productId.setValue(firstProductId);
      }
    });
    this.form.valueChanges.pipe(
      startWith(this.form.getRawValue()),
      debounceTime(120),
      switchMap((value) => this.store.quoteSale(
        value.productId ?? '',
        value.mode ?? 'bag',
        Number(value.amount ?? 0)
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((quote) => this.quote.set(quote));
  }

  amountLabel(): string {
    const mode = this.form.controls.mode.value;
    if (mode === 'money') {
      return 'Importe';
    }

    return mode === 'kg' ? 'Kilos' : 'Bultos';
  }

  quoteDetail(): string {
    const quote = this.quote();
    if (!quote) {
      return '';
    }

    if (this.form.controls.mode.value === 'money') {
      return `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(quote.quantity)} kg`;
    }

    return `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(quote.quantity)} ${quote.unit === 'kg' ? 'kg' : 'bulto'}`;
  }

  sell(): void {
    if (this.form.invalid || !this.quote()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.store.registerSale(value.customer, value.productId, value.mode, Number(value.amount)).subscribe({
      next: (sale) => {
        this.message.set(`Venta cobrada por ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(sale.total)}.`);
        this.form.patchValue({ amount: 1 });
      },
      error: (error) => {
        this.message.set(error?.error?.message ?? 'No fue posible registrar la venta en el backend.');
      }
    });
  }
}
