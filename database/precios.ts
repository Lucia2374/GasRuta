import type { PesoCilindro, Precio } from "@/database/db";
import type { SQLiteDatabase } from "expo-sqlite";

// Peso es el mismo peso_cilindro que ya existe en database/db.ts.
export type Peso = PesoCilindro;
export type { Precio };

// Lista los 4 pesos de cilindro que trae la app (20, 30, 40 y 100 lb).
export const listarPesos = async (db: SQLiteDatabase): Promise<Peso[]> =>
  await db.getAllAsync<Peso>("SELECT * FROM peso_cilindro ORDER BY id_peso");

// Lista todos los precios guardados, sin importar el peso o el tipo de cliente.
export const listarPrecios = async (db: SQLiteDatabase): Promise<Precio[]> =>
  await db.getAllAsync<Precio>("SELECT * FROM precio");

// Busca el precio de un peso para un tipo de cliente. Si no se ha
// configurado todavia, devuelve null.
export const consultarPrecio = async (
  db: SQLiteDatabase,
  idPeso: number,
  idTipoCliente: number
): Promise<number | null> => {
  const fila = await db.getFirstAsync<{ valor: number }>(
    "SELECT valor FROM precio WHERE id_peso = ? AND id_tipo_cliente = ?",
    [idPeso, idTipoCliente]
  );
  return fila ? fila.valor : null;
};

// Guarda o actualiza el precio de un peso para un tipo de cliente.
// Si ya existia esa combinacion, se reemplaza su valor (ON CONFLICT).
export const guardarPrecio = async (
  db: SQLiteDatabase,
  idPeso: number,
  idTipoCliente: number,
  valor: number
): Promise<void> => {
  if (!(valor > 0)) {
    throw new Error("El precio debe ser mayor que 0.");
  }

  await db.runAsync(
    `INSERT INTO precio (id_peso, id_tipo_cliente, valor, fecha_actualizacion)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (id_peso, id_tipo_cliente)
     DO UPDATE SET valor = excluded.valor, fecha_actualizacion = excluded.fecha_actualizacion`,
    [idPeso, idTipoCliente, valor, Date.now()]
  );
};
