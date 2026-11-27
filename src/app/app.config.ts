import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RuntimeChecks, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { environment } from '@env/environment';
import { provideI18n } from '@core/i18n/provide-i18n';
import { connectionInterceptor } from '@core/notify/connection.interceptor';
import { Notifier, SwalNotifier } from '@core/notify/notification.service';
import { DashboardEffects } from '@features/dashboard/store/dashboard.effects';
import { dashboardFeatureKey, dashboardReducer } from '@features/dashboard/store/dashboard.reducer';
import { HistoryEffects } from '@features/history/store/history.effects';
import { historyFeatureKey, historyReducer } from '@features/history/store/history.reducer';
import { InventoryEffects } from '@features/inventory/store/inventory.effects';
import { inventoryFeatureKey, inventoryReducer } from '@features/inventory/store/inventory.reducer';
import { PurchasesEffects } from '@features/purchases/store/purchases.effects';
import { purchasesFeatureKey, purchasesReducer } from '@features/purchases/store/purchases.reducer';
import { SalesEffects } from '@features/sales/store/sales.effects';
import { salesFeatureKey, salesReducer } from '@features/sales/store/sales.reducer';
import { AppTopbarEffects } from '@layout/store/app-topbar.effects';
import { appTopbarFeatureKey, appTopbarReducer } from '@layout/store/app-topbar.reducer';
import { routes } from './app.routes';

/** Un reducer por feature, con su clave de estado. */
export const appReducers = {
  [appTopbarFeatureKey]: appTopbarReducer,
  [dashboardFeatureKey]: dashboardReducer,
  [historyFeatureKey]: historyReducer,
  [inventoryFeatureKey]: inventoryReducer,
  [purchasesFeatureKey]: purchasesReducer,
  [salesFeatureKey]: salesReducer
};

/** El estado y las acciones no se mutan y se pueden serializar: NgRx lo revisa en desarrollo y en pruebas. */
export const strictRuntimeChecks: Partial<RuntimeChecks> = {
  strictStateImmutability: true,
  strictActionImmutability: true,
  strictStateSerializability: true,
  strictActionSerializability: true
};

export const appConfig: ApplicationConfig = {
  providers: [
    // ===== HTTP =====
    // Cada petición pasa por el aviso de sin conexión (core/notify/connection.interceptor.ts).
    provideHttpClient(withInterceptors([connectionInterceptor])),

    // ===== I18N =====
    // es.json dentro del bundle y formato es-MX (core/i18n/provide-i18n.ts).
    provideI18n(),

    // ===== AVISOS =====
    { provide: Notifier, useClass: SwalNotifier },

    // ===== NGRX =====
    provideStore(appReducers, { runtimeChecks: strictRuntimeChecks }),
    provideEffects(
      AppTopbarEffects,
      DashboardEffects,
      HistoryEffects,
      InventoryEffects,
      PurchasesEffects,
      SalesEffects
    ),
    // Las Redux DevTools solo en desarrollo: vienen de environment.development.ts.
    ...environment.devProviders,

    // ===== ROUTER =====
    provideRouter(routes, withComponentInputBinding())
  ]
};
