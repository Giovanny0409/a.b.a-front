import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { InventoryItem } from '../../core/pos.models';

export const AppTopbarActions = createActionGroup({
  source: 'App Topbar',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ inventory: InventoryItem[] }>(),
    'Load Failure': props<{ error: string }>()
  }
});
