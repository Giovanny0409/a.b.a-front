import { aPurchase, aSale, anExpense } from '../../../testing/fixtures';
import { HistoryActions } from './history.actions';
import { historyReducer, initialHistoryState } from './history.reducer';

describe('historyReducer', () => {
  const loaded = { sales: [aSale()], purchases: [aPurchase()], expenses: [anExpense()] };

  it('guarda ventas, compras y gastos y limpia el error al cargar con éxito', () => {
    const state = historyReducer({ ...initialHistoryState, error: 'antes' }, HistoryActions.loadSuccess(loaded));

    expect(state).toEqual({ ...loaded, error: null });
  });

  it('vacía los datos y guarda el error al fallar', () => {
    const state = historyReducer({ ...initialHistoryState, ...loaded }, HistoryActions.loadFailure({ error: 'Sin red' }));

    expect(state).toEqual({ sales: [], purchases: [], expenses: [], error: 'Sin red' });
  });

  it('no cambia el estado al empezar a cargar', () => {
    expect(historyReducer(initialHistoryState, HistoryActions.load())).toBe(initialHistoryState);
  });
});
