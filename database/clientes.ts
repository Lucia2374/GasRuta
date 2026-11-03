import type { Cliente } from "@/database/db";
import type { SQLiteDatabase } from "expo-sqlite";

// Reexportamos el type Cliente que ya vive en database/db.ts.
export type { Cliente };

// Los dos unicos tipos de cliente que existen en la app.
export const TIPOS_CLIENTE = [
  { id_tipo_cliente: 1, nombre: "Hogar veredal" },
  { id_tipo_cliente: 2, nombre: "Establecimiento comercial" },
] as const;

export type DatosCliente = {
  nombre: string;
  direccionVereda: string;
  idTipoCliente: number | null;
};

// Revisa que el formulario este completo, usado antes de guardar o editar.
const validarDatos = (datos: DatosCliente) => {
  if (datos.nombre.trim().length === 0) {
    throw new Error("El nombre del cliente es obligatorio.");
  }
  if (datos.direccionVereda.trim().length === 0) {
    throw new Error("La dirección o vereda es obligatoria.");
  }
  if (datos.idTipoCliente === null) {
    throw new Error("Elige el tipo de cliente.");
  }
};

// Lista los clientes guardados. Se puede filtrar por texto (nombre o vereda)
// y por tipo de cliente, para la busqueda y los chips de la pantalla de lista.
export const listarClientes = async (
  db: SQLiteDatabase,
  opciones?: { texto?: string; idTipoCliente?: number; limite?: number }
): Promise<Cliente[]> => {
  const condiciones: string[] = [];
  const parametros: (string | number)[] = [];

  const texto = opciones?.texto?.trim();
  if (texto && texto.length > 0) {
    condiciones.push("(LOWER(nombre) LIKE ? OR LOWER(direccion_vereda) LIKE ?)");
    const comodin = `%${texto.toLowerCase()}%`;
    parametros.push(comodin, comodin);
  }

  if (opciones?.idTipoCliente) {
    condiciones.push("id_tipo_cliente = ?");
    parametros.push(opciones.idTipoCliente);
  }

  const dondeSql = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const limiteSql = opciones?.limite ? "LIMIT ?" : "";
  if (opciones?.limite) {
    parametros.push(opciones.limite);
  }

  return await db.getAllAsync<Cliente>(
    `SELECT * FROM cliente ${dondeSql} ORDER BY nombre ${limiteSql}`,
    parametros
  );
};

// Trae un solo cliente por su id, usado en la pantalla de editar.
export const obtenerCliente = async (
  db: SQLiteDatabase,
  idCliente: number
): Promise<Cliente | null> =>
  await db.getFirstAsync<Cliente>(
    "SELECT * FROM cliente WHERE id_cliente = ?",
    [idCliente]
  );

// Guarda un cliente nuevo. El nombre no se puede repetir (sin importar mayusculas).
export const registrarCliente = async (
  db: SQLiteDatabase,
  datos: DatosCliente
): Promise<Cliente> => {
  validarDatos(datos);

  const nombre = datos.nombre.trim();
  const direccionVereda = datos.direccionVereda.trim();
  const idTipoCliente = datos.idTipoCliente as number;

  const existente = await db.getFirstAsync<{ id_cliente: number }>(
    "SELECT id_cliente FROM cliente WHERE LOWER(nombre) = LOWER(?)",
    [nombre]
  );
  if (existente) {
    throw new Error("Ya existe un cliente con ese nombre.");
  }

  const fechaRegistro = Date.now();
  const resultado = await db.runAsync(
    `INSERT INTO cliente (nombre, direccion_vereda, id_tipo_cliente, fecha_registro)
     VALUES (?, ?, ?, ?)`,
    [nombre, direccionVereda, idTipoCliente, fechaRegistro]
  );

  return {
    id_cliente: resultado.lastInsertRowId,
    nombre,
    direccion_vereda: direccionVereda,
    id_tipo_cliente: idTipoCliente,
    fecha_registro: fechaRegistro,
  };
};

// Actualiza un cliente ya existente. Tambien revisa que el nombre no quede
// repetido con otro cliente distinto al que se esta editando.
export const editarCliente = async (
  db: SQLiteDatabase,
  idCliente: number,
  datos: DatosCliente
): Promise<void> => {
  validarDatos(datos);

  const nombre = datos.nombre.trim();
  const direccionVereda = datos.direccionVereda.trim();
  const idTipoCliente = datos.idTipoCliente as number;

  const existente = await db.getFirstAsync<{ id_cliente: number }>(
    "SELECT id_cliente FROM cliente WHERE LOWER(nombre) = LOWER(?) AND id_cliente != ?",
    [nombre, idCliente]
  );
  if (existente) {
    throw new Error("Ya existe un cliente con ese nombre.");
  }

  await db.runAsync(
    `UPDATE cliente
     SET nombre = ?, direccion_vereda = ?, id_tipo_cliente = ?
     WHERE id_cliente = ?`,
    [nombre, direccionVereda, idTipoCliente, idCliente]
  );
};

// Elimina un cliente. Si ya tiene ventas o prestamos registrados no se
// borra (se perderia ese historial), se avisa con un mensaje claro en vez
// de dejar que la base de datos rechace el borrado por las llaves foraneas.
export const eliminarCliente = async (
  db: SQLiteDatabase,
  idCliente: number
): Promise<void> => {
  const ventas = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) as total FROM venta WHERE id_cliente = ?",
    [idCliente]
  );
  const prestamos = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) as total FROM prestamo WHERE id_cliente = ?",
    [idCliente]
  );

  if ((ventas?.total ?? 0) > 0 || (prestamos?.total ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar: este cliente ya tiene ventas o préstamos registrados."
    );
  }

  await db.runAsync("DELETE FROM cliente WHERE id_cliente = ?", [idCliente]);
};
