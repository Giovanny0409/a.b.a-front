// Los textos de la app salen de src/assets/i18n/es.json: los locators los toman de ahí con t(clave),
// en lugar de repetirlos, para que cambiar una redacción no rompa una prueba.
export { t } from '../../src/app/testing/translate';

/** Nombre accesible que termina con el texto: los botones empiezan con el glifo de su icono. */
export function terminaCon(texto: string): RegExp {
  return new RegExp(`${texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}
