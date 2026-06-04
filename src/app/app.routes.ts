import { Routes } from '@angular/router';
import { salesAuthorizationGuard } from './core/sales-auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tablero' },
  {
    path: 'tablero',
    loadComponent: () => import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent)
  },
  {
    path: 'compras',
    loadComponent: () => import('./features/purchases/purchases-page.component').then((m) => m.PurchasesPageComponent)
  },
  {
    path: 'ventas',
    canMatch: [salesAuthorizationGuard],
    loadComponent: () => import('./features/sales/sales-page.component').then((m) => m.SalesPageComponent)
  },
  {
    path: 'inventario',
    loadComponent: () => import('./features/inventory/inventory-page.component').then((m) => m.InventoryPageComponent)
  },
  {
    path: 'historial',
    loadComponent: () => import('./features/history/history-page.component').then((m) => m.HistoryPageComponent)
  },
  { path: '**', redirectTo: 'tablero' }
];
