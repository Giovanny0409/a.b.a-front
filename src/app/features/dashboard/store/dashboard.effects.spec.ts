import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PosApiService } from '../../../core/pos-api.service';
import { FakePosApi, fakePosApi } from '../../../testing/fake-pos-api';
import { aLot, aPurchase, aSale, anExpense, anInventoryItem } from '../../../testing/fixtures';
import { DashboardActions } from './dashboard.actions';
import { DashboardEffects } from './dashboard.effects';

describe('DashboardEffects', () => {
  let api: FakePosApi;
  let effects: DashboardEffects;

  beforeEach(() => {
    api = fakePosApi();
    TestBed.configureTestingModule({
      providers: [
        DashboardEffects,
        provideMockActions(() => of(DashboardActions.load())),
        { provide: PosApiService, useValue: api }
      ]
    });
    effects = TestBed.inject(DashboardEffects);
    api.getInventory.mockReturnValue(of([anInventoryItem()]));
    api.getLots.mockReturnValue(of([aLot()]));
    api.getPurchases.mockReturnValue(of([aPurchase()]));
    api.getSales.mockReturnValue(of([aSale()]));
    api.getExpenses.mockReturnValue(of([anExpense()]));
  });

  it('carga inventario, lotes, compras, ventas y gastos', async () => {
    await expect(firstValueFrom(effects.load$)).resolves.toEqual(DashboardActions.loadSuccess({
      inventory: [anInventoryItem()],
      lots: [aLot()],
      purchases: [aPurchase()],
      sales: [aSale()],
      expenses: [anExpense()]
    }));
  });

  it('sigue cargando sin gastos si falla esa llamada', async () => {
    api.getExpenses.mockReturnValue(throwError(() => new Error('404')));

    const action = await firstValueFrom(effects.load$);

    expect(action).toMatchObject({ type: DashboardActions.loadSuccess.type, expenses: [] });
  });

  it('emite la falla con el mensaje del backend', async () => {
    api.getSales.mockReturnValue(throwError(() => ({ error: { message: 'Backend caído' } })));

    await expect(firstValueFrom(effects.load$)).resolves.toEqual(DashboardActions.loadFailure({ error: 'Backend caído' }));
  });

  it('emite la falla con el mensaje por omisión', async () => {
    api.getInventory.mockReturnValue(throwError(() => new Error('red')));

    await expect(firstValueFrom(effects.load$)).resolves.toEqual(
      DashboardActions.loadFailure({ error: 'dashboard.errors.load' })
    );
  });
});
