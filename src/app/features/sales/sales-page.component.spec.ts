import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Seller } from '../../core/pos.models';
import { aProduct, aSale, aSaleLine } from '../../testing/fixtures';
import { SalesPageComponent } from './sales-page.component';
import { SalesStore } from './sales.store';
import { SavedTicket } from './store/sales.actions';

describe('SalesPageComponent', () => {
  let fixture: ComponentFixture<SalesPageComponent>;
  let component: SalesPageComponent;
  let store: {
    products: ReturnType<typeof signal>;
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

  beforeEach(() => {
    store = {
      products: signal([aProduct({ id: 'p-1', name: 'Maiz quebrado' }), aProduct({ id: 'p-2', name: 'Correa' })]),
      savedTickets: signal<SavedTicket[]>([]),
      activeSeller: signal<Seller | null>({ id: '0409', name: 'Aurelio' }),
      changeSeller: vi.fn(),
      load: vi.fn(),
      quoteSale: vi.fn(() => of(bagQuote)),
      registerSaleBatch: vi.fn(() => of(aSale({ total: 400 }))),
      saveTicket: vi.fn(),
      deleteSavedTicket: vi.fn()
    };
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
    expect(element.querySelector('.sales-toolbar .badge')?.textContent?.trim()).toBe('Vendedor: Aurelio');

    store.activeSeller.set({ id: '2002', name: 'Ana' });
    fixture.detectChanges();
    expect(element.querySelector('.sales-toolbar .badge')?.textContent?.trim()).toBe('Vendedor: Ana');

    const boton = [...element.querySelectorAll<HTMLButtonElement>('.sales-toolbar button')]
      .find((button) => button.textContent?.includes('Cambiar vendedor'));
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
    ['bag', 'Bultos', 'Por bulto'],
    ['kg', 'Kilos', 'Por kilo'],
    ['piece', 'Piezas', 'Por pieza'],
    ['money', 'Importe', 'Por pesos']
  ] as const)('modo %s: etiqueta «%s» y «%s»', (mode, amountLabel, modeLabel) => {
    component.form.controls.mode.setValue(mode);

    expect(component.amountLabel()).toBe(amountLabel);
    expect(component.modeLabel(mode)).toBe(modeLabel);
  });

  it('describe la cotización según la unidad', () => {
    expect(component.quoteDetail(null, 'bag')).toBe('');
    expect(component.quoteDetail(aSaleLine({ unit: 'bag', quantity: 2 }), 'bag')).toBe('2 bulto');
    expect(component.quoteDetail(aSaleLine({ unit: 'kg', quantity: 2.5 }), 'kg')).toBe('2.5 kg');
    expect(component.quoteDetail(aSaleLine({ unit: 'piece', quantity: 3 }), 'piece')).toBe('3 pieza(s)');
    expect(component.quoteDetail(aSaleLine({ unit: 'kg', quantity: 4 }), 'money')).toBe('4 kg');
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

    expect(component.lineDetail(component.cart()[0])).toMatch(/^\$100\.00 = 4 kg$/);
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
    expect(component.message()).toBe('El dinero recibido no cubre el total de la venta.');
  });

  it('no hace nada al cobrar un carrito vacío', () => {
    component.sell();

    expect(store.registerSaleBatch).not.toHaveBeenCalled();
  });

  it('cobra, muestra el ticket si se pide y vacía el carrito', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await quoted();
    component.form.controls.customer.setValue('Juan');
    component.addLine();
    component.paymentForm.controls.received.setValue(500);

    component.sell();

    expect(store.registerSaleBatch).toHaveBeenCalledWith('Juan', [{ productId: 'p-1', mode: 'bag', amount: 1 }]);
    expect(component.message()).toMatch(/^Venta cobrada por \$400\.00\. Cambio: \$100\.00\.$/);
    expect(component.ticket()).toEqual({ sale: aSale({ total: 400 }), received: 500, change: 100 });
    expect(component.cart()).toEqual([]);
    expect(component.isSelling()).toBe(false);
  });

  it('cobra sin ticket si no se pide', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await quoted();
    component.addLine();

    component.sell();

    expect(component.ticket()).toBeNull();
  });

  it('muestra el error de la venta y conserva el carrito', async () => {
    store.registerSaleBatch.mockReturnValue(throwError(() => new Error('No hay inventario suficiente para esta venta.')));
    await quoted();
    component.addLine();

    component.sell();

    expect(component.message()).toBe('No hay inventario suficiente para esta venta.');
    expect(component.cart()).toHaveLength(1);
  });

  it('guarda, abre y cierra tickets', () => {
    const preview = { sale: aSale(), received: 500, change: 100 };

    component.saveTicket(preview);
    expect(store.saveTicket).toHaveBeenCalledWith(expect.objectContaining({ ...preview, savedAt: expect.any(String) }));
    expect(component.message()).toBe('Ticket guardado correctamente.');

    component.openSavedTicketsDialog();
    expect(component.savedTicketsDialogOpen()).toBe(true);
    component.openSavedTicket({ ...preview, savedAt: '2026-11-10T15:00:00Z' });
    expect(component.savedTicketsDialogOpen()).toBe(false);
    expect(component.ticket()).toEqual(preview);

    component.closeTicket();
    expect(component.ticket()).toBeNull();
  });

  it('borra un ticket guardado solo si se confirma', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteSavedTicket('sale-1');
    expect(store.deleteSavedTicket).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    component.deleteSavedTicket('sale-1');
    expect(store.deleteSavedTicket).toHaveBeenCalledWith('sale-1');
  });

  it('imprime el ticket con el navegador', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    component.printTicket();

    expect(print).toHaveBeenCalled();
  });
});
