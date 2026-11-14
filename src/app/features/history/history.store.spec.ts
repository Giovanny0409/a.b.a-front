import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { aSale } from '../../testing/fixtures';
import { HistoryStore } from './history.store';
import { HistoryActions } from './store/history.actions';
import { historyFeatureKey, initialHistoryState } from './store/history.reducer';

describe('HistoryStore', () => {
  it('expone el historial y despacha su carga', () => {
    TestBed.configureTestingModule({
      providers: [
        HistoryStore,
        provideMockStore({
          initialState: { [historyFeatureKey]: { ...initialHistoryState, sales: [aSale({ total: 400, profit: 80 })] } }
        })
      ]
    });
    const store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
    const facade = TestBed.inject(HistoryStore);

    facade.load();

    expect(store.dispatch).toHaveBeenCalledWith(HistoryActions.load());
    expect(facade.sales()).toHaveLength(1);
    expect(facade.purchases()).toEqual([]);
    expect(facade.expenses()).toEqual([]);
    expect(facade.summary()).toEqual({ investment: 0, income: 400, expenses: 0, profit: 80 });
  });
});
