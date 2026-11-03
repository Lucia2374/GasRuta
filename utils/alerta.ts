import { Alert, Platform } from "react-native";

// En el celular (Android/iOS) esto usa exactamente Alert.alert de React
// Native, como pide el profesor. En el navegador, Alert.alert no hace nada
// (es un comportamiento conocido de react-native-web: su Alert.alert esta
// vacio), asi que ahi usamos los dialogos propios del navegador para que
// los avisos y las confirmaciones tambien funcionen al probar la app ahi.

// Aviso simple, con un solo boton para cerrar.
export const avisar = (titulo: string, mensaje: string): void => {
  if (Platform.OS === "web") {
    window.alert(`${titulo}\n\n${mensaje}`);
    return;
  }
  Alert.alert(titulo, mensaje);
};

// Pregunta con "Cancelar" y un boton de accion. Si se confirma, ejecuta
// alConfirmar. Se usa para las acciones que no se pueden deshacer.
export const confirmar = (
  titulo: string,
  mensaje: string,
  textoConfirmar: string,
  alConfirmar: () => void
): void => {
  if (Platform.OS === "web") {
    if (window.confirm(`${titulo}\n\n${mensaje}`)) {
      alConfirmar();
    }
    return;
  }

  Alert.alert(titulo, mensaje, [
    { text: "Cancelar", style: "cancel" },
    { text: textoConfirmar, onPress: alConfirmar },
  ]);
};
