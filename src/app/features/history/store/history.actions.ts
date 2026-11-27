import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ExpenseRecord, PurchaseRecord, SaleRecord } from '@core/pos.models';

export const HistoryActions = createActionGroup({
  source: 'History',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ sales: SaleRecord[]; purchases: PurchaseRecord[]; expenses: ExpenseRecord[] }>(),
    'Load Failure': props<{ error: string }>()
  }
});
