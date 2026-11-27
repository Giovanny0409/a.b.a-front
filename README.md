# A.B.A Punto de Venta

Base frontend en Angular 21 para Alimentos Balanceados Alonso.

## Modulos iniciales

- Tablero con resumen de bultos, kilos abiertos, ventas y ganancia.
- Compras para registrar bultos con kilos marcados, kilos reales, costo y precios de venta.
- Ventas por bulto o por kilo. La venta por kilo abre un bulto y calcula costo contra los kilos reales.
- Inventario con alertas de minimo por producto.
- Historial de compras y ventas para revisar inversion, ingreso y utilidad.

## Comandos

```bash
npm install
npm start
```

El frontend consume el backend de `apiBaseUrl` en `src/environments/` (hoy `http://localhost:5028/api`) y mantiene el estado de la sesion en NgRx. Los providers de la app estan en `src/app/app.config.ts`.
