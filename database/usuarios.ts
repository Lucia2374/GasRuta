import type { Rol, Usuario } from "@/database/db";
import { calcularHash } from "@/utils/seguridad";
import type { SQLiteDatabase } from "expo-sqlite";

// Reexportamos el type Usuario que vive en database/db.ts junto con el
// resto de las tablas, asi no se declara dos veces la misma forma de datos.
export type { Usuario };

// Numero maximo de cuentas que puede tener la app: una titular y una asistente.
const MAXIMO_USUARIOS = 2;

// Cuenta cuantas cuentas existen hasta el momento.
export const contarUsuarios = async (db: SQLiteDatabase): Promise<number> => {
  const fila = await db.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) as total FROM usuario"
  );
  return fila?.total ?? 0;
};

// Lista las cuentas registradas, de la mas antigua a la mas nueva.
export const listarUsuarios = async (db: SQLiteDatabase): Promise<Usuario[]> =>
  await db.getAllAsync<Usuario>("SELECT * FROM usuario ORDER BY id_usuario");

export type DatosNuevoUsuario = {
  nombre: string;
  nombreUsuario: string;
  contrasena: string;
};

// Crea una cuenta nueva. La primera que se crea queda como TITULAR y la
// segunda como ASISTENTE; despues de eso no se permiten mas cuentas.
export const crearUsuario = async (
  db: SQLiteDatabase,
  datos: DatosNuevoUsuario
): Promise<Usuario> => {
  const nombre = datos.nombre.trim();
  const nombreUsuario = datos.nombreUsuario.trim();
  const contrasena = datos.contrasena;

  if (nombre.length === 0 || nombreUsuario.length === 0) {
    throw new Error("El nombre y el usuario son obligatorios.");
  }
  if (contrasena.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const totalActual = await contarUsuarios(db);
  if (totalActual >= MAXIMO_USUARIOS) {
    throw new Error("Ya existen las 2 cuentas permitidas (titular y asistente).");
  }

  const existente = await db.getFirstAsync<{ id_usuario: number }>(
    "SELECT id_usuario FROM usuario WHERE LOWER(nombre_usuario) = LOWER(?)",
    [nombreUsuario]
  );
  if (existente) {
    throw new Error("Ese nombre de usuario ya existe.");
  }

  const rol: Rol = totalActual === 0 ? "TITULAR" : "ASISTENTE";
  const hash = await calcularHash(nombreUsuario, contrasena);
  const fechaCreacion = Date.now();

  const resultado = await db.runAsync(
    `INSERT INTO usuario (nombre, nombre_usuario, contrasena_hash, rol, fecha_creacion)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, nombreUsuario, hash, rol, fechaCreacion]
  );

  return {
    id_usuario: resultado.lastInsertRowId,
    nombre,
    nombre_usuario: nombreUsuario,
    contrasena_hash: hash,
    rol,
    fecha_creacion: fechaCreacion,
  };
};

// Revisa el usuario y la contraseña contra lo guardado en la base de datos.
// Si coinciden devuelve la cuenta, si no devuelve null.
export const validarCredenciales = async (
  db: SQLiteDatabase,
  nombreUsuario: string,
  contrasena: string
): Promise<Usuario | null> => {
  const usuario = await db.getFirstAsync<Usuario>(
    "SELECT * FROM usuario WHERE LOWER(nombre_usuario) = LOWER(?)",
    [nombreUsuario.trim()]
  );
  if (!usuario) {
    return null;
  }

  const hash = await calcularHash(usuario.nombre_usuario, contrasena);
  if (hash !== usuario.contrasena_hash) {
    return null;
  }

  return usuario;
};
