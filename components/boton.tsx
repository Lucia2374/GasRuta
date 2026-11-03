import { colores } from "@/constants/colores";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  texto: string;
  onPress: () => void;
  variante?: "primario" | "secundario" | "peligro";
  deshabilitado?: boolean;
};

// Boton grande en forma de pildora, facil de tocar para usuarios con poca
// experiencia con el celular. La variante secundaria se usa para acciones
// menos importantes, y la de peligro para acciones que no se pueden
// deshacer (como eliminar un cliente).
const Boton = ({ texto, onPress, variante = "primario", deshabilitado = false }: Props) => {
  const esSecundario = variante === "secundario";
  const esPeligro = variante === "peligro";

  const estiloBoton = esPeligro
    ? style.botonPeligro
    : esSecundario
      ? style.botonSecundario
      : style.botonPrimario;

  const estiloTexto = esSecundario ? style.textoSecundario : style.textoPrimario;

  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        style.boton,
        estiloBoton,
        deshabilitado && style.botonDeshabilitado,
        pressed && !deshabilitado && style.botonPresionado,
      ]}
    >
      <Text style={estiloTexto}>{texto}</Text>
    </Pressable>
  );
};

const style = StyleSheet.create({
  boton: {
    minHeight: 54,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  botonPrimario: {
    backgroundColor: colores.primario,
  },
  botonSecundario: {
    backgroundColor: colores.blanco,
    borderWidth: 2,
    borderColor: colores.primario,
  },
  botonPeligro: {
    backgroundColor: colores.error,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  botonPresionado: {
    opacity: 0.8,
  },
  textoPrimario: {
    color: colores.blanco,
    fontSize: 17,
    fontWeight: "bold",
  },
  textoSecundario: {
    color: colores.primario,
    fontSize: 17,
    fontWeight: "bold",
  },
});

export default Boton;
