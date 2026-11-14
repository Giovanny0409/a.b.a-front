import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Product, SaleRecord, SaleUnit, SellerAuthorization } from '../../../core/pos.models';

export interface RegisterSaleBatchInput {
  customer: string;
  sellerId: string;
  lines: Array<{ productId: string; unit: SaleUnit; quantity: number }>;
}

export interface SavedTicket {
  sale: SaleRecord;
  received: number;
  change: number;
  savedAt: string;
}

export const SalesActions = createActionGroup({
  source: 'Sales',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ products: Product[]; sales: SaleRecord[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Authorize Seller': props<{ requestId: string; sellerId: string }>(),
    'Authorize Seller Success': props<{ requestId: string; authorization: SellerAuthorization }>(),
    'Authorize Seller Failure': props<{ requestId: string; error: string }>(),
    'Clear Seller': emptyProps(),
    'Register Sale Batch': props<{ requestId: string; input: RegisterSaleBatchInput }>(),
    'Register Sale Batch Success': props<{ requestId: string; sale: SaleRecord }>(),
    'Register Sale Batch Failure': props<{ requestId: string; error: string }>(),
    'Save Ticket': props<{ ticket: SavedTicket }>(),
    'Delete Saved Ticket': props<{ saleId: string }>()
  }
});
