import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AppTopbarStore } from './app-topbar.store';

@Component({
  selector: 'aba-app-topbar',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <header class="topbar">
      <div>
        <span class="eyebrow">A.B.A</span>
        <h1>Control de bultos, kilos y ganancias</h1>
      </div>
      <div class="stock-strip">
        <span><strong>{{ store.totalBags() }}</strong> bultos</span>
        <span><strong>{{ store.openKg() | number: '1.1-2' }}</strong> kg abiertos</span>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      align-items: center;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      margin-bottom: 1.2rem;
    }

    .eyebrow {
      color: var(--gold);
      display: block;
      font-size: 0.78rem;
      font-weight: 900;
    }

    h1 {
      font-size: clamp(1.35rem, 2vw, 2rem);
      line-height: 1.1;
      margin: 0.2rem 0 0;
    }

    .stock-strip {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      display: flex;
      gap: 0.65rem;
      padding: 0.65rem;
    }

    .stock-strip span {
      background: var(--surface-soft);
      border-radius: 8px;
      color: var(--muted);
      min-width: 7rem;
      padding: 0.55rem 0.7rem;
    }

    .stock-strip strong {
      color: var(--ink);
      display: block;
      font-size: 1.15rem;
    }

    @media (max-width: 880px) {
      .topbar {
        align-items: stretch;
        flex-direction: column;
      }
    }

    @media (max-width: 520px) {
      .stock-strip {
        flex-direction: column;
      }
    }
  `]
})
export class AppTopbarComponent {
  readonly store = inject(AppTopbarStore);
}
