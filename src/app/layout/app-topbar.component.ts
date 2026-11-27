import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'aba-app-topbar',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <header class="topbar">
      <div class="brand-line">
        <span class="eyebrow">{{ 'common.brand.initials' | translate }}</span>
        <span>{{ 'common.brand.name' | translate }}</span>
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

    .brand-line {
      display: grid;
      gap: 0.1rem;
    }

    .brand-line span:last-child {
      color: var(--muted);
      font-size: 0.9rem;
      font-weight: 800;
    }

    @media (max-width: 880px) {
      .topbar {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `]
})
export class AppTopbarComponent {}
