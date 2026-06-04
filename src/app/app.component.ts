import { Component } from '@angular/core';
import { AppShellComponent } from './layout/app-shell.component';

@Component({
  selector: 'aba-root',
  standalone: true,
  imports: [AppShellComponent],
  template: `<aba-app-shell />`
})
export class AppComponent {}
