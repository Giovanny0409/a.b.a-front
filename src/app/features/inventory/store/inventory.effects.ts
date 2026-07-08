import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { PosApiService } from '../../../core/pos-api.service';
import { InventoryActions } from './inventory.actions';

@Injectable()
export class InventoryEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(PosApiService);

  readonly load$ = createEffect(() => this.actions$.pipe(
    ofType(InventoryActions.load),
    switchMap(() => forkJoin({
      inventory: this.api.getInventory(),
      lots: this.api.getLots(),
      products: this.api.getProducts()
    }).pipe(
      map(({ inventory, lots, products }) => InventoryActions.loadSuccess({ inventory, lots, products })),
      catchError((error) => of(InventoryActions.loadFailure({
        error: error?.error?.message ?? 'No fue posible cargar inventario.'
      })))
    ))
  ));
}
