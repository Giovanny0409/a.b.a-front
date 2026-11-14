import { aLot, aPurchase, aSale, anExpense, anInventoryItem } from '@testing/fixtures';
import { DashboardActions } from './dashboard.actions';
import { dashboardReducer, initialDashboardState } from './dashboard.reducer';

describe('dashboardReducer', () => {
  const loaded = {
    inventory: [anInventoryItem()],
    lots: [aLot()],
    purchases: [aPurchase()],
    sales: [aSale()],
    expenses: [anExpense()]
  };

  it('marca la carga y limpia el error al cargar', () => {
    const state = dashboardReducer({ ...initialDashboardState, error: 'antes' }, DashboardActions.load());

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('guarda los datos y termina la carga al cargar con éxito', () => {
    const state = dashboardReducer(
      { ...initialDashboardState, loading: true },
      DashboardActions.loadSuccess(loaded)
    );

    expect(state).toMatchObject({ ...loaded, loading: false });
  });

  it('vacía los datos y guarda el error al fallar', () => {
    const withData = { ...initialDashboardState, ...loaded, loading: true };

    const state = dashboardReducer(withData, DashboardActions.loadFailure({ error: 'Sin red' }));

    expect(state).toMatchObject({
      inventory: [], lots: [], purchases: [], sales: [], expenses: [], loading: false, error: 'Sin red'
    });
  });

  it('agrega o reemplaza la importancia de un producto', () => {
    const first = dashboardReducer(initialDashboardState, DashboardActions.setImportance({
      importance: { productId: 'p-1', minBags: 3, minOpenKg: 5, minPieces: 0 }
    }));
    const other = dashboardReducer(first, DashboardActions.setImportance({
      importance: { productId: 'p-2', minBags: 0, minOpenKg: 0, minPieces: 4 }
    }));
    const replaced = dashboardReducer(other, DashboardActions.setImportance({
      importance: { productId: 'p-1', minBags: 6, minOpenKg: 0, minPieces: 0 }
    }));

    expect(replaced.importance).toEqual([
      { productId: 'p-2', minBags: 0, minOpenKg: 0, minPieces: 4 },
      { productId: 'p-1', minBags: 6, minOpenKg: 0, minPieces: 0 }
    ]);
  });
});
