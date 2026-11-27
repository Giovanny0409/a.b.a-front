import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { anInventoryItem } from '@testing/fixtures';
import { DashboardStore } from './dashboard.store';
import { DashboardActions } from './store/dashboard.actions';
import { dashboardFeatureKey, initialDashboardState } from './store/dashboard.reducer';

describe('DashboardStore', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        provideMockStore({
          initialState: { [dashboardFeatureKey]: { ...initialDashboardState, inventory: [anInventoryItem({ sealedBags: 2 })] } }
        })
      ]
    });
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  it('carga el tablero al crearse y expone el resumen', () => {
    const facade = TestBed.inject(DashboardStore);

    expect(store.dispatch).toHaveBeenCalledWith(DashboardActions.load());
    expect(facade.summary().sealedBags).toBe(2);
    expect(facade.inventory()).toHaveLength(1);
  });

  it('despacha la importancia de un producto', () => {
    const facade = TestBed.inject(DashboardStore);
    const importance = { productId: 'p-1', minBags: 3, minOpenKg: 10, minPieces: 0 };

    facade.setImportance(importance);

    expect(store.dispatch).toHaveBeenCalledWith(DashboardActions.setImportance({ importance }));
  });
});
