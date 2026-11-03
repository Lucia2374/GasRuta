import { colores } from "@/constants/colores";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  texto: string;
  seleccionado: boolean;
  onPress: () => void;
};

// Boton con forma de pildora. Se usa para elegir opciones como el tipo de
// cliente o un filtro de la lista.
const Chip = ({ texto, seleccionado, onPress }: Props) => {
  return (
    <Pressable
      onPress={onPress}
      style={[style.chip, seleccionado && style.chipSeleccionado]}
    >
      <Text style={[style.texto, seleccionado && style.textoSeleccionado]}>
        {texto}
      </Text>
    </Pressable>
  );
};

const style = StyleSheet.create({
  chip: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colores.primario,
    backgroundColor: colores.primarioClaro,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chipSeleccionado: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  texto: {
    fontSize: 15,
    color: colores.primarioOscuro,
    fontWeight: "600",
  },
  textoSeleccionado: {
    color: colores.blanco,
  },
});

export default Chip;
