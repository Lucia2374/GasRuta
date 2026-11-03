import { colores } from "@/constants/colores";
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  estilo?: ViewStyle;
};

// Tarjeta tipo "vidrio": fondo blanco semitransparente, esquinas muy
// redondeadas y borde claro. Se usa para totales, listas y formularios.
const Tarjeta = ({ children, estilo }: Props) => {
  return <View style={[style.tarjeta, estilo]}>{children}</View>;
};

const style = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.vidrio,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colores.vidrioBorde,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default Tarjeta;
