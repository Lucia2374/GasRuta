import { colores } from "@/constants/colores";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

type Props = {
  children: ReactNode;
};

// Fondo con degradado verde que ocupa toda la pantalla. Se usa en el login
// y en el encabezado de Inicio para dar la apariencia de app de finanzas.
const FondoDegradado = ({ children }: Props) => {
  return (
    <LinearGradient
      colors={[colores.degradadoInicio, colores.degradadoMedio, colores.degradadoFin]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={style.degradado}
    >
      {children}
    </LinearGradient>
  );
};

const style = StyleSheet.create({
  degradado: {
    flex: 1,
  },
});

export default FondoDegradado;
