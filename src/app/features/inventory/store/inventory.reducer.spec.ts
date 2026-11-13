import { aLot, aProduct, anInventoryItem } from '../../../testing/fixtures';
import { InventoryActions } from './inventory.actions';
import { initialInventoryState, inventoryFeatureKey, inventoryReducer } from './inventory.reducer';
import { selectInventoryItems, selectInventoryLots, selectInventoryProducts } from './inventory.selectors';

describe('inventoryReducer', () => {
  const loaded = { inventory: [anInventoryItem()], lots: [aLot()], products: [aProduct()] };

  it('guarda inventario, lotes y productos al cargar con éxito', () => {
    const state = inventoryReducer({ ...initialInventoryState, error: 'antes' }, InventoryActions.loadSuccess(loaded));

    expect(state).toEqual({ ...loaded, error: null });
  });

  it('vacía los datos y guarda el error al fallar', () => {
    const state = inventoryReducer({ ...initialInventoryState, ...loaded }, InventoryActions.loadFailure({ error: 'Sin red' }));

    expect(state).toEqual({ inventory: [], lots: [], products: [], error: 'Sin red' });
  });

  it('los selectors exponen cada parte del estado', () => {
    const state = inventoryReducer(initialInventoryState, InventoryActions.loadSuccess(loaded));
    const root = { [inventoryFeatureKey]: state };

    expect(selectInventoryItems(root)).toBe(state.inventory);
    expect(selectInventoryLots(root)).toBe(state.lots);
    expect(selectInventoryProducts(root)).toBe(state.products);
  });
});
