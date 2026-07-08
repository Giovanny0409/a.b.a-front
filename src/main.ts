import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { dashboardFeatureKey, dashboardReducer } from './app/features/dashboard/store/dashboard.reducer';
import { DashboardEffects } from './app/features/dashboard/store/dashboard.effects';
import { historyFeatureKey, historyReducer } from './app/features/history/store/history.reducer';
import { HistoryEffects } from './app/features/history/store/history.effects';
import { inventoryFeatureKey, inventoryReducer } from './app/features/inventory/store/inventory.reducer';
import { InventoryEffects } from './app/features/inventory/store/inventory.effects';
import { purchasesFeatureKey, purchasesReducer } from './app/features/purchases/store/purchases.reducer';
import { PurchasesEffects } from './app/features/purchases/store/purchases.effects';
import { salesFeatureKey, salesReducer } from './app/features/sales/store/sales.reducer';
import { SalesEffects } from './app/features/sales/store/sales.effects';
import { appTopbarFeatureKey, appTopbarReducer } from './app/layout/store/app-topbar.reducer';
import { AppTopbarEffects } from './app/layout/store/app-topbar.effects';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideStore({
      [appTopbarFeatureKey]: appTopbarReducer,
      [dashboardFeatureKey]: dashboardReducer,
      [historyFeatureKey]: historyReducer,
      [inventoryFeatureKey]: inventoryReducer,
      [purchasesFeatureKey]: purchasesReducer,
      [salesFeatureKey]: salesReducer
    }),
    provideEffects(
      AppTopbarEffects,
      DashboardEffects,
      HistoryEffects,
      InventoryEffects,
      PurchasesEffects,
      SalesEffects
    ),
    provideRouter(routes, withComponentInputBinding())
  ]
}).catch((err) => console.error(err));
