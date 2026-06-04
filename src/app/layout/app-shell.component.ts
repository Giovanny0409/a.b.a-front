import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppMenuComponent } from './app-menu.component';
import { AppTopbarComponent } from './app-topbar.component';

@Component({
  selector: 'aba-app-shell',
  standalone: true,
  imports: [RouterOutlet, AppMenuComponent, AppTopbarComponent],
  template: `
    <div class="shell">
      <aba-app-menu />

      <main class="workspace">
        <aba-app-topbar />
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: 17rem minmax(0, 1fr);
      min-height: 100vh;
    }

    .workspace {
      min-width: 0;
      padding: 1.2rem;
    }

    @media (max-width: 880px) {
      .shell {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .workspace {
        padding: 0.75rem;
      }
    }
  `]
})
export class AppShellComponent {}
