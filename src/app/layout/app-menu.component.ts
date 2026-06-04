import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'aba-app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">ABA</div>
        <div>
          <strong>Alimentos Balanceados Alonso</strong>
          <span>Punto de venta</span>
        </div>
      </div>

      <nav class="nav">
        <a routerLink="/tablero" routerLinkActive="active">
          <i class="pi pi-chart-line"></i>
          <span>Tablero</span>
        </a>
        <a routerLink="/ventas" routerLinkActive="active">
          <i class="pi pi-shopping-cart"></i>
          <span>Ventas</span>
        </a>
        <a routerLink="/compras" routerLinkActive="active">
          <i class="pi pi-plus-circle"></i>
          <span>Compras</span>
        </a>
        <a routerLink="/inventario" routerLinkActive="active">
          <i class="pi pi-warehouse"></i>
          <span>Inventario</span>
        </a>
        <a routerLink="/historial" routerLinkActive="active">
          <i class="pi pi-history"></i>
          <span>Historial</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      background: #113c36;
      color: #f8fbf9;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding: 1rem;
    }

    .brand {
      align-items: center;
      display: flex;
      gap: 0.75rem;
      min-width: 0;
    }

    .brand-mark {
      align-items: center;
      background: #f0bd58;
      border-radius: 8px;
      color: #17342f;
      display: flex;
      font-weight: 900;
      height: 3rem;
      justify-content: center;
      width: 3rem;
    }

    .brand strong,
    .brand span {
      display: block;
    }

    .brand strong {
      font-size: 0.95rem;
      line-height: 1.15;
    }

    .brand span {
      color: #b9d0ca;
      font-size: 0.78rem;
      margin-top: 0.2rem;
    }

    .nav {
      display: grid;
      gap: 0.35rem;
    }

    .nav a {
      align-items: center;
      border-radius: 8px;
      color: #dceae6;
      display: flex;
      gap: 0.65rem;
      min-height: 2.75rem;
      padding: 0.65rem 0.75rem;
    }

    .nav a.active,
    .nav a:hover {
      background: #f8fbf9;
      color: #113c36;
    }

    @media (max-width: 880px) {
      .sidebar {
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .nav {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }

      .nav a {
        justify-content: center;
      }

      .nav span {
        display: none;
      }
    }

    @media (max-width: 520px) {
      .sidebar {
        padding: 0.75rem;
      }
    }
  `]
})
export class AppMenuComponent {}
