import { colores } from "@/constants/colores";
import { listarClientes, type Cliente } from "@/database/clientes";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const MAXIMO_RESULTADOS = 6;

type Props = {
  onSeleccionar: (cliente: Cliente | null) => void;
};

// Buscador de clientes: escribes y se muestran hasta 6 resultados.
// Al tocar uno queda seleccionado; tocando la tarjeta seleccionada se
// puede volver a buscar y cambiar de cliente.
const SelectorCliente = ({ onSeleccionar }: Props) => {
  const db = useSQLiteContext();
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);

  useEffect(() => {
    if (seleccionado) {
      return;
    }

    const buscar = async () => {
      const lista = await listarClientes(db, { texto, limite: MAXIMO_RESULTADOS });
      setResultados(lista);
    };

    buscar();
  }, [db, texto, seleccionado]);

  const elegir = (cliente: Cliente) => {
    setSeleccionado(cliente);
    onSeleccionar(cliente);
  };

  const cambiarCliente = () => {
    setSeleccionado(null);
    setTexto("");
    onSeleccionar(null);
  };

  if (seleccionado) {
    return (
      <Pressable style={style.tarjetaSeleccionada} onPress={cambiarCliente}>
        <Text style={style.nombreSeleccionado}>{seleccionado.nombre}</Text>
        <Text style={style.vereda}>{seleccionado.direccion_vereda}</Text>
        <Text style={style.ayuda}>Tocar para cambiar de cliente</Text>
      </Pressable>
    );
  }

  return (
    <View style={style.contenedor}>
      <View style={style.buscador}>
        <Text style={style.icono}>🔍</Text>
        <TextInput
          style={style.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Buscar cliente por nombre o vereda"
          placeholderTextColor={colores.textoSuave}
        />
      </View>
      <FlatList
        data={resultados}
        keyExtractor={(item) => String(item.id_cliente)}
        // Nunca son mas de 6 resultados, por eso no necesita scroll propio:
        // asi evitamos problemas de listas anidadas dentro de un ScrollView.
        scrollEnabled={false}
        style={style.lista}
        ListEmptyComponent={
          <Text style={style.vacio}>No hay clientes que coincidan.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={style.fila} onPress={() => elegir(item)}>
            <Text style={style.nombre}>{item.nombre}</Text>
            <Text style={style.vereda}>{item.direccion_vereda}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const style = StyleSheet.create({
  contenedor: {
    gap: 10,
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
  lista: {
    gap: 8,
  },
  vacio: {
    fontSize: 15,
    color: colores.textoSuave,
    paddingVertical: 10,
  },
  fila: {
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  nombre: {
    fontSize: 16,
    fontWeight: "bold",
    color: colores.texto,
  },
  vereda: {
    fontSize: 14,
    color: colores.textoSuave,
  },
  tarjetaSeleccionada: {
    backgroundColor: colores.primarioClaro,
    borderWidth: 1,
    borderColor: colores.primario,
    borderRadius: 16,
    padding: 14,
    gap: 2,
  },
  nombreSeleccionado: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.texto,
  },
  ayuda: {
    fontSize: 13,
    color: colores.primario,
    marginTop: 6,
  },
});

export default SelectorCliente;
