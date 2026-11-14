import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideI18n } from '../../core/i18n/provide-i18n';
import { Notifier } from '../../core/notify/notification.service';
import { InventoryItem, ProductKind, Seller } from '../../core/pos.models';
import { FakeNotifier, fakeNotifier } from '../../testing/fake-notifier';
import { aProduct, aSale, aSaleLine, anInventoryItem } from '../../testing/fixtures';
import { t } from '../../testing/translate';
import { SalesPageComponent, modesFor } from './sales-page.component';
import { SalesStore } from './sales.store';
import { SavedTicket } from './store/sales.actions';

describe('SalesPageComponent', () => {
  let fixture: ComponentFixture<SalesPageComponent>;
  let component: SalesPageComponent;
  let notifier: FakeNotifier;
  let store: {
    products: ReturnType<typeof signal>;
    productKind: (id: string) => ProductKind | undefined;
    stock: (id: string) => InventoryItem | undefined;
    savedTickets: ReturnType<typeof signal>;
    activeSeller: ReturnType<typeof signal<Seller | null>>;
    changeSeller: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    quoteSale: ReturnType<typeof vi.fn>;
    registerSaleBatch: ReturnType<typeof vi.fn>;
    saveTicket: ReturnType<typeof vi.fn>;
    deleteSavedTicket: ReturnType<typeof vi.fn>;
  };
  const bagQuote = aSaleLine({ productId: 'p-1', unit: 'bag', quantity: 1, total: 400, profit: 80 });
  const products = [
    aProduct({ id: 'p-1', name: 'Maiz quebrado', kind: 'bag' }),
    aProduct({ id: 'p-2', name: 'Comedero para pollo 3 kg', kind: 'unit' })
  ];
  const inventory = [
    anInventoryItem({ product: products[0], sealedBags: 4, openKg: 12.5 }),
    anInventoryItem({ product: products[1], sealedBags: 0, openKg: 0, quantityTotal: 3 })
  ];

  beforeEach(() => {
    store = {
      products: signal(products),
      productKind: (id: string) => products.find((product) => product.id === id)?.kind,
      stock: (id: string) => inventory.find((item) => item.product.id === id),
      savedTickets: signal<SavedTicket[]>([]),
      activeSeller: signal<Seller | null>({ id: '0409', name: 'Aurelio' }),
      changeSeller: vi.fn(),
      load: vi.fn(),
      quoteSale: vi.fn(() => of(bagQuote)),
      registerSaleBatch: vi.fn(() => of(aSale({ total: 400 }))),
      saveTicket: vi.fn(),
      deleteSavedTicket: vi.fn()
    };
    notifier = fakeNotifier();
    TestBed.configureTestingModule({ providers: [provideI18n(), { provide: Notifier, useValue: notifier }] });
    TestBed.overrideComponent(SalesPageComponent, {
      set: { providers: [{ provide: SalesStore, useValue: store }] }
    });
    fixture = TestBed.createComponent(SalesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  async function quoted(): Promise<void> {
    await vi.waitFor(() => expect(component.quote()).not.toBeNull());
  }

  it('muestra al vendedor activo y al pulsar «Cambiar vendedor» pide el cambio a la fachada', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.sales-toolbar .badge')?.textContent?.trim()).toBe(t('sales.toolbar.seller', { name: 'Aurelio' }));

    store.activeSeller.set({ id: '2002', name: 'Ana' });
    fixture.detectChanges();
    expect(element.querySelector('.sales-toolbar .badge')?.textContent?.trim()).toBe(t('sales.toolbar.seller', { name: 'Ana' }));

    const boton = [...element.querySelectorAll<HTMLButtonElement>('.sales-toolbar button')]
      .find((button) => button.textContent?.includes(t('sales.toolbar.changeSeller')));
    boton?.click();
    expect(store.changeSeller).toHaveBeenCalled();
  });

  it('no muestra vendedor si no hay uno activo', () => {
    store.activeSeller.set(null);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.sales-toolbar .badge')).toBeNull();
  });

  it('se crea, carga y elige el primer producto', () => {
    expect(store.load).toHaveBeenCalled();
    expect(component.form.controls.productId.value).toBe('p-1');
  });

  it('cotiza con la fachada al cambiar el formulario', async () => {
    component.form.patchValue({ mode: 'kg', amount: 2.5 });

    await vi.waitFor(() => expect(store.quoteSale).toHaveBeenLastCalledWith('p-1', 'kg', 2.5));
    await quoted();
  });

  it.each([
    ['bag', 'sales.amount.bag', 'sales.modes.bag'],
    ['kg', 'sales.amount.kg', 'sales.modes.kg'],
    ['piece', 'sales.amount.piece', 'sales.modes.piece'],
    ['money', 'sales.amount.money', 'sales.modes.money']
  ] as const)('modo %s: claves «%s» y «%s»', (mode, amountLabel, modeLabel) => {
    component.form.controls.mode.setValue(mode);

    expect(component.amountLabel()).toBe(amountLabel);
    expect(component.modeLabel(mode)).toBe(modeLabel);
  });

  function modeOptions(): Array<string | undefined> {
    fixture.detectChanges();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('select[formcontrolname="mode"] option')]
      .map((option) => option.textContent?.trim());
  }

  it('da los modos según el tipo del producto', () => {
    expect(modesFor('unit')).toEqual(['piece']);
    expect(modesFor('bag')).toEqual(['bag', 'kg', 'money']);
    expect(modesFor(undefined)).toEqual(['bag', 'kg', 'money']);
  });

  it('un producto de bulto ofrece bulto, kilo y pesos, y no pieza', () => {
    expect(modeOptions()).toEqual([t('sales.modes.bag'), t('sales.modes.kg'), t('sales.modes.money')]);
  });

  it('un comedero solo ofrece «Por pieza» y ya queda elegido', () => {
    component.form.controls.mode.setValue('kg');

    component.form.controls.productId.setValue('p-2');

    expect(modeOptions()).toEqual([t('sales.modes.piece')]);
    expect(component.form.controls.mode.value).toBe('piece');
  });

  it('al volver a un producto de bulto el modo pasa a «Por bulto»', () => {
    component.form.controls.productId.setValue('p-2');
    component.form.controls.productId.setValue('p-1');

    expect(component.form.controls.mode.value).toBe('bag');
  });

  it('muestra la existencia del producto elegido', () => {
    const stock = () => {
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector('.stock')?.textContent?.trim();
    };

    expect(stock()).toBe(t('common.units.bagsAndOpenKg', { bags: 4, kg: '12.5' }));

    component.form.controls.productId.setValue('p-2');
    expect(stock()).toBe(t('common.units.piecesCount', { count: 3 }));
  });

  it('muestra la etiqueta de la cantidad con los textos del diccionario', () => {
    component.form.controls.mode.setValue('kg');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain(t('sales.amount.kg'));
    expect(element.querySelector<HTMLInputElement>('input[formcontrolname="customer"]')?.placeholder)
      .toBe(t('sales.form.customerPlaceholder'));
  });

  it('describe la cotización según la unidad', () => {
    expect(component.quoteDetail(null, 'bag')).toBe('');
    expect(component.quoteDetail(aSaleLine({ unit: 'bag', quantity: 2 }), 'bag')).toBe(t('sales.quantity.bags', { quantity: 2 }));
    expect(component.quoteDetail(aSaleLine({ unit: 'kg', quantity: 2.5 }), 'kg')).toBe(t('sales.quantity.kg', { quantity: '2.5' }));
    expect(component.quoteDetail(aSaleLine({ unit: 'piece', quantity: 3 }), 'piece')).toBe(t('sales.quantity.pieces', { quantity: 3 }));
    expect(component.quoteDetail(aSaleLine({ unit: 'kg', quantity: 4 }), 'money')).toBe(t('sales.quantity.kg', { quantity: 4 }));
  });

  it('agrega líneas al carrito, suma el total y propone el pago exacto', async () => {
    await quoted();

    component.addLine();
    component.addLine();

    expect(component.cart()).toHaveLength(2);
    expect(component.cart()[0]).toMatchObject({ productId: 'p-1', productName: 'Maiz quebrado', mode: 'bag', amount: 1 });
    expect(component.total()).toBe(800);
    expect(component.paymentForm.controls.received.value).toBe(800);
    expect(component.change()).toBe(0);
  });

  it('describe una línea por pesos con el importe y los kilos', async () => {
    await quoted();
    component.form.patchValue({ mode: 'money', amount: 100 });
    store.quoteSale.mockReturnValue(of(aSaleLine({ unit: 'kg', quantity: 4, total: 100 })));
    await vi.waitFor(() => expect(component.quote()?.quantity).toBe(4));

    component.addLine();

    expect(component.lineDetail(component.cart()[0])).toBe(t('sales.quantity.money', { amount: '$100.00', quantity: 4 }));
  });

  it('no agrega una línea sin cotización', () => {
    component.quote.set(null);

    component.addLine();

    expect(component.cart()).toEqual([]);
  });

  it('quita una línea y vacía el carrito', async () => {
    await quoted();
    component.addLine();
    component.addLine();

    component.removeLine(0);
    expect(component.cart()).toHaveLength(1);
    expect(component.paymentForm.controls.received.value).toBe(400);

    component.clearCart();
    expect(component.cart()).toEqual([]);
    expect(component.paymentForm.controls.received.value).toBe(0);
  });

  it('calcula el cambio y no cobra si el pago no alcanza', async () => {
    await quoted();
    component.addLine();
    component.paymentForm.controls.received.setValue(500);
    expect(component.change()).toBe(100);

    component.paymentForm.controls.received.setValue(300);
    component.sell();

    expect(store.registerSaleBatch).not.toHaveBeenCalled();
    expect(notifier.error).toHaveBeenCalledWith(t('sales.messages.insufficientPayment'));
  });

  it('no hace nada al cobrar un carrito vacío', () => {
    component.sell();

    expect(store.registerSaleBatch).not.toHaveBeenCalled();
  });

  it('cobra, avisa «Venta cobrada» con total y cambio, y con «Ver ticket» abre el ticket con el vendedor', async () => {
    notifier.choice.mockResolvedValue('confirm');
    await quoted();
    component.form.controls.customer.setValue('Juan');
    component.addLine();
    component.paymentForm.controls.received.setValue(500);

    component.sell();

    expect(store.registerSaleBatch).toHaveBeenCalledWith('Juan', [{ productId: 'p-1', mode: 'bag', amount: 1 }]);
    expect(notifier.choice).toHaveBeenCalledWith({
      icon: 'success',
      title: t('sales.messages.charged'),
      text: t('sales.messages.chargedDetail', { total: '$400.00', change: '$100.00' }),
      confirm: t('sales.messages.viewTicket'),
      deny: t('sales.messages.newSale')
    });
    await vi.waitFor(() => expect(component.ticket()).toEqual({
      sale: aSale({ total: 400 }), received: 500, change: 100, seller: 'Aurelio'
    }));
    expect(component.cart()).toEqual([]);
    expect(component.isSelling()).toBe(false);
  });

  it('vuelve a cargar la existencia después de cobrar', async () => {
    await quoted();
    component.addLine();
    store.load.mockClear();

    component.sell();

    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it.each(['deny', 'dismiss'] as const)('con «%s» cobra sin abrir el ticket y deja el carrito vacío', async (choice) => {
    notifier.choice.mockResolvedValue(choice);
    await quoted();
    component.addLine();

    component.sell();
    await Promise.resolve();

    expect(component.ticket()).toBeNull();
    expect(component.cart()).toEqual([]);
  });

  it('el ticket muestra la unidad real de cada línea y al vendedor', () => {
    component.ticket.set({
      sale: aSale({
        lines: [
          aSaleLine({ id: 'a', productName: 'Comedero', unit: 'piece', quantity: 1 }),
          aSaleLine({ id: 'b', productName: 'Maiz', unit: 'bag', quantity: 2 }),
          aSaleLine({ id: 'c', productName: 'Salvado', unit: 'kg', quantity: 2.5 })
        ]
      }),
      received: 500,
      change: 100,
      seller: 'Ana'
    });
    fixture.detectChanges();

    const paper = (fixture.nativeElement as HTMLElement).querySelector('#sale-ticket');
    const lines = [...(paper?.querySelectorAll('tbody tr span') ?? [])].map((span) => span.textContent?.trim());
    expect(lines).toEqual([
      t('sales.quantity.piece', { quantity: '1' }),
      t('sales.quantity.bags', { quantity: '2' }),
      t('sales.quantity.kg', { quantity: '2.5' })
    ]);
    expect(paper?.querySelector('.ticket-seller')?.textContent?.trim()).toBe(t('sales.ticket.seller', { name: 'Ana' }));
  });

  it('ya no pinta avisos en la pantalla', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('.notice')).toBeNull();
  });

  it('muestra el error de la venta y conserva el carrito', async () => {
    store.registerSaleBatch.mockReturnValue(throwError(() => new Error('No hay inventario suficiente para esta venta.')));
    await quoted();
    component.addLine();

    component.sell();

    expect(notifier.error).toHaveBeenCalledWith('No hay inventario suficiente para esta venta.');
    expect(notifier.choice).not.toHaveBeenCalled();
    expect(component.cart()).toHaveLength(1);
  });

  it('guarda, abre y cierra tickets', () => {
    const preview = { sale: aSale(), received: 500, change: 100, seller: 'Aurelio' };

    component.saveTicket(preview);
    expect(store.saveTicket).toHaveBeenCalledWith(expect.objectContaining({ ...preview, savedAt: expect.any(String) }));
    expect(notifier.success).toHaveBeenCalledWith(t('sales.messages.ticketSaved'));

    component.openSavedTicketsDialog();
    expect(component.savedTicketsDialogOpen()).toBe(true);
    component.openSavedTicket({ ...preview, savedAt: '2026-11-10T15:00:00Z' });
    expect(component.savedTicketsDialogOpen()).toBe(false);
    expect(component.ticket()).toEqual(preview);

    component.closeTicket();
    expect(component.ticket()).toBeNull();
  });

  it('borra un ticket guardado solo si se confirma en el diálogo de la app', async () => {
    notifier.confirm.mockResolvedValue(false);
    await component.deleteSavedTicket('sale-1');
    expect(notifier.confirm).toHaveBeenCalledWith({
      title: t('sales.messages.confirmDeleteTicket'),
      confirm: t('notifications.actions.delete')
    });
    expect(store.deleteSavedTicket).not.toHaveBeenCalled();

    notifier.confirm.mockResolvedValue(true);
    await component.deleteSavedTicket('sale-1');
    expect(store.deleteSavedTicket).toHaveBeenCalledWith('sale-1');
  });

  it('imprime el ticket con el navegador', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    component.printTicket();

    expect(print).toHaveBeenCalled();
  });
});
