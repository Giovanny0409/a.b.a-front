import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { PosApiService } from '../../core/pos-api.service';
import { FakePosApi, fakePosApi } from '../../testing/fake-pos-api';
import { aProduct, aSale, aSaleLine } from '../../testing/fixtures';
import { SalesStore } from './sales.store';
import { SalesActions, SavedTicket } from './store/sales.actions';
import { selectActiveSeller, selectSalesProducts, selectSalesRecords, selectSavedTickets } from './store/sales.selectors';

describe('SalesStore', () => {
  let facade: SalesStore;
  let store: MockStore;
  let api: FakePosApi;
  let actions$: Subject<Action>;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    api = fakePosApi();
    TestBed.configureTestingModule({
      providers: [
        SalesStore,
        provideMockStore({
          selectors: [
            { selector: selectSalesProducts, value: [aProduct()] },
            { selector: selectSalesRecords, value: [aSale()] },
            { selector: selectActiveSeller, value: { id: '0409', name: 'Aurelio' } },
            { selector: selectSavedTickets, value: [] }
          ]
        }),
        provideMockActions(() => actions$),
        provideRouter([]),
        { provide: PosApiService, useValue: api }
      ]
    });
    facade = TestBed.inject(SalesStore);
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  afterEach(() => store.resetSelectors());

  function lastDispatched<T>(): T {
    const calls = (store.dispatch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    return calls[calls.length - 1][0] as T;
  }

  it('expone productos, ventas, vendedor y tickets', () => {
    expect(facade.products()).toEqual([aProduct()]);
    expect(facade.sales()).toEqual([aSale()]);
    expect(facade.activeSeller()).toEqual({ id: '0409', name: 'Aurelio' });
    expect(facade.savedTickets()).toEqual([]);
  });

  it('para cambiar de vendedor quita al activo y vuelve a entrar a Ventas para que el guard pida el ID', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await facade.changeSeller();

    expect(store.dispatch).toHaveBeenCalledWith(SalesActions.clearSeller());
    expect(navigate).toHaveBeenCalledWith('/ventas', { onSameUrlNavigation: 'reload' });
  });

  it('despacha la carga', () => {
    facade.load();

    expect(store.dispatch).toHaveBeenCalledWith(SalesActions.load());
  });

  describe('quoteSale', () => {
    it('no cotiza sin producto o con cantidad cero', async () => {
      await expect(firstValueFrom(facade.quoteSale('', 'bag', 1))).resolves.toBeNull();
      await expect(firstValueFrom(facade.quoteSale('p-1', 'kg', 0))).resolves.toBeNull();
      expect(api.quoteSale).not.toHaveBeenCalled();
    });

    it('cotiza por bulto, kilo o pieza con la API', async () => {
      api.quoteSale.mockReturnValue(of(aSaleLine()));

      await expect(firstValueFrom(facade.quoteSale('p-1', 'piece', 3))).resolves.toEqual(aSaleLine());
      expect(api.quoteSale).toHaveBeenCalledWith('p-1', 'piece', 3);
    });

    it('devuelve null si la API no puede cotizar', async () => {
      api.quoteSale.mockReturnValue(throwError(() => ({ status: 404 })));

      await expect(firstValueFrom(facade.quoteSale('p-1', 'bag', 10))).resolves.toBeNull();
    });

    it('por pesos, convierte el importe a kilos con el precio por kilo y cobra exactamente el importe', async () => {
      api.quoteSale.mockImplementation((_productId: string, _unit: string, quantity: number) => of(
        quantity === 1
          ? aSaleLine({ unit: 'kg', quantity: 1, unitPrice: 20, cost: 15, total: 20 })
          : aSaleLine({ unit: 'kg', quantity, unitPrice: 20, cost: 15 * quantity, total: 20 * quantity })
      ));

      const quote = await firstValueFrom(facade.quoteSale('p-1', 'money', 50));

      expect(api.quoteSale).toHaveBeenLastCalledWith('p-1', 'kg', 2.5);
      expect(quote).toMatchObject({ quantity: 2.5, total: 50, cost: 37.5, profit: 12.5 });
    });
  });

  describe('registerSaleBatch', () => {
    it('manda las líneas al backend y resuelve con la venta de su solicitud', async () => {
      const result = firstValueFrom(facade.registerSaleBatch('', [
        { productId: 'p-1', mode: 'bag', amount: 1 },
        { productId: 'p-2', mode: 'piece', amount: 3 }
      ]));
      const action = lastDispatched<ReturnType<typeof SalesActions.registerSaleBatch>>();

      expect(action.input).toEqual({
        customer: 'Publico general',
        sellerId: '0409',
        lines: [
          { productId: 'p-1', unit: 'bag', quantity: 1 },
          { productId: 'p-2', unit: 'piece', quantity: 3 }
        ]
      });
      actions$.next(SalesActions.registerSaleBatchSuccess({ requestId: action.requestId, sale: aSale() }));

      await expect(result).resolves.toEqual(aSale());
    });

    it('convierte una línea por pesos en kilos antes de mandarla', async () => {
      api.quoteSale.mockReturnValue(of(aSaleLine({ unit: 'kg', unitPrice: 25 })));

      const result = firstValueFrom(facade.registerSaleBatch('Juan', [{ productId: 'p-1', mode: 'money', amount: 100 }]));
      const action = lastDispatched<ReturnType<typeof SalesActions.registerSaleBatch>>();

      expect(action.input.lines).toEqual([{ productId: 'p-1', unit: 'kg', quantity: 4 }]);
      expect(action.input.customer).toBe('Juan');
      actions$.next(SalesActions.registerSaleBatchSuccess({ requestId: action.requestId, sale: aSale() }));
      await expect(result).resolves.toEqual(aSale());
    });

    it('falla con el error de su solicitud', async () => {
      const result = firstValueFrom(facade.registerSaleBatch('Juan', [{ productId: 'p-1', mode: 'bag', amount: 1 }]));
      const action = lastDispatched<ReturnType<typeof SalesActions.registerSaleBatch>>();
      actions$.next(SalesActions.registerSaleBatchFailure({ requestId: action.requestId, error: 'Sin inventario' }));

      await expect(result).rejects.toThrow('Sin inventario');
    });

    it('falla sin despachar si no hay vendedor activo', async () => {
      store.overrideSelector(selectActiveSeller, null);
      store.refreshState();

      await expect(firstValueFrom(facade.registerSaleBatch('', [{ productId: 'p-1', mode: 'bag', amount: 1 }])))
        .rejects.toThrow('sales.errors.sellerNotAuthorized');
      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });

  it('guarda y borra tickets', () => {
    const ticket: SavedTicket = { sale: aSale(), received: 500, change: 100, savedAt: '2026-11-10T15:00:00Z' };

    facade.saveTicket(ticket);
    facade.deleteSavedTicket('sale-1');

    expect(store.dispatch).toHaveBeenCalledWith(SalesActions.saveTicket({ ticket }));
    expect(store.dispatch).toHaveBeenCalledWith(SalesActions.deleteSavedTicket({ saleId: 'sale-1' }));
  });
});
