import Boton from "@/components/boton";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import { cerrarPrestamo, listarPrestamosActivos, type PrestamoActivo } from "@/database/prestamos";
import { useSesion } from "@/hooks/use-sesion";
import { confirmar } from "@/utils/alerta";
import { diasDesde, formatoFecha } from "@/utils/formato";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

const DIAS_PARA_AVISO = 7;

// Lista de cilindros prestados que todavia no han vuelto (HU-12 y HU-13).
const ListaPrestamos = () => {
  const db = useSQLiteContext();
  useSesion();

  const [prestamos, setPrestamos] = useState<PrestamoActivo[]>([]);

  const cargarPrestamos = useCallback(async () => {
    const lista = await listarPrestamosActivos(db);
    setPrestamos(lista);
  }, [db]);

  // Se recarga cada vez que se entra a esta pantalla (por ejemplo, al
  // volver de registrar un prestamo nuevo).
  useFocusEffect(
    useCallback(() => {
      cargarPrestamos();
    }, [cargarPrestamos])
  );

  const manejarCerrar = (idPrestamo: number, nombreCliente: string) => {
    confirmar(
      "Cerrar préstamo",
      `¿Seguro que ${nombreCliente} ya devolvió el cilindro?`,
      "Sí, cerrar préstamo",
      async () => {
        await cerrarPrestamo(db, idPrestamo);
        cargarPrestamos();
      }
    );
  };

  return (
    <View style={style.contenedor}>
      <Tarjeta estilo={style.tarjetaResumen}>
        <Text style={style.tarjetaNumero}>{prestamos.length}</Text>
        <Text style={style.tarjetaTexto}>
          cilindro{prestamos.length === 1 ? "" : "s"} por recuperar
        </Text>
      </Tarjeta>

      <FlatList
        data={prestamos}
        keyExtractor={(item) => String(item.id_prestamo)}
        contentContainerStyle={style.lista}
        ListEmptyComponent={
          <Text style={style.vacio}>No hay préstamos activos.</Text>
        }
        renderItem={({ item }) => {
          const dias = diasDesde(item.fecha_prestamo);
          const atrasado = dias >= DIAS_PARA_AVISO;

          return (
            <View style={style.fila}>
              <View style={style.filaTexto}>
                <Text style={style.nombre}>{item.nombre_cliente}</Text>
                <Text style={style.detalle}>
                  {item.direccion_vereda} · {item.descripcion_peso}
                </Text>
                <Text style={style.detalle}>{formatoFecha(item.fecha_prestamo)}</Text>
                <View
                  style={[
                    style.pildoraDias,
                    atrasado ? style.pildoraAtrasada : style.pildoraNormal,
                  ]}
                >
                  <Text
                    style={[
                      style.pildoraTexto,
                      atrasado ? style.pildoraTextoAtrasado : style.pildoraTextoNormal,
                    ]}
                  >
                    hace {dias} día{dias === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
              <Boton
                texto="Cerrar"
                variante="secundario"
                onPress={() => manejarCerrar(item.id_prestamo, item.nombre_cliente)}
              />
            </View>
          );
        }}
      />

      <View style={style.pieFijo}>
        <Boton texto="+ Registrar préstamo" onPress={() => router.push("/prestamos/nuevo")} />
      </View>
    </View>
  );
};

const style = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
    padding: 20,
    gap: 16,
  },
  tarjetaResumen: {
    alignItems: "center",
  },
  tarjetaNumero: {
    fontSize: 34,
    fontWeight: "bold",
    color: colores.primario,
  },
  tarjetaTexto: {
    fontSize: 15,
    color: colores.textoSuave,
  },
  lista: {
    gap: 10,
    paddingBottom: 10,
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
    gap: 10,
  },
  filaTexto: {
    flex: 1,
    gap: 4,
  },
  nombre: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.texto,
  },
  detalle: {
    fontSize: 14,
    color: colores.textoSuave,
  },
  pildoraDias: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  pildoraNormal: {
    backgroundColor: colores.primarioClaro,
  },
  pildoraAtrasada: {
    backgroundColor: "#FBE6C8",
  },
  pildoraTexto: {
    fontSize: 12,
    fontWeight: "bold",
  },
  pildoraTextoNormal: {
    color: colores.primarioOscuro,
  },
  pildoraTextoAtrasado: {
    color: colores.alerta,
  },
  pieFijo: {
    paddingTop: 4,
  },
});

export default ListaPrestamos;
