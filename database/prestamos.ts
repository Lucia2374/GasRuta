import type { SQLiteDatabase } from "expo-sqlite";

// Un prestamo activo, con el nombre del cliente y la descripcion del
// cilindro ya traidos por un JOIN (para no tener que consultar aparte).
export type PrestamoActivo = {
  id_prestamo: number;
  nombre_cliente: string;
  direccion_vereda: string;
  descripcion_peso: string;
  fecha_prestamo: number;
};

export type DatosPrestamo = {
  idCliente: number;
  idPeso: number;
  idUsuario: number;
};

// Registra que un cliente se llevo un cilindro en prestamo (queda ACTIVO).
export const registrarPrestamo = async (
  db: SQLiteDatabase,
  datos: DatosPrestamo
): Promise<number> => {
  const resultado = await db.runAsync(
    `INSERT INTO prestamo (id_cliente, id_peso, id_usuario, fecha_prestamo, estado)
     VALUES (?, ?, ?, ?, 'ACTIVO')`,
    [datos.idCliente, datos.idPeso, datos.idUsuario, Date.now()]
  );

  return resultado.lastInsertRowId;
};

// Lista los prestamos que todavia no se han devuelto, del mas antiguo al
// mas reciente (para atender primero a quien lleva mas tiempo esperando).
export const listarPrestamosActivos = async (
  db: SQLiteDatabase
): Promise<PrestamoActivo[]> =>
  await db.getAllAsync<PrestamoActivo>(
    `SELECT pr.id_prestamo, c.nombre as nombre_cliente, c.direccion_vereda,
            pc.descripcion as descripcion_peso, pr.fecha_prestamo
     FROM prestamo pr
     JOIN cliente c ON c.id_cliente = pr.id_cliente
     JOIN peso_cilindro pc ON pc.id_peso = pr.id_peso
     WHERE pr.estado = 'ACTIVO'
     ORDER BY pr.fecha_prestamo ASC`
  );

// Marca un prestamo como devuelto.
export const cerrarPrestamo = async (
  db: SQLiteDatabase,
  idPrestamo: number
): Promise<void> => {
  await db.runAsync(
    `UPDATE prestamo SET estado = 'CERRADO', fecha_devolucion = ? WHERE id_prestamo = ?`,
    [Date.now(), idPrestamo]
  );
};
