// Mercancía y proveedores de prueba con nombres reales de la forrajería. Los nombres son fijos: cada
// corrida suma al mismo producto (el back los reutiliza por nombre), así que las pruebas verifican por
// diferencia contra lo que había antes (ver api.ts). La marca va en el nombre del producto porque el back
// identifica el producto por su nombre: el mismo alimento de dos marcas son dos productos.

export interface Proveedor {
  nombre: string;
  telefono: string;
}

export interface ProductoDeBulto {
  nombre: string;
  categoria: string;
  kgPorBulto: number;
  costoPorBulto: number;
  ventaBulto: number;
  ventaKg: number;
}

export interface ProductoDePieza {
  nombre: string;
  categoria: string;
  costoPorPieza: number;
  ventaPieza: number;
}

export const PROVEEDORES = {
  maltaCleyton: { nombre: 'Malta Cleyton', telefono: '3336681200' },
  purina: { nombre: 'Purina', telefono: '5552829000' },
  accesoriosBajio: { nombre: 'Accesorios Pecuarios del Bajío', telefono: '4777124530' }
} satisfies Record<string, Proveedor>;

export const PRODUCTOS = {
  polloEngordaMalta: {
    nombre: 'Alimento pollo de engorda Malta Cleyton 40 kg',
    categoria: 'Alimento',
    kgPorBulto: 40,
    costoPorBulto: 560,
    ventaBulto: 640,
    ventaKg: 17
  },
  polloEngordaPurina: {
    nombre: 'Alimento pollo de engorda Purina 40 kg',
    categoria: 'Alimento',
    kgPorBulto: 40,
    costoPorBulto: 590,
    ventaBulto: 670,
    ventaKg: 18
  },
  comederoPollo: {
    nombre: 'Comedero para pollo 3 kg',
    categoria: 'Comedero',
    costoPorPieza: 45,
    ventaPieza: 75
  }
} satisfies Record<string, ProductoDeBulto | ProductoDePieza>;
