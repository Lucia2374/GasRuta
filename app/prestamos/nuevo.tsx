import Boton from "@/components/boton";
import Chip from "@/components/chip";
import SelectorCliente from "@/components/selector-cliente";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import type { Cliente } from "@/database/clientes";
import { listarPesos, type Peso } from "@/database/precios";
import { registrarPrestamo } from "@/database/prestamos";
import { useSesion } from "@/hooks/use-sesion";
import { avisar } from "@/utils/alerta";
import { formatoFecha } from "@/utils/formato";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// Registrar un prestamo de cilindro que no viene de una venta
// (por ejemplo, cambiar un cilindro vacio por uno lleno).
const NuevoPrestamo = () => {
  const db = useSQLiteContext();
  const { sesion } = useSesion();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pesos, setPesos] = useState<Peso[]>([]);
  const [idPeso, setIdPeso] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    listarPesos(db).then(setPesos);
  }, [db]);

  const pesoElegido = pesos.find((p) => p.id_peso === idPeso) ?? null;

  const manejarGuardar = async () => {
    if (!cliente || idPeso === null || !sesion) {
      setMensajeError("Elige el cliente y el cilindro.");
      return;
    }

    setMensajeError("");
    setGuardando(true);
    try {
      await registrarPrestamo(db, {
        idCliente: cliente.id_cliente,
        idPeso,
        idUsuario: sesion.id_usuario,
      });

      avisar(
        "Préstamo registrado",
        `${cliente.nombre} se llevó un cilindro de ${pesoElegido?.descripcion}.`
      );
      router.back();
    } catch (error) {
      setMensajeError(
        error instanceof Error ? error.message : "No se pudo registrar el préstamo."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={style.contenedor} contentContainerStyle={style.contenido}>
      <Tarjeta estilo={style.tarjeta}>
        <View>
          <Text style={style.etiqueta}>Cliente</Text>
          <SelectorCliente onSeleccionar={setCliente} />
        </View>

        <View>
          <Text style={style.etiqueta}>Cilindro</Text>
          <View style={style.filaChips}>
            {pesos.map((peso) => (
              <Chip
                key={peso.id_peso}
                texto={peso.descripcion}
                seleccionado={idPeso === peso.id_peso}
                onPress={() => setIdPeso(peso.id_peso)}
              />
            ))}
          </View>
        </View>

        <Text style={style.fecha}>Fecha del préstamo: {formatoFecha(Date.now())}</Text>

        {mensajeError.length > 0 && <Text style={style.mensajeError}>{mensajeError}</Text>}

        <Boton
          texto={guardando ? "Guardando..." : "Registrar préstamo"}
          onPress={manejarGuardar}
          deshabilitado={guardando}
        />
      </Tarjeta>
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
  tarjeta: {
    gap: 18,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: "600",
    color: colores.textoSuave,
    marginBottom: 8,
  },
  filaChips: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  fecha: {
    fontSize: 15,
    color: colores.textoSuave,
  },
  mensajeError: {
    color: colores.error,
    fontSize: 15,
  },
});

export default NuevoPrestamo;
