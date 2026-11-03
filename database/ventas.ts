import type { SQLiteDatabase } from "expo-sqlite";

// Detalle de una venta ya guardada, con el nombre del cliente y la
// descripcion del cilindro (vienen de un JOIN, por eso no es igual a la
// tabla venta de database/db.ts).
export type VentaDetalle = {
  id_venta: number;
  precio_aplicado: number;
  descuento: number;
  total: number;
  fecha_hora: number;
  nombre_cliente: string;
  direccion_vereda: string;
  descripcion_peso: string;
};

export type DatosVenta = {
  idCliente: number;
  idPeso: number;
  idUsuario: number;
  precioAplicado: number;
  descuento: number;
};

// Calcula el total de la venta. Un descuento de 0 significa "sin descuento".
// Si se usa un descuento, debe ser mayor que 0 y menor que el precio.
export const calcularTotal = (precio: number, descuento: number): number => {
  if (descuento === 0) {
    return precio;
  }
  if (!(descuento > 0 && descuento < precio)) {
    throw new Error("El descuento debe ser mayor que 0 y menor que el precio.");
  }
  return precio - descuento;
};

// Devuelve el inicio (00:00:00) y el fin (23:59:59) del dia de una fecha.
const limitesDelDia = (fecha: number) => {
  const dia = new Date(fecha);
  const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0, 0).getTime();
  const fin = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59, 999).getTime();
  return { inicio, fin };
};

// Guarda una venta nueva. El total se calcula aqui mismo con calcularTotal,
// asi que si el descuento no es valido la venta no se llega a guardar.
export const registrarVenta = async (
  db: SQLiteDatabase,
  datos: DatosVenta
): Promise<number> => {
  const total = calcularTotal(datos.precioAplicado, datos.descuento);
  const fechaHora = Date.now();

  const resultado = await db.runAsync(
    `INSERT INTO venta (id_cliente, id_peso, id_usuario, precio_aplicado, descuento, total, fecha_hora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.idCliente,
      datos.idPeso,
      datos.idUsuario,
      datos.precioAplicado,
      datos.descuento,
      total,
      fechaHora,
    ]
  );

  return resultado.lastInsertRowId;
};

// Trae el detalle completo de una venta (con nombre del cliente y
// descripcion del cilindro), usado en la pantalla de confirmacion.
export const obtenerVenta = async (
  db: SQLiteDatabase,
  idVenta: number
): Promise<VentaDetalle | null> =>
  await db.getFirstAsync<VentaDetalle>(
    `SELECT v.id_venta, v.precio_aplicado, v.descuento, v.total, v.fecha_hora,
            c.nombre as nombre_cliente, c.direccion_vereda,
            p.descripcion as descripcion_peso
     FROM venta v
     JOIN cliente c ON c.id_cliente = v.id_cliente
     JOIN peso_cilindro p ON p.id_peso = v.id_peso
     WHERE v.id_venta = ?`,
    [idVenta]
  );

// Suma las ventas de un dia completo (para la tarjeta "Ventas de hoy" y
// el resumen diario).
export const totalesDelDia = async (
  db: SQLiteDatabase,
  fecha: number
): Promise<{ total: number; cantidad: number; totalDescuentos: number }> => {
  const { inicio, fin } = limitesDelDia(fecha);

  const fila = await db.getFirstAsync<{
    total: number;
    cantidad: number;
    totalDescuentos: number;
  }>(
    `SELECT COALESCE(SUM(total), 0) as total,
            COUNT(*) as cantidad,
            COALESCE(SUM(descuento), 0) as totalDescuentos
     FROM venta
     WHERE fecha_hora BETWEEN ? AND ?`,
    [inicio, fin]
  );

  return fila ?? { total: 0, cantidad: 0, totalDescuentos: 0 };
};

// Cuenta las ventas del dia agrupadas por peso de cilindro. Usa LEFT JOIN
// para que tambien salgan los pesos que no tuvieron ninguna venta hoy.
export const cilindrosPorPeso = async (
  db: SQLiteDatabase,
  fecha: number
): Promise<{ descripcion: string; cantidad: number }[]> => {
  const { inicio, fin } = limitesDelDia(fecha);

  return await db.getAllAsync<{ descripcion: string; cantidad: number }>(
    `SELECT p.descripcion as descripcion, COUNT(v.id_venta) as cantidad
     FROM peso_cilindro p
     LEFT JOIN venta v ON v.id_peso = p.id_peso AND v.fecha_hora BETWEEN ? AND ?
     GROUP BY p.id_peso
     ORDER BY p.id_peso`,
    [inicio, fin]
  );
};
