import { Page, expect } from '@playwright/test';
import { t } from './textos';

// Avisos y diálogos de la app (SweetAlert2, core/notify/notification.service.ts). Ya no hay diálogos del
// navegador: el ID de vendedor, el fin de venta, las confirmaciones y los avisos de éxito o error son
// ventanas .swal2-popup dentro de la página. Los textos se comparan con t(clave).

export function avisos(page: Page) {
  const popup = page.locator('.swal2-popup');
  return {
    popup,
    titulo: popup.locator('.swal2-title'),
    texto: popup.locator('.swal2-html-container'),
    campo: popup.locator('.swal2-input'),
    confirmar: popup.locator('.swal2-confirm'),
    negar: popup.locator('.swal2-deny'),
    cancelar: popup.locator('.swal2-cancel'),
    iconoDeExito: popup.locator('.swal2-icon.swal2-success'),
    iconoDeError: popup.locator('.swal2-icon.swal2-error')
  };
}

/**
 * Contesta el diálogo del ID de vendedor: verifica que lo pida con el texto del diccionario y con el campo
 * oculto, y escribe `id`. Con `null`, cancela.
 */
export async function darIdDeVendedor(page: Page, id: string | null): Promise<void> {
  const aviso = avisos(page);
  await expect(aviso.titulo).toHaveText(t('seller.askId'));
  await expect(aviso.campo).toHaveAttribute('type', 'password');
  if (id == null) {
    await aviso.cancelar.click();
  } else {
    await aviso.campo.fill(id);
    await aviso.confirmar.click();
  }
  // Se espera al campo y no a la ventana: con un ID rechazado, el aviso de error ocupa la misma ventana.
  await expect(aviso.campo).toBeHidden();
}

/** Verifica un aviso de error con `mensaje` y lo cierra con «Cerrar». */
export async function cerrarError(page: Page, mensaje: string): Promise<void> {
  const aviso = avisos(page);
  await expect(aviso.iconoDeError).toBeVisible();
  await expect(aviso.texto).toHaveText(mensaje);
  await expect(aviso.confirmar).toHaveText(t('notifications.actions.close'));
  await aviso.confirmar.click();
  await expect(aviso.popup).toBeHidden();
}

/** Verifica un aviso de éxito con `titulo` y espera a que se cierre solo. */
export async function esperarExito(page: Page, titulo: string): Promise<void> {
  const aviso = avisos(page);
  await expect(aviso.iconoDeExito).toBeVisible();
  await expect(aviso.titulo).toHaveText(titulo);
  await expect(aviso.popup).toBeHidden({ timeout: 10_000 });
}

/**
 * Contesta el aviso «Venta cobrada»: «Ver ticket» abre el ticket y «Nueva venta» lo deja cerrado.
 */
export async function terminarVenta(page: Page, opcion: 'ver ticket' | 'nueva venta'): Promise<void> {
  const aviso = avisos(page);
  await expect(aviso.titulo).toHaveText(t('sales.messages.charged'));
  await expect(aviso.confirmar).toHaveText(t('sales.messages.viewTicket'));
  await expect(aviso.negar).toHaveText(t('sales.messages.newSale'));
  await (opcion === 'ver ticket' ? aviso.confirmar : aviso.negar).click();
  await expect(aviso.popup).toBeHidden();
}

/**
 * Cuenta cuántas veces se abre un aviso en la página (cada aviso nuevo crea su .swal2-container). Se instala
 * antes de navegar; `contarAvisos` lee el total.
 */
export async function vigilarAvisos(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const ventana = window as unknown as { __avisosAbiertos: number };
    ventana.__avisosAbiertos = 0;
    // Se observa el documento: al correr el script todavía no existe <html>.
    new MutationObserver((cambios) => {
      for (const cambio of cambios) {
        for (const nodo of cambio.addedNodes) {
          if (nodo instanceof HTMLElement && nodo.classList.contains('swal2-container')) {
            ventana.__avisosAbiertos += 1;
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
}

export function contarAvisos(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __avisosAbiertos: number }).__avisosAbiertos);
}
