import type { SQLiteDatabase } from "expo-sqlite";

// Version actual del esquema. Si se sube este numero se agrega una migracion nueva.
const VERSION_BD = 1;

// Tipos de las filas que devuelven las consultas.
export type Rol = "TITULAR" | "ASISTENTE";

export type Usuario = {
  id_usuario: number;
  nombre: string;
  nombre_usuario: string;
  contrasena_hash: string;
  rol: Rol;
  fecha_creacion: number;
};

export type TipoCliente = {
  id_tipo_cliente: number;
  nombre: string;
};

export type Cliente = {
  id_cliente: number;
  nombre: string;
  direccion_vereda: string;
  id_tipo_cliente: number;
  fecha_registro: number;
};

export type PesoCilindro = {
  id_peso: number;
  peso_kg: number;
  descripcion: string;
};

export type Precio = {
  id_precio: number;
  id_peso: number;
  id_tipo_cliente: number;
  valor: number;
  fecha_actualizacion: number;
};

export type Venta = {
  id_venta: number;
  id_cliente: number;
  id_peso: number;
  id_usuario: number;
  precio_aplicado: number;
  descuento: number;
  total: number;
  fecha_hora: number;
  sincronizado: number;
};

export type EstadoPrestamo = "ACTIVO" | "CERRADO";

export type Prestamo = {
  id_prestamo: number;
  id_cliente: number;
  id_peso: number;
  id_usuario: number;
  fecha_prestamo: number;
  fecha_devolucion: number | null;
  estado: EstadoPrestamo;
  sincronizado: number;
};

// Crea la base de datos local la primera vez que se abre la app.
// Todo queda guardado en el celular, por eso la app funciona sin internet.
export const inicializarBD = async (db: SQLiteDatabase) => {
  // Las llaves foraneas se activan en cada conexion, SQLite no las recuerda.
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // user_version nos dice si las tablas ya fueron creadas antes.
  const fila = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const versionActual = fila?.user_version ?? 0;

  // Si ya esta al dia no se vuelve a crear nada.
  if (versionActual >= VERSION_BD) {
    return;
  }

  if (versionActual === 0) {
    await db.execAsync(`
      CREATE TABLE usuario (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        nombre_usuario TEXT NOT NULL UNIQUE,
        contrasena_hash TEXT NOT NULL,
        rol TEXT NOT NULL CHECK (rol IN ('TITULAR', 'ASISTENTE')),
        fecha_creacion INTEGER NOT NULL
      );

      CREATE TABLE tipo_cliente (
        id_tipo_cliente INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL
      );

      CREATE TABLE cliente (
        id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        direccion_vereda TEXT NOT NULL,
        id_tipo_cliente INTEGER NOT NULL,
        fecha_registro INTEGER NOT NULL,
        FOREIGN KEY (id_tipo_cliente) REFERENCES tipo_cliente (id_tipo_cliente)
      );

      CREATE TABLE peso_cilindro (
        id_peso INTEGER PRIMARY KEY,
        peso_kg REAL NOT NULL,
        descripcion TEXT NOT NULL
      );

      CREATE TABLE precio (
        id_precio INTEGER PRIMARY KEY AUTOINCREMENT,
        id_peso INTEGER NOT NULL,
        id_tipo_cliente INTEGER NOT NULL,
        valor REAL NOT NULL CHECK (valor > 0),
        fecha_actualizacion INTEGER NOT NULL,
        FOREIGN KEY (id_peso) REFERENCES peso_cilindro (id_peso),
        FOREIGN KEY (id_tipo_cliente) REFERENCES tipo_cliente (id_tipo_cliente),
        UNIQUE (id_peso, id_tipo_cliente)
      );

      CREATE TABLE venta (
        id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
        id_cliente INTEGER NOT NULL,
        id_peso INTEGER NOT NULL,
        id_usuario INTEGER NOT NULL,
        precio_aplicado REAL NOT NULL,
        descuento REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        fecha_hora INTEGER NOT NULL,
        sincronizado INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente),
        FOREIGN KEY (id_peso) REFERENCES peso_cilindro (id_peso),
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
      );

      CREATE TABLE prestamo (
        id_prestamo INTEGER PRIMARY KEY AUTOINCREMENT,
        id_cliente INTEGER NOT NULL,
        id_peso INTEGER NOT NULL,
        id_usuario INTEGER NOT NULL,
        fecha_prestamo INTEGER NOT NULL,
        fecha_devolucion INTEGER,
        estado TEXT NOT NULL CHECK (estado IN ('ACTIVO', 'CERRADO')),
        sincronizado INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente),
        FOREIGN KEY (id_peso) REFERENCES peso_cilindro (id_peso),
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
      );

      INSERT INTO tipo_cliente (id_tipo_cliente, nombre) VALUES
        (1, 'Hogar veredal'),
        (2, 'Establecimiento comercial');

      INSERT INTO peso_cilindro (id_peso, peso_kg, descripcion) VALUES
        (1, 9, '20 lb'),
        (2, 14, '30 lb'),
        (3, 18, '40 lb'),
        (4, 45, '100 lb');
    `);
  }

  // Aqui se agregaran las migraciones de los siguientes sprints.
  // if (versionActual === 1) { ... }

  await db.execAsync(`PRAGMA user_version = ${VERSION_BD}`);
};

export default inicializarBD;
