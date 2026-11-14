import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { PosApiService } from '../../../core/pos-api.service';
import { FakePosApi, fakePosApi } from '../../../testing/fake-pos-api';
import { aProduct, aSale } from '../../../testing/fixtures';
import { SalesActions } from './sales.actions';
import { SalesEffects } from './sales.effects';

describe('SalesEffects', () => {
  let api: FakePosApi;
  let actions$: Observable<Action>;
  let effects: SalesEffects;

  beforeEach(() => {
    api = fakePosApi();
    TestBed.configureTestingModule({
      providers: [
        SalesEffects,
        provideMockActions(() => actions$),
        { provide: PosApiService, useValue: api }
      ]
    });
    effects = TestBed.inject(SalesEffects);
  });

  it('carga productos y ventas', async () => {
    actions$ = of(SalesActions.load());
    api.getProducts.mockReturnValue(of([aProduct()]));
    api.getSales.mockReturnValue(of([aSale()]));

    await expect(firstValueFrom(effects.load$)).resolves.toEqual(
      SalesActions.loadSuccess({ products: [aProduct()], sales: [aSale()] })
    );
  });

  it('emite la falla de carga con el mensaje por omisión', async () => {
    actions$ = of(SalesActions.load());
    api.getProducts.mockReturnValue(throwError(() => new Error('red')));
    api.getSales.mockReturnValue(of([]));

    await expect(firstValueFrom(effects.load$)).resolves.toEqual(
      SalesActions.loadFailure({ error: 'No fue posible cargar ventas.' })
    );
  });

  it('autoriza al vendedor con su requestId', async () => {
    const authorization = { authorized: true, seller: { id: '0409', name: 'Aurelio' } };
    actions$ = of(SalesActions.authorizeSeller({ requestId: 'r-1', sellerId: '0409' }));
    api.authorizeSeller.mockReturnValue(of(authorization));

    await expect(firstValueFrom(effects.authorizeSeller$)).resolves.toEqual(
      SalesActions.authorizeSellerSuccess({ requestId: 'r-1', authorization })
    );
    expect(api.authorizeSeller).toHaveBeenCalledWith('0409');
  });

  it('emite la falla de autorización (el backend responde 401)', async () => {
    actions$ = of(SalesActions.authorizeSeller({ requestId: 'r-1', sellerId: '9999' }));
    api.authorizeSeller.mockReturnValue(throwError(() => ({ status: 401, error: { authorized: false } })));

    await expect(firstValueFrom(effects.authorizeSeller$)).resolves.toEqual(
      SalesActions.authorizeSellerFailure({ requestId: 'r-1', error: 'ID de vendedor no autorizado.' })
    );
  });

  it('registra la venta en lote', async () => {
    const input = { customer: 'Juan', sellerId: '0409', lines: [{ productId: 'p-1', unit: 'bag' as const, quantity: 1 }] };
    actions$ = of(SalesActions.registerSaleBatch({ requestId: 'r-1', input }));
    api.registerSaleBatch.mockReturnValue(of(aSale()));

    await expect(firstValueFrom(effects.registerSaleBatch$)).resolves.toEqual(
      SalesActions.registerSaleBatchSuccess({ requestId: 'r-1', sale: aSale() })
    );
    expect(api.registerSaleBatch).toHaveBeenCalledWith(input);
  });

  it('emite la falla de la venta con el mensaje del backend', async () => {
    actions$ = of(SalesActions.registerSaleBatch({
      requestId: 'r-1',
      input: { customer: '', sellerId: '0409', lines: [] }
    }));
    api.registerSaleBatch.mockReturnValue(throwError(() => ({ error: { message: 'No hay inventario suficiente para esta venta.' } })));

    await expect(firstValueFrom(effects.registerSaleBatch$)).resolves.toEqual(
      SalesActions.registerSaleBatchFailure({ requestId: 'r-1', error: 'No hay inventario suficiente para esta venta.' })
    );
  });
});
