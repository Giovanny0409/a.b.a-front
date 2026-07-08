import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, startWith, switchMap } from 'rxjs';
import { SaleLine, SaleRecord } from '../../core/pos.models';
import { SavedTicket } from './store/sales.actions';
import { PendingSaleLine, SalesEntryMode, SalesStore } from './sales.store';

interface CartLine extends PendingSaleLine {
  key: string;
  productName: string;
  quote: SaleLine;
}

interface TicketPreview {
  sale: SaleRecord;
  received: number;
  change: number;
}

@Component({
  selector: 'aba-sales-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule],
  providers: [SalesStore],
  template: `
    <div class="sales-toolbar">
      <button class="btn secondary" type="button" (click)="openSavedTicketsDialog()">
        <i class="pi pi-ticket"></i>
        Tickets guardados
        <span>{{ savedTickets().length }}</span>
      </button>
    </div>

    <section class="sales-layout">
      <article class="panel">
        <h2>Nueva venta</h2>
        <form [formGroup]="form" (ngSubmit)="addLine()" class="sale-form">
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
            <span>Total del producto</span>
            <strong>{{ quote()?.total | currency: 'MXN' }}</strong>
            <small>{{ quoteDetail(quote(), form.controls.mode.value) }} | Costo estimado {{ quote()?.cost | currency: 'MXN' }} | Ganancia {{ quote()?.profit | currency: 'MXN' }}</small>
          </div>
          <ng-template #noQuote>
            <div class="quote muted">
              <span>Inventario</span>
              <strong>No disponible</strong>
              <small>Revisa bultos sellados o kilos abiertos.</small>
            </div>
          </ng-template>

          <button class="btn" type="submit"><i class="pi pi-plus"></i> Agregar producto</button>
        </form>

        <p class="notice" *ngIf="message()">{{ message() }}</p>
      </article>

      <article class="panel">
        <div class="head">
          <h2>Productos de la venta</h2>
          <button class="btn secondary" type="button" (click)="clearCart()" [disabled]="cart().length === 0">
            <i class="pi pi-trash"></i>
            Limpiar
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Modo</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of cart(); let i = index">
                <td>{{ line.productName }}</td>
                <td>{{ modeLabel(line.mode) }}</td>
                <td>{{ lineDetail(line) }}</td>
                <td>{{ line.quote.total | currency: 'MXN' }}</td>
                <td>
                  <button class="icon-btn" type="button" title="Quitar producto" (click)="removeLine(i)">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="cart().length === 0">
                <td colspan="5" class="empty">Agrega productos para cobrar la venta.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <form [formGroup]="paymentForm" (ngSubmit)="sell()" class="checkout">
          <div class="summary">
            <span>Productos vendidos <strong>{{ cart().length }}</strong></span>
            <span>Total a cobrar <strong>{{ total() | currency: 'MXN' }}</strong></span>
            <label class="field compact">
              <span>Dinero recibido</span>
              <input formControlName="received" type="number" min="0" step="0.01">
            </label>
            <span>Cambio a entregar <strong>{{ change() | currency: 'MXN' }}</strong></span>
          </div>

          <button class="btn" type="submit" [disabled]="cart().length === 0 || isSelling()">
            <i class="pi pi-check"></i>
            Finalizar venta
          </button>
        </form>
      </article>
    </section>

    <section class="dialog-overlay" *ngIf="savedTicketsDialogOpen()">
      <article class="dialog-panel saved-tickets-dialog">
        <div class="dialog-head">
          <div>
            <h2>Tickets guardados</h2>
            <span>{{ savedTickets().length }} guardados</span>
          </div>
          <button class="icon-btn neutral" type="button" title="Cerrar" (click)="closeSavedTicketsDialog()">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let savedTicket of savedTickets()">
                <td>{{ savedTicket.sale.soldAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ savedTicket.sale.customer }}</td>
                <td>{{ savedTicket.sale.total | currency: 'MXN' }}</td>
                <td class="ticket-row-actions">
                  <button class="icon-btn neutral" type="button" title="Abrir ticket" (click)="openSavedTicket(savedTicket)">
                    <i class="pi pi-eye"></i>
                  </button>
                  <button class="icon-btn" type="button" title="Eliminar ticket" (click)="deleteSavedTicket(savedTicket.sale.id)">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="savedTickets().length === 0">
                <td colspan="4" class="empty">Los tickets guardados apareceran aqui.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="ticket-overlay" *ngIf="ticket() as currentTicket">
      <article class="ticket-panel">
        <div class="ticket-actions">
          <button class="btn secondary" type="button" (click)="closeTicket()">
            <i class="pi pi-times"></i>
            Cerrar
          </button>
          <button class="btn secondary" type="button" (click)="saveTicket(currentTicket)">
            <i class="pi pi-save"></i>
            Guardar
          </button>
          <button class="btn" type="button" (click)="printTicket()">
            <i class="pi pi-print"></i>
            Imprimir
          </button>
        </div>

        <div class="ticket-paper" id="sale-ticket">
          <h2>Alimentos Balanceados Alonso</h2>
          <p>{{ currentTicket.sale.soldAt | date: 'dd/MM/yyyy HH:mm' }}</p>
          <p>Cliente: {{ currentTicket.sale.customer }}</p>

          <table>
            <tbody>
              <tr *ngFor="let line of currentTicket.sale.lines">
                <td>
                  <strong>{{ line.productName }}</strong>
                  <span>{{ formatNumber(line.quantity) }} {{ line.unit === 'kg' ? 'kg' : 'bulto' }}</span>
                </td>
                <td>{{ line.total | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="ticket-total">
            <span>Total</span>
            <strong>{{ currentTicket.sale.total | currency: 'MXN' }}</strong>
          </div>
          <div class="ticket-total">
            <span>Recibido</span>
            <span>{{ currentTicket.received | currency: 'MXN' }}</span>
          </div>
          <div class="ticket-total">
            <span>Cambio</span>
            <span>{{ currentTicket.change | currency: 'MXN' }}</span>
          </div>

          <p class="thanks">Gracias por su compra</p>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .sales-toolbar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }

    .sales-toolbar .btn span {
      align-items: center;
      background: var(--brand);
      border-radius: 999px;
      color: #fff;
      display: inline-flex;
      font-size: 0.75rem;
      height: 1.35rem;
      justify-content: center;
      min-width: 1.35rem;
      padding: 0 0.35rem;
    }

    .sales-layout {
      display: grid;
      gap: 1rem;
      grid-template-columns: 24rem minmax(0, 1fr);
    }

    .sale-form {
      display: grid;
      gap: 0.85rem;
    }

    .head {
      align-items: center;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .head h2 {
      margin: 0;
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

    .empty {
      color: var(--muted);
      font-weight: 800;
      text-align: center;
    }

    .icon-btn {
      background: #fde2e0;
      border-radius: 8px;
      color: var(--danger);
      height: 2.25rem;
      width: 2.25rem;
    }

    .checkout {
      display: grid;
      gap: 0.85rem;
      margin-top: 1rem;
    }

    .summary {
      align-items: end;
      background: var(--surface-soft);
      border-radius: 8px;
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      padding: 0.85rem;
    }

    .summary span {
      color: var(--muted);
      display: grid;
      font-weight: 800;
      gap: 0.2rem;
    }

    .summary strong {
      color: var(--ink);
      font-size: 1.2rem;
    }

    .field.compact {
      margin: 0;
    }

    .notice {
      color: var(--ok);
      font-weight: 800;
    }

    .ticket-row-actions {
      display: flex;
      gap: 0.4rem;
      justify-content: flex-end;
    }

    .icon-btn.neutral {
      background: #e7f0ef;
      color: var(--brand);
    }

    .dialog-overlay,
    .ticket-overlay {
      align-items: flex-start;
      background: rgba(23, 33, 30, 0.52);
      display: flex;
      inset: 0;
      justify-content: center;
      overflow: auto;
      padding: 2rem 1rem;
      position: fixed;
      z-index: 50;
    }

    .dialog-panel,
    .ticket-panel {
      background: var(--surface);
      border-radius: 8px;
      box-shadow: var(--shadow);
      display: grid;
      gap: 1rem;
      max-width: 24rem;
      padding: 1rem;
      width: 100%;
    }

    .dialog-panel {
      max-width: 54rem;
    }

    .dialog-head {
      align-items: center;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
    }

    .dialog-head h2 {
      margin: 0;
    }

    .dialog-head span {
      color: var(--muted);
      display: block;
      font-weight: 800;
      margin-top: 0.2rem;
    }

    .ticket-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .ticket-paper {
      background: #fff;
      border: 1px solid var(--line);
      color: #17211e;
      display: grid;
      font-family: Arial, sans-serif;
      font-size: 12px;
      gap: 0.45rem;
      padding: 1rem;
    }

    .ticket-paper h2,
    .ticket-paper p {
      margin: 0;
      text-align: center;
    }

    .ticket-paper h2 {
      font-size: 1rem;
    }

    .ticket-paper table {
      min-width: 0;
      width: 100%;
    }

    .ticket-paper td {
      border-bottom: 1px dashed #999;
      padding: 0.45rem 0;
    }

    .ticket-paper td:last-child {
      text-align: right;
      white-space: nowrap;
    }

    .ticket-paper td span {
      display: block;
      margin-top: 0.15rem;
    }

    .ticket-total {
      display: flex;
      justify-content: space-between;
    }

    .thanks {
      margin-top: 0.6rem;
    }

    @media (max-width: 1080px) {
      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 980px) {
      .sales-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 620px) {
      .head,
      .summary {
        align-items: stretch;
        grid-template-columns: 1fr;
      }

      .head {
        flex-direction: column;
      }
    }

    @media print {
      body * {
        visibility: hidden;
      }

      .ticket-overlay,
      .ticket-overlay * {
        visibility: visible;
      }

      .ticket-overlay {
        background: #fff;
        display: block;
        inset: 0;
        padding: 0;
        position: fixed;
      }

      .ticket-panel {
        box-shadow: none;
        max-width: none;
        padding: 0;
      }

      .ticket-actions {
        display: none;
      }

      .ticket-paper {
        border: 0;
        width: 72mm;
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
  readonly cart = signal<CartLine[]>([]);
  readonly isSelling = signal(false);
  readonly ticket = signal<TicketPreview | null>(null);
  readonly savedTickets = this.store.savedTickets;
  readonly savedTicketsDialogOpen = signal(false);

  readonly form = this.fb.nonNullable.group({
    customer: [''],
    productId: ['', Validators.required],
    mode: ['bag' as SalesEntryMode, Validators.required],
    amount: [1, [Validators.required, Validators.min(0.01)]]
  });

  readonly paymentForm = this.fb.nonNullable.group({
    received: [0, [Validators.required, Validators.min(0)]]
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

  modeLabel(mode: SalesEntryMode): string {
    if (mode === 'money') {
      return 'Por pesos';
    }

    return mode === 'kg' ? 'Por kilo' : 'Por bulto';
  }

  quoteDetail(quote: SaleLine | null, mode: SalesEntryMode): string {
    if (!quote) {
      return '';
    }

    if (mode === 'money') {
      return `${this.formatNumber(quote.quantity)} kg`;
    }

    return `${this.formatNumber(quote.quantity)} ${quote.unit === 'kg' ? 'kg' : 'bulto'}`;
  }

  lineDetail(line: CartLine): string {
    if (line.mode === 'money') {
      return `${this.formatCurrency(line.amount)} = ${this.formatNumber(line.quote.quantity)} kg`;
    }

    return this.quoteDetail(line.quote, line.mode);
  }

  total(): number {
    return this.cart().reduce((sum, line) => sum + line.quote.total, 0);
  }

  change(): number {
    return Math.max(Number(this.paymentForm.controls.received.value || 0) - this.total(), 0);
  }

  addLine(): void {
    const quote = this.quote();
    if (this.form.invalid || !quote) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const productName = this.store.products().find((product) => product.id === value.productId)?.name ?? quote.productName;

    this.cart.update((lines) => [
      ...lines,
      {
        key: `${Date.now()}-${Math.random()}`,
        productId: value.productId,
        productName,
        mode: value.mode,
        amount: Number(value.amount),
        quote
      }
    ]);
    this.paymentForm.controls.received.setValue(this.total());
    this.form.patchValue({ amount: 1 });
    this.message.set('');
  }

  removeLine(index: number): void {
    this.cart.update((lines) => lines.filter((_, currentIndex) => currentIndex !== index));
    this.paymentForm.controls.received.setValue(this.total());
  }

  clearCart(): void {
    this.cart.set([]);
    this.paymentForm.controls.received.setValue(0);
  }

  sell(): void {
    if (this.cart().length === 0) {
      return;
    }

    if (this.paymentForm.invalid || Number(this.paymentForm.controls.received.value) < this.total()) {
      this.paymentForm.markAllAsTouched();
      this.message.set('El dinero recibido no cubre el total de la venta.');
      return;
    }

    this.isSelling.set(true);
    const customer = this.form.controls.customer.value;
    const lines = this.cart().map(({ productId, mode, amount }) => ({ productId, mode, amount }));

    this.store.registerSaleBatch(customer, lines).subscribe({
      next: (sale) => {
        const received = Number(this.paymentForm.controls.received.value || 0);
        const change = received - sale.total;
        this.message.set(`Venta cobrada por ${this.formatCurrency(sale.total)}. Cambio: ${this.formatCurrency(change)}.`);

        if (window.confirm('Venta finalizada. Requiere ticket?')) {
          this.ticket.set({ sale, received, change });
        } else {
          this.ticket.set(null);
        }

        this.clearCart();
      },
      error: (error) => {
        this.message.set(error?.error?.message ?? error?.message ?? 'No fue posible registrar la venta en el backend.');
      },
      complete: () => {
        this.isSelling.set(false);
      }
    });
  }

  printTicket(): void {
    window.print();
  }

  saveTicket(ticket: TicketPreview): void {
    const savedTicket: SavedTicket = {
      ...ticket,
      savedAt: new Date().toISOString()
    };

    this.store.saveTicket(savedTicket);
    this.message.set('Ticket guardado correctamente.');
  }

  openSavedTicketsDialog(): void {
    this.savedTicketsDialogOpen.set(true);
  }

  closeSavedTicketsDialog(): void {
    this.savedTicketsDialogOpen.set(false);
  }

  openSavedTicket(ticket: SavedTicket): void {
    this.closeSavedTicketsDialog();
    this.ticket.set({
      sale: ticket.sale,
      received: ticket.received,
      change: ticket.change
    });
  }

  deleteSavedTicket(saleId: string): void {
    if (!window.confirm('Eliminar este ticket guardado?')) {
      return;
    }

    this.store.deleteSavedTicket(saleId);
  }

  closeTicket(): void {
    this.ticket.set(null);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}
