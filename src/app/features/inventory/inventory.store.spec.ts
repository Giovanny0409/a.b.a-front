import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { anInventoryItem } from '@testing/fixtures';
import { InventoryStore } from './inventory.store';
import { InventoryActions } from './store/inventory.actions';
import { initialInventoryState, inventoryFeatureKey } from './store/inventory.reducer';

describe('InventoryStore', () => {
  it('expone el inventario y despacha su carga', () => {
    TestBed.configureTestingModule({
      providers: [
        InventoryStore,
        provideMockStore({
          initialState: { [inventoryFeatureKey]: { ...initialInventoryState, inventory: [anInventoryItem()] } }
        })
      ]
    });
    const store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
    const facade = TestBed.inject(InventoryStore);

    facade.load();

    expect(store.dispatch).toHaveBeenCalledWith(InventoryActions.load());
    expect(facade.inventory()).toEqual([anInventoryItem()]);
  });
});
