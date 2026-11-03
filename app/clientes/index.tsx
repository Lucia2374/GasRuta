import Chip from "@/components/chip";
import EtiquetaTipo from "@/components/etiqueta-tipo";
import { colores } from "@/constants/colores";
import { listarClientes, type Cliente } from "@/database/clientes";
import { useSesion } from "@/hooks/use-sesion";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Filtro = "todos" | "hogares" | "negocios";

// Lista de clientes con buscador y filtro por tipo (HU-05).
const ListaClientes = () => {
  const db = useSQLiteContext();
  useSesion();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const idTipoClienteDelFiltro = (f: Filtro) =>
    f === "hogares" ? 1 : f === "negocios" ? 2 : undefined;

  const cargarClientes = useCallback(async () => {
    const lista = await listarClientes(db, {
      texto,
      idTipoCliente: idTipoClienteDelFiltro(filtro),
    });
    setClientes(lista);
  }, [db, texto, filtro]);

  // Se recarga cada vez que cambia la busqueda o el filtro.
  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Y tambien cada vez que se vuelve a esta pantalla despues de
  // registrar o editar un cliente.
  useFocusEffect(
    useCallback(() => {
      cargarClientes();
    }, [cargarClientes])
  );

  return (
    <View style={style.contenedor}>
      <View style={style.buscador}>
        <Text style={style.icono}>🔍</Text>
        <TextInput
          style={style.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Buscar por nombre o vereda"
          placeholderTextColor={colores.textoSuave}
        />
      </View>

      <View style={style.filaChips}>
        <Chip texto="Todos" seleccionado={filtro === "todos"} onPress={() => setFiltro("todos")} />
        <Chip texto="Hogares" seleccionado={filtro === "hogares"} onPress={() => setFiltro("hogares")} />
        <Chip texto="Negocios" seleccionado={filtro === "negocios"} onPress={() => setFiltro("negocios")} />
      </View>

      <FlatList
        data={clientes}
        keyExtractor={(item) => String(item.id_cliente)}
        contentContainerStyle={style.lista}
        ListEmptyComponent={
          <Text style={style.vacio}>No hay clientes que coincidan con la búsqueda.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={style.fila}
            onPress={() =>
              router.push({
                pathname: "/clientes/[cliente_id]",
                params: { cliente_id: String(item.id_cliente) },
              })
            }
          >
            <View style={style.filaTexto}>
              <Text style={style.nombre}>{item.nombre}</Text>
              <Text style={style.vereda}>{item.direccion_vereda}</Text>
            </View>
            <EtiquetaTipo idTipoCliente={item.id_tipo_cliente} />
          </Pressable>
        )}
      />

      <Pressable style={style.flotante} onPress={() => router.push("/clientes/nuevo")}>
        <Text style={style.flotanteTexto}>+</Text>
      </Pressable>
    </View>
  );
};

const style = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
    padding: 20,
    gap: 12,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: colores.vidrio,
  },
  icono: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colores.texto,
    minHeight: 52,
  },
  filaChips: {
    flexDirection: "row",
    gap: 10,
  },
  lista: {
    paddingBottom: 90,
    gap: 10,
  },
  vacio: {
    fontSize: 16,
    color: colores.textoSuave,
    textAlign: "center",
    marginTop: 30,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.vidrioBorde,
    borderRadius: 18,
    padding: 14,
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.texto,
  },
  vereda: {
    fontSize: 14,
    color: colores.textoSuave,
  },
  flotante: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colores.primario,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  flotanteTexto: {
    color: colores.blanco,
    fontSize: 30,
    fontWeight: "bold",
    lineHeight: 32,
  },
});

export default ListaClientes;
