import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideI18n } from '../../core/i18n/provide-i18n';
import { aProduct, anInventoryItem } from '../../testing/fixtures';
import { t } from '../../testing/translate';
import { InventoryPageComponent } from './inventory-page.component';
import { InventoryStore } from './inventory.store';

describe('InventoryPageComponent', () => {
  const maiz = anInventoryItem({ product: aProduct({ id: 'p-1', name: 'Maiz quebrado' }), sealedBags: 3, openKg: 12.5, quantityTotal: 0 });
  const correa = anInventoryItem({ product: aProduct({ id: 'p-2', name: 'Correa' }), sealedBags: 0, openKg: 0, quantityTotal: 4 });
  const agotado = anInventoryItem({ product: aProduct({ id: 'p-3', name: 'Salvado' }), sealedBags: 0, openKg: 0, quantityTotal: 0 });
  let component: InventoryPageComponent;
  let element: HTMLElement;
  let load: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    load = vi.fn();
    TestBed.configureTestingModule({ providers: [provideI18n()] });
    TestBed.overrideComponent(InventoryPageComponent, {
      set: { providers: [{ provide: InventoryStore, useValue: { inventory: signal([maiz, correa, agotado]), load } }] }
    });
    const fixture = TestBed.createComponent(InventoryPageComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('se crea y carga el inventario', () => {
    expect(component).toBeTruthy();
    expect(load).toHaveBeenCalled();
  });

  it('filtra por nombre sin importar mayúsculas ni espacios', () => {
    expect(component.filteredInventory()).toHaveLength(3);

    component.filter.set('  MAIZ ');
    expect(component.filteredInventory()).toEqual([maiz]);

    component.filter.set('nada');
    expect(component.filteredInventory()).toEqual([]);
  });

  it('describe el inventario neto de cada producto', () => {
    expect(component.inventoryTotalLabel(maiz))
      .toBe(`${t('common.units.bagsCount', { count: 3 })} / ${t('common.units.openKg', { kg: '12.5' })}`);
    expect(component.inventoryTotalLabel(correa)).toBe(t('common.units.piecesCount', { count: 4 }));
    expect(component.inventoryTotalLabel(agotado)).toBe(t('inventory.noStock'));
  });

  it('muestra los textos del diccionario, con acentos', () => {
    expect(element.textContent).toContain(t('inventory.columns.minimum'));
    expect(element.textContent).toContain(t('common.fields.category'));
    expect(element.querySelector<HTMLInputElement>('input[type="search"]')?.placeholder).toBe(t('inventory.filter.placeholder'));
  });
});
