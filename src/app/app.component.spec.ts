import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { provideI18n } from '@core/i18n/provide-i18n';
import { t } from '@testing/translate';

describe('AppComponent', () => {
  it('se crea con el menú, el encabezado y el área de contenido', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('aba-app-menu')).not.toBeNull();
    expect(element.querySelector('aba-app-topbar')).not.toBeNull();
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelectorAll('aba-app-menu a[href]').length).toBe(5);
    expect([...element.querySelectorAll('aba-app-menu a[href] span')].map((span) => span.textContent?.trim()))
      .toEqual([t('menu.dashboard'), t('menu.sales'), t('menu.purchases'), t('menu.inventory'), t('menu.history')]);
    expect(element.querySelector('aba-app-topbar')?.textContent).toContain(t('common.brand.name'));
  });
});
