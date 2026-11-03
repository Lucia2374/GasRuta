import { colores } from "@/constants/colores";
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";

type Props = {
  etiqueta: string;
  valor: string;
  onCambiar: (texto: string) => void;
  marcarError?: boolean;
  esContrasena?: boolean;
  teclado?: KeyboardTypeOptions;
  capitalizar?: "none" | "words" | "sentences";
  marcadorDePosicion?: string;
};

// Campo de formulario reutilizable: una etiqueta arriba y un TextInput con
// fondo "vidrio" abajo. Cuando marcarError es true el borde se pone rojo.
const Campo = ({
  etiqueta,
  valor,
  onCambiar,
  marcarError = false,
  esContrasena = false,
  teclado = "default",
  capitalizar = "none",
  marcadorDePosicion,
}: Props) => {
  return (
    <View style={style.contenedor}>
      <Text style={style.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[style.input, marcarError && style.inputError]}
        value={valor}
        onChangeText={onCambiar}
        secureTextEntry={esContrasena}
        keyboardType={teclado}
        autoCapitalize={capitalizar}
        placeholder={marcadorDePosicion}
        placeholderTextColor={colores.textoSuave}
      />
    </View>
  );
};

const style = StyleSheet.create({
  contenedor: {
    gap: 6,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: "600",
    color: colores.textoSuave,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 18,
    color: colores.texto,
    backgroundColor: colores.vidrio,
  },
  inputError: {
    borderColor: colores.error,
  },
});

export default Campo;
