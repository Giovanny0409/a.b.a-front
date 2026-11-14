import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { aProduct, anInventoryItem } from '../../testing/fixtures';
import { InventoryPageComponent } from './inventory-page.component';
import { InventoryStore } from './inventory.store';

describe('InventoryPageComponent', () => {
  const maiz = anInventoryItem({ product: aProduct({ id: 'p-1', name: 'Maiz quebrado' }), sealedBags: 3, openKg: 12.5, quantityTotal: 0 });
  const correa = anInventoryItem({ product: aProduct({ id: 'p-2', name: 'Correa' }), sealedBags: 0, openKg: 0, quantityTotal: 4 });
  const agotado = anInventoryItem({ product: aProduct({ id: 'p-3', name: 'Salvado' }), sealedBags: 0, openKg: 0, quantityTotal: 0 });
  let component: InventoryPageComponent;
  let load: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    load = vi.fn();
    TestBed.overrideComponent(InventoryPageComponent, {
      set: { providers: [{ provide: InventoryStore, useValue: { inventory: signal([maiz, correa, agotado]), load } }] }
    });
    const fixture = TestBed.createComponent(InventoryPageComponent);
    component = fixture.componentInstance;
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
    expect(component.inventoryTotalLabel(maiz)).toBe('3 bultos / 12.5 kg abiertos');
    expect(component.inventoryTotalLabel(correa)).toBe('4 piezas');
    expect(component.inventoryTotalLabel(agotado)).toBe('Sin existencia');
  });
});
