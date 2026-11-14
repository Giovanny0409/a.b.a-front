import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { PosApiService } from '../../../core/pos-api.service';
import { FakePosApi, fakePosApi } from '../../../testing/fake-pos-api';
import { aProduct, aPurchase, aPurchaseDefaults, anExpense } from '../../../testing/fixtures';
import { PurchasesActions } from './purchases.actions';
import { PurchasesEffects } from './purchases.effects';

describe('PurchasesEffects', () => {
  let api: FakePosApi;
  let actions$: Observable<Action>;
  let effects: PurchasesEffects;

  beforeEach(() => {
    api = fakePosApi();
    TestBed.configureTestingModule({
      providers: [
        PurchasesEffects,
        provideMockActions(() => actions$),
        { provide: PosApiService, useValue: api }
      ]
    });
    effects = TestBed.inject(PurchasesEffects);
  });

  describe('loadProducts$', () => {
    beforeEach(() => {
      actions$ = of(PurchasesActions.loadProducts());
      api.getProducts.mockReturnValue(of([aProduct()]));
      api.getPurchaseDefaults.mockReturnValue(of([aPurchaseDefaults()]));
      api.getPurchases.mockReturnValue(of([aPurchase()]));
      api.getExpenses.mockReturnValue(of([anExpense()]));
    });

    it('carga productos, datos de la última compra, compras y gastos', async () => {
      await expect(firstValueFrom(effects.loadProducts$)).resolves.toEqual(PurchasesActions.loadProductsSuccess({
        products: [aProduct()],
        purchaseDefaults: [aPurchaseDefaults()],
        purchases: [aPurchase()],
        expenses: [anExpense()]
      }));
    });

    it('sigue cargando sin gastos si falla esa llamada', async () => {
      api.getExpenses.mockReturnValue(throwError(() => new Error('404')));

      await expect(firstValueFrom(effects.loadProducts$)).resolves.toMatchObject({ expenses: [] });
    });

    it('falla la carga si no llegan los datos de la última compra', async () => {
      api.getPurchaseDefaults.mockReturnValue(throwError(() => new Error('red')));

      await expect(firstValueFrom(effects.loadProducts$)).resolves.toEqual(
        PurchasesActions.loadProductsFailure({ error: 'purchases.errors.loadProducts' })
      );
    });

    it('emite la falla con el mensaje del backend o el de omisión', async () => {
      api.getProducts.mockReturnValue(throwError(() => ({ error: { message: 'Backend caído' } })));
      await expect(firstValueFrom(effects.loadProducts$)).resolves.toEqual(
        PurchasesActions.loadProductsFailure({ error: 'Backend caído' })
      );

      api.getProducts.mockReturnValue(throwError(() => new Error('red')));
      await expect(firstValueFrom(effects.loadProducts$)).resolves.toEqual(
        PurchasesActions.loadProductsFailure({ error: 'purchases.errors.loadProducts' })
      );
    });
  });

  describe('registerPurchase$', () => {
    it('normaliza el proveedor y las líneas antes de mandarlas', async () => {
      actions$ = of(PurchasesActions.registerPurchase({
        requestId: 'r-1',
        input: {
          supplierName: '',
          supplierPhone: '555',
          lines: [
            {
              kind: 'bag', productName: '  Maiz  ', category: '', quantity: 0, markedKg: 40,
              purchaseCost: 600, salePriceBag: 400, salePriceKg: 11
            },
            {
              kind: 'unit', productName: 'Correa', category: 'Accesorio', quantity: 5, markedKg: 40,
              purchaseCost: 250, salePriceBag: 80, salePriceKg: 0
            }
          ]
        }
      }));
      api.registerPurchase.mockReturnValue(of([aPurchase()]));

      await expect(firstValueFrom(effects.registerPurchase$)).resolves.toEqual(
        PurchasesActions.registerPurchaseSuccess({ requestId: 'r-1', purchases: [aPurchase()] })
      );
      expect(api.registerPurchase).toHaveBeenCalledWith({
        supplier: { name: 'Sin proveedor', phone: '555' },
        lines: [
          {
            kind: 'bag', productName: 'Maiz', category: 'General', quantity: 1, markedKg: 40,
            purchaseCost: 600, salePriceBag: 400, salePriceKg: 11
          },
          {
            kind: 'unit', productName: 'Correa', category: 'Accesorio', quantity: 5, markedKg: undefined,
            purchaseCost: 250, salePriceBag: 80, salePriceKg: 80
          }
        ]
      });
    });

    it('emite la falla con el requestId y el mensaje', async () => {
      actions$ = of(PurchasesActions.registerPurchase({
        requestId: 'r-2',
        input: { supplierName: 'Alfa', supplierPhone: '', lines: [] }
      }));
      api.registerPurchase.mockReturnValue(throwError(() => new Error('red')));

      await expect(firstValueFrom(effects.registerPurchase$)).resolves.toEqual(
        PurchasesActions.registerPurchaseFailure({ requestId: 'r-2', error: 'purchases.errors.register' })
      );
    });
  });

  describe('registerExpense$', () => {
    it('limpia el concepto y las notas, y usa «General» sin categoría', async () => {
      actions$ = of(PurchasesActions.registerExpense({
        requestId: 'r-1',
        input: { concept: '  Luz  ', category: '', area: 'camioneta', amount: 300, notes: ' bimestre ' }
      }));
      api.registerExpense.mockReturnValue(of(anExpense()));

      await expect(firstValueFrom(effects.registerExpense$)).resolves.toEqual(
        PurchasesActions.registerExpenseSuccess({ requestId: 'r-1', expense: anExpense() })
      );
      expect(api.registerExpense).toHaveBeenCalledWith({
        concept: 'Luz', category: 'General', area: 'camioneta', amount: 300, notes: 'bimestre'
      });
    });

    it('emite la falla con el mensaje del backend', async () => {
      actions$ = of(PurchasesActions.registerExpense({
        requestId: 'r-2',
        input: { concept: 'Luz', category: 'Luz', area: 'general', amount: 1 }
      }));
      api.registerExpense.mockReturnValue(throwError(() => ({ error: { message: 'Monto inválido' } })));

      await expect(firstValueFrom(effects.registerExpense$)).resolves.toEqual(
        PurchasesActions.registerExpenseFailure({ requestId: 'r-2', error: 'Monto inválido' })
      );
    });
  });
});
