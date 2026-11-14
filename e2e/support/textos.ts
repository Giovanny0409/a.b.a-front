// Los textos de la app salen de src/assets/i18n/es.json: los locators los toman de ahí con t(clave),
// en lugar de repetirlos, para que cambiar una redacción no rompa una prueba.
export { t } from '../../src/app/testing/translate';
