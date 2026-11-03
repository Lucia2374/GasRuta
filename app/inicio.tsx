import Boton from "@/components/boton";
import FondoDegradado from "@/components/fondo-degradado";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import { listarPrestamosActivos } from "@/database/prestamos";
import { totalesDelDia } from "@/database/ventas";
import { useSesion } from "@/hooks/use-sesion";
import { formatoPesos } from "@/utils/formato";
import { cerrarSesion } from "@/utils/sesion";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Accceso = {
  texto: string;
  icono: string;
  onPress: () => void;
};

// Pantalla principal despues de iniciar sesion. Desde aqui se entra a los
// demas modulos de la app.
const Inicio = () => {
  const db = useSQLiteContext();
  const { sesion, cargando } = useSesion();

  const [totalHoy, setTotalHoy] = useState(0);
  const [ventasHoy, setVentasHoy] = useState(0);
  const [prestamosActivos, setPrestamosActivos] = useState(0);

  const cargarResumenDelDia = useCallback(async () => {
    const [totales, prestamos] = await Promise.all([
      totalesDelDia(db, Date.now()),
      listarPrestamosActivos(db),
    ]);
    setTotalHoy(totales.total);
    setVentasHoy(totales.cantidad);
    setPrestamosActivos(prestamos.length);
  }, [db]);

  // Se recarga cada vez que se vuelve al inicio (por ejemplo, despues de
  // registrar una venta o un prestamo).
  useFocusEffect(
    useCallback(() => {
      cargarResumenDelDia();
    }, [cargarResumenDelDia])
  );

  const manejarCerrarSesion = async () => {
    await cerrarSesion();
    router.replace("/");
  };

  if (cargando || !sesion) {
    return (
      <View style={style.contenedorCentrado}>
        <Text style={style.textoSuave}>Cargando...</Text>
      </View>
    );
  }

  const esTitular = sesion.rol === "TITULAR";

  const accesos: Accceso[] = [
    { texto: "Clientes", icono: "👥", onPress: () => router.push("/clientes/index") },
    { texto: "Préstamos", icono: "🧰", onPress: () => router.push("/prestamos/index") },
    { texto: "Resumen del día", icono: "📊", onPress: () => router.push("/resumen") },
    { texto: "Precios", icono: "🏷️", onPress: () => router.push("/precios") },
  ];
  if (esTitular) {
    accesos.push({ texto: "Usuarios", icono: "⚙️", onPress: () => router.push("/usuarios") });
  }

  return (
    <View style={style.pantalla}>
      <View style={style.encabezado}>
        <FondoDegradado>
          <View style={style.contenidoEncabezado}>
            <Text style={style.saludo}>Hola, {sesion.nombre}</Text>
            <Text style={style.rol}>{esTitular ? "Titular del negocio" : "Asistente"}</Text>
            <View style={style.pildoraSinConexion}>
              <View style={style.puntoAcento} />
              <Text style={style.textoPildora}>Sin conexión · todo se guarda en el celular</Text>
            </View>
          </View>
        </FondoDegradado>
      </View>

      <ScrollView style={style.contenedor} contentContainerStyle={style.contenido}>
        <Tarjeta estilo={style.tarjetaDia}>
          <Text style={style.tituloTarjetaDia}>Ventas de hoy</Text>
          <Text style={style.totalDia}>{formatoPesos(totalHoy)}</Text>
          <Text style={style.subtextoDia}>
            {ventasHoy} cilindro{ventasHoy === 1 ? "" : "s"} · {prestamosActivos} préstamo
            {prestamosActivos === 1 ? "" : "s"} activo{prestamosActivos === 1 ? "" : "s"}
          </Text>
        </Tarjeta>

        <Boton texto="🛒 Nueva venta" onPress={() => router.push("/ventas/nueva")} />

        <View style={style.cuadricula}>
          {accesos.map((acceso) => (
            <Pressable
              key={acceso.texto}
              style={style.tarjetaAcceso}
              onPress={acceso.onPress}
            >
              <Text style={style.iconoAcceso}>{acceso.icono}</Text>
              <Text style={style.textoAcceso}>{acceso.texto}</Text>
            </Pressable>
          ))}
        </View>

        <Boton
          texto="Cerrar sesión"
          variante="secundario"
          onPress={manejarCerrarSesion}
        />
      </ScrollView>
    </View>
  );
};

const style = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  encabezado: {
    height: 220,
  },
  contenidoEncabezado: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    gap: 6,
  },
  saludo: {
    fontSize: 28,
    fontWeight: "bold",
    color: colores.blanco,
  },
  rol: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
  },
  pildoraSinConexion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  puntoAcento: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colores.acento,
  },
  textoPildora: {
    fontSize: 13,
    fontWeight: "600",
    color: colores.blanco,
  },
  contenedor: {
    flex: 1,
    marginTop: -60,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  tarjetaDia: {
    alignItems: "center",
    gap: 2,
  },
  tituloTarjetaDia: {
    fontSize: 13,
    fontWeight: "600",
    color: colores.textoSuave,
  },
  totalDia: {
    fontSize: 34,
    fontWeight: "bold",
    color: colores.primario,
  },
  subtextoDia: {
    fontSize: 13,
    color: colores.textoSuave,
  },
  cuadricula: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tarjetaAcceso: {
    width: "47%",
    backgroundColor: colores.vidrio,
    borderWidth: 1,
    borderColor: colores.vidrioBorde,
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconoAcceso: {
    fontSize: 30,
  },
  textoAcceso: {
    fontSize: 16,
    fontWeight: "600",
    color: colores.texto,
  },
  textoSuave: {
    fontSize: 18,
    color: colores.textoSuave,
  },
});

export default Inicio;
