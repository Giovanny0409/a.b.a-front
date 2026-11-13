// Nombres de los datos que crean las suites. El backend no tiene endpoints de borrado, así que la
// marca por corrida evita que una corrida choque con la anterior (productos y proveedores se buscan
// por nombre y se reutilizan) y el prefijo PW_ permite reconocerlos al limpiar aba.db (P-08).

export function marcaDeCorrida(): string {
  return Date.now().toString(36);
}

export function nombrePrueba(marca: string, sufijo: string): string {
  return `PW_${marca}_${sufijo}`;
}
