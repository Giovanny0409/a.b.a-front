import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, startWith, switchMap } from 'rxjs';
import { Notifier } from '@core/notify/notification.service';
import { ProductKind, SaleLine, SaleRecord } from '@core/pos.models';
import { saleQuantityKey } from '@core/sale-quantity';
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
  /** Vendedor activo al cobrar. */
  seller: string;
}

const BAG_MODES: SalesEntryMode[] = ['bag', 'kg', 'money'];
const UNIT_MODES: SalesEntryMode[] = ['piece'];

/** Modos de venta que corresponden al tipo del producto. Sin tipo conocido, los de bulto. */
export function modesFor(kind: ProductKind | undefined): SalesEntryMode[] {
  return kind === 'unit' ? UNIT_MODES : BAG_MODES;
}

@Component({
  selector: 'aba-sales-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule, TranslatePipe],
  providers: [SalesStore],
  template: `
    <div class="sales-toolbar">
      <span class="badge ok" *ngIf="store.activeSeller() as seller">{{ 'sales.toolbar.seller' | translate: { name: seller.name } }}</span>
      <button class="btn secondary" type="button" (click)="changeSeller()">
        <i class="pi pi-user-edit"></i>
        {{ 'sales.toolbar.changeSeller' | translate }}
      </button>
      <button class="btn secondary" type="button" (click)="openSavedTicketsDialog()">
        <i class="pi pi-ticket"></i>
        {{ 'sales.savedTickets.title' | translate }}
        <span>{{ savedTickets().length }}</span>
      </button>
    </div>

    <section class="sales-layout">
      <article class="panel">
        <h2>{{ 'sales.form.title' | translate }}</h2>
        <form [formGroup]="form" (ngSubmit)="addLine()" class="sale-form">
          <label class="field">
            <span>{{ 'common.fields.customer' | translate }}</span>
            <input formControlName="customer" [placeholder]="'sales.form.customerPlaceholder' | translate">
          </label>

          <label class="field">
            <span>{{ 'common.fields.product' | translate }}</span>
            <select formControlName="productId">
              <option *ngFor="let product of store.products()" [value]="product.id">{{ product.name }}</option>
            </select>
            <span class="badge ok stock" *ngIf="form.controls.productId.value">{{ stockLabel(form.controls.productId.value) }}</span>
          </label>

          <label class="field">
            <span>{{ 'sales.form.mode' | translate }}</span>
            <select formControlName="mode">
              <option *ngFor="let mode of modes()" [value]="mode">{{ modeLabel(mode) | translate }}</option>
            </select>
          </label>

          <label class="field">
            <span>{{ amountLabel() | translate }}</span>
            <input formControlName="amount" type="number" min="0" step="0.01">
          </label>

          <div class="quote" *ngIf="quote(); else noQuote">
            <span>{{ 'sales.quote.total' | translate }}</span>
            <strong>{{ quote()?.total | currency: 'MXN' }}</strong>
            <small>{{ 'sales.quote.detail' | translate: {
              detail: quoteDetail(quote(), form.controls.mode.value),
              cost: (quote()?.cost | currency: 'MXN'),
              profit: (quote()?.profit | currency: 'MXN')
            } }}</small>
          </div>
          <ng-template #noQuote>
            <div class="quote muted">
              <span>{{ 'sales.quote.unavailableTitle' | translate }}</span>
              <strong>{{ 'sales.quote.unavailable' | translate }}</strong>
              <small>{{ 'sales.quote.unavailableHint' | translate }}</small>
            </div>
          </ng-template>

          <button class="btn" type="submit"><i class="pi pi-plus"></i> {{ 'sales.form.add' | translate }}</button>
        </form>
      </article>

      <article class="panel">
        <div class="head">
          <h2>{{ 'sales.cart.title' | translate }}</h2>
          <button class="btn secondary" type="button" (click)="clearCart()" [disabled]="cart().length === 0">
            <i class="pi pi-trash"></i>
            {{ 'sales.cart.clear' | translate }}
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'common.fields.product' | translate }}</th>
                <th>{{ 'sales.cart.mode' | translate }}</th>
                <th>{{ 'common.fields.quantity' | translate }}</th>
                <th>{{ 'common.fields.total' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of cart(); let i = index">
                <td>{{ line.productName }}</td>
                <td>{{ modeLabel(line.mode) | translate }}</td>
                <td>{{ lineDetail(line) }}</td>
                <td>{{ line.quote.total | currency: 'MXN' }}</td>
                <td>
                  <button class="icon-btn" type="button" [title]="'common.actions.removeProduct' | translate" (click)="removeLine(i)">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="cart().length === 0">
                <td colspan="5" class="empty">{{ 'sales.cart.empty' | translate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <form [formGroup]="paymentForm" (ngSubmit)="sell()" class="checkout">
          <div class="summary">
            <span>{{ 'sales.checkout.items' | translate }} <strong>{{ cart().length }}</strong></span>
            <span>{{ 'sales.checkout.total' | translate }} <strong>{{ total() | currency: 'MXN' }}</strong></span>
            <label class="field compact">
              <span>{{ 'sales.checkout.received' | translate }}</span>
              <input formControlName="received" type="number" min="0" step="0.01">
            </label>
            <span>{{ 'sales.checkout.change' | translate }} <strong>{{ change() | currency: 'MXN' }}</strong></span>
          </div>

          <button class="btn" type="submit" [disabled]="cart().length === 0 || isSelling()">
            <i class="pi pi-check"></i>
            {{ 'sales.checkout.finish' | translate }}
          </button>
        </form>
      </article>
    </section>

    <section class="dialog-overlay" *ngIf="savedTicketsDialogOpen()">
      <article class="dialog-panel saved-tickets-dialog">
        <div class="dialog-head">
          <div>
            <h2>{{ 'sales.savedTickets.title' | translate }}</h2>
            <span>{{ 'sales.savedTickets.count' | translate: { count: savedTickets().length } }}</span>
          </div>
          <button class="icon-btn neutral" type="button" [title]="'common.actions.close' | translate" (click)="closeSavedTicketsDialog()">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'common.fields.date' | translate }}</th>
                <th>{{ 'common.fields.customer' | translate }}</th>
                <th>{{ 'common.fields.total' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let savedTicket of savedTickets()">
                <td>{{ savedTicket.sale.soldAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ savedTicket.sale.customer }}</td>
                <td>{{ savedTicket.sale.total | currency: 'MXN' }}</td>
                <td class="ticket-row-actions">
                  <button class="icon-btn neutral" type="button" [title]="'sales.savedTickets.open' | translate" (click)="openSavedTicket(savedTicket)">
                    <i class="pi pi-eye"></i>
                  </button>
                  <button class="icon-btn" type="button" [title]="'sales.savedTickets.delete' | translate" (click)="deleteSavedTicket(savedTicket.sale.id)">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="savedTickets().length === 0">
                <td colspan="4" class="empty">{{ 'sales.savedTickets.empty' | translate }}</td>
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
            {{ 'common.actions.close' | translate }}
          </button>
          <button class="btn secondary" type="button" (click)="saveTicket(currentTicket)">
            <i class="pi pi-save"></i>
            {{ 'common.actions.save' | translate }}
          </button>
          <button class="btn" type="button" (click)="printTicket()">
            <i class="pi pi-print"></i>
            {{ 'sales.ticket.print' | translate }}
          </button>
        </div>

        <div class="ticket-paper" id="sale-ticket">
          <h2>{{ 'common.brand.name' | translate }}</h2>
          <p>{{ currentTicket.sale.soldAt | date: 'dd/MM/yyyy HH:mm' }}</p>
          <p>{{ 'sales.ticket.customer' | translate: { name: currentTicket.sale.customer } }}</p>
          <p class="ticket-seller">{{ 'sales.ticket.seller' | translate: { name: currentTicket.seller } }}</p>

          <table>
            <tbody>
              <tr *ngFor="let line of currentTicket.sale.lines">
                <td>
                  <strong>{{ line.productName }}</strong>
                  <span>{{ quantityKey(line) | translate: { quantity: formatNumber(line.quantity) } }}</span>
                </td>
                <td>{{ line.total | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="ticket-total">
            <span>{{ 'common.fields.total' | translate }}</span>
            <strong>{{ currentTicket.sale.total | currency: 'MXN' }}</strong>
          </div>
          <div class="ticket-total">
            <span>{{ 'sales.ticket.received' | translate }}</span>
            <span>{{ currentTicket.received | currency: 'MXN' }}</span>
          </div>
          <div class="ticket-total">
            <span>{{ 'sales.ticket.change' | translate }}</span>
            <span>{{ currentTicket.change | currency: 'MXN' }}</span>
          </div>

          <p class="thanks">{{ 'sales.ticket.thanks' | translate }}</p>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .sales-toolbar {
      align-items: center;
      display: flex;
      gap: 0.75rem;
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

    .stock {
      justify-self: start;
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
  private readonly translate = inject(TranslateService);
  private readonly notifier = inject(Notifier);
  readonly store = inject(SalesStore);
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
    // Al cambiar de producto, el modo pasa al primero que le corresponde si el actual ya no aplica.
    this.form.controls.productId.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((productId) => this.keepModeFor(productId));
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

  private readonly amountLabels: Record<SalesEntryMode, string> = {
    bag: 'sales.amount.bag',
    kg: 'sales.amount.kg',
    piece: 'sales.amount.piece',
    money: 'sales.amount.money'
  };

  private readonly modeLabels: Record<SalesEntryMode, string> = {
    bag: 'sales.modes.bag',
    kg: 'sales.modes.kg',
    piece: 'sales.modes.piece',
    money: 'sales.modes.money'
  };

  /** Clave de la etiqueta de la cantidad según el modo de venta. */
  amountLabel(): string {
    return this.amountLabels[this.form.controls.mode.value];
  }

  /** Clave del nombre del modo de venta. */
  modeLabel(mode: SalesEntryMode): string {
    return this.modeLabels[mode];
  }

  /** Modos que ofrece el producto elegido. */
  modes(): SalesEntryMode[] {
    return modesFor(this.store.productKind(this.form.controls.productId.value));
  }

  /** Existencia del producto: piezas para `unit`; bultos sellados y kg abiertos para `bag`. */
  stockLabel(productId: string): string {
    const stock = this.store.stock(productId);
    if (this.store.productKind(productId) === 'unit') {
      return this.translate.instant('common.units.piecesCount', { count: this.formatNumber(stock?.quantityTotal ?? 0) });
    }

    const bags = stock?.sealedBags ?? 0;
    const openKg = stock?.openKg ?? 0;
    return openKg > 0
      ? this.translate.instant('common.units.bagsAndOpenKg', { bags, kg: this.formatNumber(openKg) })
      : this.translate.instant('common.units.bagsCount', { count: bags });
  }

  /** Clave de la cantidad de una línea del ticket, con su unidad real y en plural si hace falta. */
  quantityKey(line: SaleLine): string {
    return saleQuantityKey(line.unit, line.quantity);
  }

  quoteDetail(quote: SaleLine | null, mode: SalesEntryMode): string {
    if (!quote) {
      return '';
    }

    const quantity = this.formatNumber(quote.quantity);
    const key = mode === 'money' ? 'sales.quantity.kg' : saleQuantityKey(quote.unit, quote.quantity);
    return this.translate.instant(key, { quantity });
  }

  lineDetail(line: CartLine): string {
    if (line.mode === 'money') {
      return this.translate.instant('sales.quantity.money', {
        amount: this.formatCurrency(line.amount),
        quantity: this.formatNumber(line.quote.quantity)
      });
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
      void this.notifier.error(this.translate.instant('sales.messages.insufficientPayment'));
      return;
    }

    this.isSelling.set(true);
    const customer = this.form.controls.customer.value;
    const lines = this.cart().map(({ productId, mode, amount }) => ({ productId, mode, amount }));

    this.store.registerSaleBatch(customer, lines).subscribe({
      next: (sale) => {
        const received = Number(this.paymentForm.controls.received.value || 0);
        const change = received - sale.total;
        const seller = this.store.activeSeller()?.name ?? '';
        this.ticket.set(null);
        this.clearCart();
        // La existencia cambió con la venta.
        this.store.load();

        void this.notifier.choice({
          icon: 'success',
          title: this.translate.instant('sales.messages.charged'),
          text: this.translate.instant('sales.messages.chargedDetail', {
            total: this.formatCurrency(sale.total),
            change: this.formatCurrency(change)
          }),
          confirm: this.translate.instant('sales.messages.viewTicket'),
          deny: this.translate.instant('sales.messages.newSale')
        }).then((choice) => {
          if (choice === 'confirm') {
            this.ticket.set({ sale, received, change, seller });
          }
        });
      },
      error: (error) => {
        // Un mensaje del backend no es una clave: instant() lo devuelve tal cual.
        void this.notifier.error(this.translate.instant(error?.error?.message ?? error?.message ?? 'sales.errors.register'));
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
    void this.notifier.success(this.translate.instant('sales.messages.ticketSaved'));
  }

  changeSeller(): void {
    this.store.changeSeller();
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
      change: ticket.change,
      seller: ticket.seller
    });
  }

  async deleteSavedTicket(saleId: string): Promise<void> {
    const confirmed = await this.notifier.confirm({
      title: this.translate.instant('sales.messages.confirmDeleteTicket'),
      confirm: this.translate.instant('notifications.actions.delete')
    });

    if (confirmed) {
      this.store.deleteSavedTicket(saleId);
    }
  }

  closeTicket(): void {
    this.ticket.set(null);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value);
  }

  private keepModeFor(productId: string): void {
    const modes = modesFor(this.store.productKind(productId));
    if (!modes.includes(this.form.controls.mode.value)) {
      this.form.controls.mode.setValue(modes[0]);
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}
