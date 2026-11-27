import es from '../../assets/i18n/es.json';

type Params = Record<string, string | number>;

/**
 * Texto de `es.json` para una clave, con la misma interpolación `{{param}}` que ngx-translate.
 * Las pruebas comparan contra el diccionario, no contra literales. Si la clave no existe, falla.
 */
export function t(key: string, params: Params = {}): string {
  const value = key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    es
  );

  if (typeof value !== 'string') {
    throw new Error(`La clave «${key}» no existe en es.json.`);
  }

  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}
