import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PosApiService } from '@core/pos-api.service';
import { FakePosApi, fakePosApi } from '@testing/fake-pos-api';
import { aLot, aProduct, anInventoryItem } from '@testing/fixtures';
import { InventoryActions } from './inventory.actions';
import { InventoryEffects } from './inventory.effects';

describe('InventoryEffects', () => {
  let api: FakePosApi;
  let effects: InventoryEffects;

  beforeEach(() => {
    api = fakePosApi();
    TestBed.configureTestingModule({
      providers: [
        InventoryEffects,
        provideMockActions(() => of(InventoryActions.load())),
        { provide: PosApiService, useValue: api }
      ]
    });
    effects = TestBed.inject(InventoryEffects);
    api.getInventory.mockReturnValue(of([anInventoryItem()]));
    api.getLots.mockReturnValue(of([aLot()]));
    api.getProducts.mockReturnValue(of([aProduct()]));
  });

  it('carga inventario, lotes y productos', async () => {
    await expect(firstValueFrom(effects.load$)).resolves.toEqual(InventoryActions.loadSuccess({
      inventory: [anInventoryItem()],
      lots: [aLot()],
      products: [aProduct()]
    }));
  });

  it('emite la falla con el mensaje del backend o el de omisión', async () => {
    api.getLots.mockReturnValue(throwError(() => ({ error: { message: 'Backend caído' } })));
    await expect(firstValueFrom(effects.load$)).resolves.toEqual(InventoryActions.loadFailure({ error: 'Backend caído' }));

    api.getLots.mockReturnValue(throwError(() => new Error('red')));
    await expect(firstValueFrom(effects.load$)).resolves.toEqual(
      InventoryActions.loadFailure({ error: 'inventory.errors.load' })
    );
  });
});
