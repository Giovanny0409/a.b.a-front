import { createReducer, on } from '@ngrx/store';
import { InventoryItem, Product, SaleRecord, Seller } from '@core/pos.models';
import { SalesActions, SavedTicket } from './sales.actions';

export const salesFeatureKey = 'sales';

export interface SalesState {
  products: Product[];
  sales: SaleRecord[];
  /** Existencia de cada producto, para mostrarla antes de cotizar. */
  inventory: InventoryItem[];
  activeSeller: Seller | null;
  savedTickets: SavedTicket[];
  error: string | null;
}

export const initialSalesState: SalesState = {
  products: [],
  sales: [],
  inventory: [],
  activeSeller: null,
  savedTickets: [],
  error: null
};

export const salesReducer = createReducer(
  initialSalesState,
  on(SalesActions.loadSuccess, (state, { products, sales, inventory }) => ({ ...state, products, sales, inventory, error: null })),
  on(SalesActions.loadFailure, (state, { error }) => ({ ...state, products: [], sales: [], inventory: [], error })),
  on(SalesActions.authorizeSellerSuccess, (state, { authorization }) => ({
    ...state,
    activeSeller: authorization.authorized ? authorization.seller : null,
    error: null
  })),
  on(SalesActions.clearSeller, (state) => ({ ...state, activeSeller: null })),
  on(SalesActions.authorizeSellerFailure, (state, { error }) => ({ ...state, activeSeller: null, error })),
  on(SalesActions.registerSaleBatchSuccess, (state, { sale }) => ({
    ...state,
    sales: [sale, ...state.sales],
    error: null
  })),
  on(SalesActions.registerSaleBatchFailure, (state, { error }) => ({ ...state, error })),
  on(SalesActions.saveTicket, (state, { ticket }) => ({
    ...state,
    savedTickets: [
      ticket,
      ...state.savedTickets.filter((currentTicket) => currentTicket.sale.id !== ticket.sale.id)
    ]
  })),
  on(SalesActions.deleteSavedTicket, (state, { saleId }) => ({
    ...state,
    savedTickets: state.savedTickets.filter((ticket) => ticket.sale.id !== saleId)
  }))
);
