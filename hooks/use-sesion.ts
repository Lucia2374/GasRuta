import { leerSesion, type SesionGuardada } from "@/utils/sesion";
import { router } from "expo-router";
import { useEffect, useState } from "react";

// Hook que reutilizan las pantallas protegidas (inicio, usuarios, clientes,
// precios). Lee la sesion guardada y, si no existe, manda de vuelta al login.
export const useSesion = () => {
  const [sesion, setSesion] = useState<SesionGuardada | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const verificar = async () => {
      const datos = await leerSesion();
      if (!datos) {
        router.replace("/");
        return;
      }
      setSesion(datos);
      setCargando(false);
    };

    verificar();
  }, []);

  return { sesion, cargando };
};

export default useSesion;
