import { aProduct, aSale, anInventoryItem } from '@testing/fixtures';
import { SalesActions, SavedTicket } from './sales.actions';
import { initialSalesState, salesFeatureKey, salesReducer } from './sales.reducer';
import {
  selectActiveSeller,
  selectSalesInventory,
  selectSalesProducts,
  selectSalesRecords,
  selectSavedTickets
} from './sales.selectors';

describe('salesReducer', () => {
  const seller = { id: '0409', name: 'Aurelio' };
  const ticket = (saleId: string, received = 500): SavedTicket => ({
    sale: aSale({ id: saleId }),
    received,
    change: received - 400,
    seller: 'Aurelio',
    savedAt: '2026-11-10T15:00:00Z'
  });

  it('guarda productos, ventas y existencia al cargar con éxito', () => {
    const state = salesReducer({ ...initialSalesState, error: 'antes' }, SalesActions.loadSuccess({
      products: [aProduct()],
      sales: [aSale()],
      inventory: [anInventoryItem()]
    }));

    expect(state).toMatchObject({ products: [aProduct()], sales: [aSale()], inventory: [anInventoryItem()], error: null });
  });

  it('vacía productos, ventas y existencia al fallar la carga', () => {
    const state = salesReducer(
      { ...initialSalesState, products: [aProduct()], sales: [aSale()], inventory: [anInventoryItem()] },
      SalesActions.loadFailure({ error: 'Sin red' })
    );

    expect(state).toMatchObject({ products: [], sales: [], inventory: [], error: 'Sin red' });
  });

  it('activa al vendedor autorizado', () => {
    const state = salesReducer(initialSalesState, SalesActions.authorizeSellerSuccess({
      requestId: 'r',
      authorization: { authorized: true, seller }
    }));

    expect(state.activeSeller).toEqual(seller);
  });

  it('no activa a nadie si la respuesta dice que no está autorizado', () => {
    const state = salesReducer({ ...initialSalesState, activeSeller: seller }, SalesActions.authorizeSellerSuccess({
      requestId: 'r',
      authorization: { authorized: false, seller }
    }));

    expect(state.activeSeller).toBeNull();
  });

  it('quita al vendedor activo y guarda el error si falla la autorización', () => {
    const state = salesReducer({ ...initialSalesState, activeSeller: seller }, SalesActions.authorizeSellerFailure({
      requestId: 'r',
      error: 'No autorizado'
    }));

    expect(state).toMatchObject({ activeSeller: null, error: 'No autorizado' });
  });

  it('quita al vendedor activo y conserva los tickets guardados', () => {
    const state = salesReducer(
      { ...initialSalesState, activeSeller: seller, savedTickets: [ticket('a')] },
      SalesActions.clearSeller()
    );

    expect(state.activeSeller).toBeNull();
    expect(state.savedTickets.map((saved) => saved.sale.id)).toEqual(['a']);
  });

  it('pone primero la venta registrada', () => {
    const state = salesReducer({ ...initialSalesState, sales: [aSale({ id: 'vieja' })] }, SalesActions.registerSaleBatchSuccess({
      requestId: 'r',
      sale: aSale({ id: 'nueva' })
    }));

    expect(state.sales.map((sale) => sale.id)).toEqual(['nueva', 'vieja']);
  });

  it('guarda el error si falla la venta', () => {
    const state = salesReducer(initialSalesState, SalesActions.registerSaleBatchFailure({ requestId: 'r', error: 'Sin inventario' }));

    expect(state.error).toBe('Sin inventario');
  });

  it('guarda un ticket primero y reemplaza el de la misma venta', () => {
    const first = salesReducer(initialSalesState, SalesActions.saveTicket({ ticket: ticket('a') }));
    const second = salesReducer(first, SalesActions.saveTicket({ ticket: ticket('b') }));
    const replaced = salesReducer(second, SalesActions.saveTicket({ ticket: ticket('a', 1000) }));

    expect(replaced.savedTickets.map((saved) => [saved.sale.id, saved.received])).toEqual([['a', 1000], ['b', 500]]);
  });

  it('borra un ticket guardado', () => {
    const state = salesReducer(
      { ...initialSalesState, savedTickets: [ticket('a'), ticket('b')] },
      SalesActions.deleteSavedTicket({ saleId: 'a' })
    );

    expect(state.savedTickets.map((saved) => saved.sale.id)).toEqual(['b']);
  });

  it('los selectors exponen productos, ventas, existencia, vendedor y tickets', () => {
    const state = {
      ...initialSalesState,
      products: [aProduct()],
      sales: [aSale()],
      inventory: [anInventoryItem()],
      activeSeller: seller,
      savedTickets: [ticket('a')]
    };
    const root = { [salesFeatureKey]: state };

    expect(selectSalesProducts(root)).toBe(state.products);
    expect(selectSalesRecords(root)).toBe(state.sales);
    expect(selectSalesInventory(root)).toBe(state.inventory);
    expect(selectActiveSeller(root)).toBe(seller);
    expect(selectSavedTickets(root)).toBe(state.savedTickets);
  });
});
