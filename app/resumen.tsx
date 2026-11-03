import FondoDegradado from "@/components/fondo-degradado";
import Tarjeta from "@/components/tarjeta";
import { colores } from "@/constants/colores";
import { listarPrestamosActivos, type PrestamoActivo } from "@/database/prestamos";
import { cilindrosPorPeso, totalesDelDia } from "@/database/ventas";
import { useSesion } from "@/hooks/use-sesion";
import { diasDesde, formatoFecha, formatoPesos } from "@/utils/formato";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Totales = { total: number; cantidad: number; totalDescuentos: number };
type CilindroPeso = { descripcion: string; cantidad: number };

// Resumen del dia: cuanto se vendio, cuantos cilindros de cada peso y
// cuantos prestamos siguen pendientes (HU-14).
const Resumen = () => {
  const db = useSQLiteContext();
  useSesion();

  const [cargando, setCargando] = useState(true);
  const [totales, setTotales] = useState<Totales>({
    total: 0,
    cantidad: 0,
    totalDescuentos: 0,
  });
  const [cilindros, setCilindros] = useState<CilindroPeso[]>([]);
  const [prestamos, setPrestamos] = useState<PrestamoActivo[]>([]);

  const cargarResumen = useCallback(async () => {
    const hoy = Date.now();
    const [totalesHoy, cilindrosHoy, prestamosActivos] = await Promise.all([
      totalesDelDia(db, hoy),
      cilindrosPorPeso(db, hoy),
      listarPrestamosActivos(db),
    ]);

    setTotales(totalesHoy);
    setCilindros(cilindrosHoy);
    setPrestamos(prestamosActivos);
    setCargando(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      cargarResumen();
    }, [cargarResumen])
  );

  if (cargando) {
    return (
      <View style={style.contenedorCentrado}>
        <Text style={style.textoSuave}>Cargando resumen...</Text>
      </View>
    );
  }

  const hayVentas = totales.cantidad > 0;
  const maximoCantidad = Math.max(1, ...cilindros.map((c) => c.cantidad));

  return (
    <ScrollView style={style.contenedor} contentContainerStyle={style.contenido}>
      <View style={style.tarjetaDegradado}>
        <FondoDegradado>
          <View style={style.contenidoDegradado}>
            <Text style={style.fecha}>{formatoFecha(Date.now())}</Text>
            {hayVentas ? (
              <>
                <Text style={style.totalGrande}>{formatoPesos(totales.total)}</Text>
                <Text style={style.subtexto}>
                  {totales.cantidad} venta{totales.cantidad === 1 ? "" : "s"} ·{" "}
                  {formatoPesos(totales.totalDescuentos)} en descuentos
                </Text>
              </>
            ) : (
              <Text style={style.avisoVacio}>Aún no hay ventas hoy</Text>
            )}
          </View>
        </FondoDegradado>
      </View>

      <Tarjeta estilo={style.tarjetaBarras}>
        <Text style={style.tituloSeccion}>Cilindros vendidos por peso</Text>
        <View style={style.bloqueBarras}>
          {cilindros.map((cilindro) => (
            <View key={cilindro.descripcion} style={style.filaBarra}>
              <Text style={style.etiquetaBarra}>{cilindro.descripcion}</Text>
              <View style={style.pistaBarra}>
                <View
                  style={[
                    style.barra,
                    { width: `${(cilindro.cantidad / maximoCantidad) * 100}%` },
                  ]}
                />
              </View>
              <Text style={style.cantidadBarra}>{cilindro.cantidad}</Text>
            </View>
          ))}
        </View>
      </Tarjeta>

      <Tarjeta>
        <Text style={style.tituloSeccion}>Préstamos pendientes</Text>
        {prestamos.length === 0 ? (
          <Text style={style.vacio}>No hay préstamos pendientes.</Text>
        ) : (
          <View style={style.bloquePrestamos}>
            {prestamos.map((prestamo) => (
              <Text key={prestamo.id_prestamo} style={style.filaPrestamo}>
                {prestamo.nombre_cliente} · {prestamo.descripcion_peso} · hace{" "}
                {diasDesde(prestamo.fecha_prestamo)} día
                {diasDesde(prestamo.fecha_prestamo) === 1 ? "" : "s"}
              </Text>
            ))}
          </View>
        )}
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
    gap: 16,
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tarjetaDegradado: {
    height: 180,
    borderRadius: 22,
    overflow: "hidden",
  },
  contenidoDegradado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 16,
  },
  fecha: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  totalGrande: {
    fontSize: 34,
    fontWeight: "bold",
    color: colores.blanco,
  },
  subtexto: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  avisoVacio: {
    fontSize: 20,
    fontWeight: "600",
    color: colores.blanco,
  },
  tarjetaBarras: {
    gap: 12,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 6,
  },
  bloqueBarras: {
    gap: 10,
  },
  filaBarra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  etiquetaBarra: {
    width: 58,
    fontSize: 14,
    color: colores.texto,
  },
  pistaBarra: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: colores.primarioClaro,
    overflow: "hidden",
  },
  barra: {
    height: "100%",
    backgroundColor: colores.acento,
    borderRadius: 8,
  },
  cantidadBarra: {
    width: 28,
    fontSize: 14,
    fontWeight: "bold",
    color: colores.texto,
    textAlign: "right",
  },
  bloquePrestamos: {
    gap: 6,
  },
  filaPrestamo: {
    fontSize: 15,
    color: colores.texto,
  },
  vacio: {
    fontSize: 15,
    color: colores.textoSuave,
  },
  textoSuave: {
    fontSize: 18,
    color: colores.textoSuave,
  },
});

export default Resumen;
