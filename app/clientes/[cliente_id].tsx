import Boton from "@/components/boton";
import FormularioCliente from "@/components/formulario-cliente";
import { colores } from "@/constants/colores";
import {
  editarCliente,
  eliminarCliente,
  obtenerCliente,
  type Cliente,
  type DatosCliente,
} from "@/database/clientes";
import { useSesion } from "@/hooks/use-sesion";
import { avisar, confirmar } from "@/utils/alerta";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// Pantalla para editar un cliente ya existente (HU-06), con la opcion de
// eliminarlo. El id del cliente llega como parametro de la ruta dinamica
// [cliente_id].
const EditarCliente = () => {
  const { cliente_id } = useLocalSearchParams<{ cliente_id: string }>();
  const db = useSQLiteContext();
  useSesion();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  useEffect(() => {
    const cargarCliente = async () => {
      const datos = await obtenerCliente(db, Number(cliente_id));
      setCliente(datos);
      setCargando(false);
    };

    cargarCliente();
  }, [db, cliente_id]);

  const guardar = async (datos: DatosCliente) => {
    await editarCliente(db, Number(cliente_id), datos);
    avisar("Cliente actualizado", `${datos.nombre} quedó actualizado.`);
    router.back();
  };

  const manejarEliminar = () => {
    if (!cliente) {
      return;
    }

    confirmar(
      "Eliminar cliente",
      `¿Seguro que quieres eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`,
      "Eliminar",
      async () => {
        setErrorEliminar("");
        setEliminando(true);
        try {
          await eliminarCliente(db, Number(cliente_id));
          avisar("Cliente eliminado", `${cliente.nombre} fue eliminado.`);
          router.back();
        } catch (error) {
          setErrorEliminar(
            error instanceof Error ? error.message : "No se pudo eliminar el cliente."
          );
          setEliminando(false);
        }
      }
    );
  };

  if (cargando) {
    return (
      <View style={style.contenedorCentrado}>
        <Text style={style.textoSuave}>Cargando cliente...</Text>
      </View>
    );
  }

  if (!cliente) {
    return (
      <View style={style.contenedorCentrado}>
        <Text style={style.textoSuave}>No se encontró el cliente.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={style.contenedor} contentContainerStyle={style.contenido}>
      <FormularioCliente
        valoresIniciales={{
          nombre: cliente.nombre,
          direccionVereda: cliente.direccion_vereda,
          idTipoCliente: cliente.id_tipo_cliente,
        }}
        textoBoton="Guardar cambios"
        onGuardar={guardar}
      />

      {errorEliminar.length > 0 && (
        <Text style={style.mensajeError}>{errorEliminar}</Text>
      )}

      <Boton
        texto={eliminando ? "Eliminando..." : "Eliminar cliente"}
        variante="peligro"
        deshabilitado={eliminando}
        onPress={manejarEliminar}
      />
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
    gap: 16,
  },
  mensajeError: {
    color: colores.error,
    fontSize: 15,
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  textoSuave: {
    fontSize: 18,
    color: colores.textoSuave,
  },
});

export default EditarCliente;
