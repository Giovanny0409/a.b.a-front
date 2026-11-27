import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { aProduct, aPurchase, aPurchaseDefaults, anExpense } from '@testing/fixtures';
import { PurchasesStore } from './purchases.store';
import { PurchasesActions } from './store/purchases.actions';
import { selectPurchaseDefaults, selectPurchaseProducts, selectPurchaseSuppliers } from './store/purchases.selectors';

describe('PurchasesStore', () => {
  let facade: PurchasesStore;
  let store: MockStore;
  let actions$: Subject<Action>;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        PurchasesStore,
        provideMockStore({
          selectors: [
            { selector: selectPurchaseProducts, value: [aProduct()] },
            { selector: selectPurchaseSuppliers, value: [{ name: 'Alfa', phone: '1' }] },
            { selector: selectPurchaseDefaults, value: [aPurchaseDefaults()] }
          ]
        }),
        provideMockActions(() => actions$)
      ]
    });
    facade = TestBed.inject(PurchasesStore);
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  afterEach(() => store.resetSelectors());

  function lastRequestId(): string {
    const calls = (store.dispatch as unknown as { mock: { calls: Array<[{ requestId: string }]> } }).mock.calls;
    return calls[calls.length - 1][0].requestId;
  }

  it('expone productos, proveedores y datos de la última compra del store', () => {
    expect(facade.products()).toEqual([aProduct()]);
    expect(facade.suppliers()).toEqual([{ name: 'Alfa', phone: '1' }]);
    expect(facade.purchaseDefaults()).toEqual([aPurchaseDefaults()]);
  });

  it('despacha la carga y el alta de proveedor', () => {
    facade.loadProducts();
    facade.addSupplier({ name: 'Beta', phone: '2' });

    expect(store.dispatch).toHaveBeenCalledWith(PurchasesActions.loadProducts());
    expect(store.dispatch).toHaveBeenCalledWith(PurchasesActions.addSupplier({ supplier: { name: 'Beta', phone: '2' } }));
  });

  it('resuelve la compra con la respuesta de su propia solicitud', async () => {
    const input = { supplierName: 'Alfa', supplierPhone: '1', lines: [] };
    const result = firstValueFrom(facade.registerPurchase(input));
    const requestId = lastRequestId();

    expect(store.dispatch).toHaveBeenCalledWith(PurchasesActions.registerPurchase({ requestId, input }));
    actions$.next(PurchasesActions.registerPurchaseSuccess({ requestId: 'otra', purchases: [] }));
    actions$.next(PurchasesActions.registerPurchaseSuccess({ requestId, purchases: [aPurchase()] }));

    await expect(result).resolves.toEqual([aPurchase()]);
  });

  it('falla la compra con el error de su solicitud', async () => {
    const result = firstValueFrom(facade.registerPurchase({ supplierName: 'Alfa', supplierPhone: '', lines: [] }));
    actions$.next(PurchasesActions.registerPurchaseFailure({ requestId: lastRequestId(), error: 'Sin red' }));

    await expect(result).rejects.toThrow('Sin red');
  });

  it('resuelve o falla el gasto según su solicitud', async () => {
    const input = { concept: 'Luz', category: 'Luz', area: 'general' as const, amount: 100 };

    const ok = firstValueFrom(facade.registerExpense(input));
    actions$.next(PurchasesActions.registerExpenseSuccess({ requestId: lastRequestId(), expense: anExpense() }));
    await expect(ok).resolves.toEqual(anExpense());

    const fail = firstValueFrom(facade.registerExpense(input));
    actions$.next(PurchasesActions.registerExpenseFailure({ requestId: lastRequestId(), error: 'Monto inválido' }));
    await expect(fail).rejects.toThrow('Monto inválido');
  });
});
