import FormularioCliente from "@/components/formulario-cliente";
import { colores } from "@/constants/colores";
import { registrarCliente, type DatosCliente } from "@/database/clientes";
import { useSesion } from "@/hooks/use-sesion";
import { avisar } from "@/utils/alerta";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ScrollView, StyleSheet } from "react-native";

// Pantalla para registrar un cliente nuevo (HU-04).
const NuevoCliente = () => {
  const db = useSQLiteContext();
  useSesion(); // protege la pantalla: si no hay sesion, manda al login.

  const guardar = async (datos: DatosCliente) => {
    const clienteGuardado = await registrarCliente(db, datos);
    avisar("Cliente guardado", `${clienteGuardado.nombre} quedó registrado.`);
    router.back();
  };

  return (
    <ScrollView style={style.contenedor} contentContainerStyle={style.contenido}>
      <FormularioCliente onGuardar={guardar} textoBoton="Guardar cliente" />
    </ScrollView>
  );
};

const style = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: 20,
  },
});

export default NuevoCliente;
