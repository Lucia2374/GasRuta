import type { Rol } from "@/database/db";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clave con la que se guarda la sesion en el almacenamiento del celular.
const CLAVE_SESION = "gasruta_sesion";

// Datos minimos que se guardan de la cuenta que inicio sesion.
// Nunca se guarda la contraseña ni su hash aqui.
export type SesionGuardada = {
  id_usuario: number;
  nombre: string;
  nombre_usuario: string;
  rol: Rol;
};

// Guarda la sesion en el celular para que siga activa aunque se cierre la app.
export const guardarSesion = async (sesion: SesionGuardada): Promise<void> => {
  await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
};

// Lee la sesion guardada. Devuelve null si nadie ha iniciado sesion.
export const leerSesion = async (): Promise<SesionGuardada | null> => {
  const texto = await AsyncStorage.getItem(CLAVE_SESION);
  if (!texto) {
    return null;
  }
  return JSON.parse(texto) as SesionGuardada;
};

// Borra la sesion guardada, usado al cerrar sesion.
export const cerrarSesion = async (): Promise<void> => {
  await AsyncStorage.removeItem(CLAVE_SESION);
};
