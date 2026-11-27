import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PosApiService } from '@core/pos-api.service';
import { FakePosApi, fakePosApi } from '@testing/fake-pos-api';
import { aPurchase, aSale, anExpense } from '@testing/fixtures';
import { HistoryActions } from './history.actions';
import { HistoryEffects } from './history.effects';

describe('HistoryEffects', () => {
  let api: FakePosApi;
  let effects: HistoryEffects;

  beforeEach(() => {
    api = fakePosApi();
    TestBed.configureTestingModule({
      providers: [
        HistoryEffects,
        provideMockActions(() => of(HistoryActions.load())),
        { provide: PosApiService, useValue: api }
      ]
    });
    effects = TestBed.inject(HistoryEffects);
    api.getSales.mockReturnValue(of([aSale()]));
    api.getPurchases.mockReturnValue(of([aPurchase()]));
    api.getExpenses.mockReturnValue(of([anExpense()]));
  });

  it('carga ventas, compras y gastos', async () => {
    await expect(firstValueFrom(effects.load$)).resolves.toEqual(HistoryActions.loadSuccess({
      sales: [aSale()],
      purchases: [aPurchase()],
      expenses: [anExpense()]
    }));
  });

  it('sigue cargando sin gastos si falla esa llamada', async () => {
    api.getExpenses.mockReturnValue(throwError(() => new Error('404')));

    await expect(firstValueFrom(effects.load$)).resolves.toMatchObject({ expenses: [] });
  });

  it('emite la falla con el mensaje del backend o el de omisión', async () => {
    api.getSales.mockReturnValue(throwError(() => ({ error: { message: 'Backend caído' } })));
    await expect(firstValueFrom(effects.load$)).resolves.toEqual(HistoryActions.loadFailure({ error: 'Backend caído' }));

    api.getSales.mockReturnValue(throwError(() => new Error('red')));
    await expect(firstValueFrom(effects.load$)).resolves.toEqual(
      HistoryActions.loadFailure({ error: 'history.errors.load' })
    );
  });
});
