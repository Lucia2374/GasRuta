import { colores } from "@/constants/colores";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  idTipoCliente: number;
};

// Etiqueta de color que muestra si un cliente es Hogar veredal (1) o
// Establecimiento comercial (2).
const EtiquetaTipo = ({ idTipoCliente }: Props) => {
  const esHogar = idTipoCliente === 1;

  return (
    <View
      style={[style.etiqueta, { backgroundColor: esHogar ? colores.hogar : colores.negocio }]}
    >
      <Text style={[style.texto, { color: esHogar ? colores.hogarTexto : colores.negocioTexto }]}>
        {esHogar ? "🏠 Hogar" : "🏪 Negocio"}
      </Text>
    </View>
  );
};

const style = StyleSheet.create({
  etiqueta: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  texto: {
    fontSize: 13,
    fontWeight: "bold",
  },
});

export default EtiquetaTipo;
